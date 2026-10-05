import { DoctorModel } from "@/models";
import { connectDB } from "@/lib/db";
import { getAuth,can } from "@/lib/rbac";
import { ok,fail } from "@/lib/api";
import { sanitizeLocalizedHtml } from "@/lib/sanitize";
import { z } from "zod";
import { seoInput } from "@/lib/validators";

const localized=z.object({fa:z.string().max(5000).optional(),en:z.string().max(5000).optional()});
const text=z.object({fa:z.string().max(100000).optional(),en:z.string().max(100000).optional()});
const certificate=z.object({title:localized,issuer:localized,year:z.number().int().optional(),mediaId:z.string().optional().nullable()});
const course=z.object({title:localized,provider:localized,year:z.number().int().optional()});
const credential=z.object({title:localized,description:text});
const input=z.object({
  slug:z.string().trim().min(1).max(160),name:localized,shortBio:text.optional(),bio:text.optional(),
  photoMediaId:z.string().nullable().optional(),cv:text.optional(),university:localized.optional(),
  certificates:z.array(certificate).optional(),courses:z.array(course).optional(),credentials:z.array(credential).optional(),
  services:z.array(z.string()).optional(),seo:seoInput.optional(),
  status:z.enum(["draft","published","scheduled","archived"]).optional(),
  publishedAt:z.coerce.date().nullable().optional(),scheduledAt:z.coerce.date().nullable().optional(),
}).partial();

function sanitizeDoctor(data:z.infer<typeof input>){
  return {
    ...data,
    shortBio:data.shortBio?sanitizeLocalizedHtml(data.shortBio):undefined,
    bio:data.bio?sanitizeLocalizedHtml(data.bio):undefined,
    cv:data.cv?sanitizeLocalizedHtml(data.cv):undefined,
    credentials:data.credentials?.map(item=>({...item,description:sanitizeLocalizedHtml(item.description)})),
  };
}

export async function GET(req:Request,{params}:{params:Promise<{id:string}>}){
  const a=await getAuth(req);if(!a||!can(String(a.role),"content:read"))return fail("Forbidden",403);
  try{await connectDB();const {id}=await params;const item=await DoctorModel.findById(id).lean();return item?ok(item):fail("Doctor not found",404);}
  catch(e){return fail(e instanceof Error?e.message:"Unable to load doctor",500);}
}
export async function PUT(req:Request,{params}:{params:Promise<{id:string}>}){
  const a=await getAuth(req);if(!a||!can(String(a.role),"content:write"))return fail("Forbidden",403);
  try{
    const parsed=input.safeParse(await req.json());if(!parsed.success)return fail("Invalid doctor payload",422,parsed.error.flatten());
    await connectDB();const {id}=await params;
    if(parsed.data.slug&&await DoctorModel.exists({slug:parsed.data.slug,_id:{$ne:id}}))return fail("Slug already exists",409);
    const item=await DoctorModel.findByIdAndUpdate(id,{$set:{...sanitizeDoctor(parsed.data),updatedBy:a.sub}},{new:true,runValidators:true}).lean();
    return item?ok(item):fail("Doctor not found",404);
  }catch(e){return fail(e instanceof Error?e.message:"Update failed",500);}
}
export async function DELETE(req:Request,{params}:{params:Promise<{id:string}>}){
  const a=await getAuth(req);if(!a||!can(String(a.role),"content:write"))return fail("Forbidden",403);
  try{await connectDB();const {id}=await params;const item=await DoctorModel.findByIdAndUpdate(id,{$set:{status:"archived",updatedBy:a.sub}},{new:true}).lean();return item?ok(item):fail("Doctor not found",404);}
  catch(e){return fail(e instanceof Error?e.message:"Archive failed",500);}
}
