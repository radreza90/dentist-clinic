import { DoctorModel } from "@/models";
import { listContent } from "@/lib/content-crud";
import { connectDB } from "@/lib/db";
import { getAuth, can } from "@/lib/rbac";
import { ok, fail } from "@/lib/api";
import { sanitizeLocalizedHtml } from "@/lib/sanitize";
import { z } from "zod";
import { seoInput } from "@/lib/validators";

const localized=z.object({fa:z.string().max(5000).optional().default(""),en:z.string().max(5000).optional().default("")});
const text=z.object({fa:z.string().max(100000).optional(),en:z.string().max(100000).optional()});
const certificate=z.object({title:localized,issuer:localized,year:z.number().int().optional(),mediaId:z.string().optional().nullable()});
const course=z.object({title:localized,provider:localized,year:z.number().int().optional()});
const credential=z.object({title:localized,description:text});
const doctorInput=z.object({
  slug:z.string().trim().min(1).max(160),name:localized,shortBio:text.optional(),bio:text.optional(),
  photoMediaId:z.string().optional().nullable(),cv:text.optional(),university:localized.optional(),
  certificates:z.array(certificate).optional(),courses:z.array(course).optional(),credentials:z.array(credential).optional(),
  services:z.array(z.string()).optional(),seo:seoInput.optional(),
  status:z.enum(["draft","published","scheduled","archived"]).optional(),
  publishedAt:z.coerce.date().nullable().optional(),scheduledAt:z.coerce.date().nullable().optional()
});

function sanitizeDoctor(data:z.infer<typeof doctorInput>){
  return {
    ...data,
    shortBio:data.shortBio?sanitizeLocalizedHtml(data.shortBio):undefined,
    bio:data.bio?sanitizeLocalizedHtml(data.bio):undefined,
    cv:data.cv?sanitizeLocalizedHtml(data.cv):undefined,
    credentials:data.credentials?.map(item=>({...item,description:sanitizeLocalizedHtml(item.description)})),
  };
}

export async function GET(req:Request){return listContent(req,DoctorModel);}
export async function POST(req:Request){
  const auth=await getAuth(req);if(!auth||!can(String(auth.role),"content:write"))return fail("Forbidden",403);
  try{
    const parsed=doctorInput.safeParse(await req.json());if(!parsed.success)return fail("Invalid doctor payload",422,parsed.error.flatten());
    await connectDB();if(await DoctorModel.exists({slug:parsed.data.slug}))return fail("Slug already exists",409);
    return ok(await DoctorModel.create({...sanitizeDoctor(parsed.data),createdBy:auth.sub,updatedBy:auth.sub}),201);
  }catch(e){return fail(e instanceof Error?e.message:"Create failed",500);}
}
