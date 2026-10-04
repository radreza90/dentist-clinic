import { DoctorModel } from "@/models";
import { listContent } from "@/lib/content-crud";
import { connectDB } from "@/lib/db";
import { getAuth, can } from "@/lib/rbac";
import { ok, fail } from "@/lib/api";
import { z } from "zod";

const localized = z.object({ fa:z.string().max(5000).optional().default(""), en:z.string().max(5000).optional().default("") });
const doctorInput = z.object({
  slug:z.string().trim().min(1).max(160),
  name:localized,
  shortBio:localized.optional(),
  bio:localized.optional(),
  photoMediaId:z.string().optional().nullable(),
  cv:localized.optional(),
  university:localized.optional(),
  certificates:z.array(z.object({title:localized,issuer:localized,year:z.number().int().optional(),mediaId:z.string().optional()})).optional(),
  courses:z.array(z.object({title:localized,provider:localized,year:z.number().int().optional()})).optional(),
  credentials:z.array(z.object({title:localized,description:localized})).optional(),
  services:z.array(z.string()).optional(),
  status:z.enum(["draft","published","scheduled","archived"]).optional(),
});

export async function GET(req:Request){return listContent(req,DoctorModel);}
export async function POST(req:Request){
  const auth=await getAuth(req); if(!auth||!can(String(auth.role),"content:write"))return fail("Forbidden",403);
  try{
    const parsed=doctorInput.safeParse(await req.json()); if(!parsed.success)return fail("Invalid doctor payload",422,parsed.error.flatten());
    await connectDB(); if(await DoctorModel.exists({slug:parsed.data.slug}))return fail("Slug already exists",409);
    return ok(await DoctorModel.create({...parsed.data,createdBy:auth.sub,updatedBy:auth.sub}),201);
  }catch(e){return fail(e instanceof Error?e.message:"Create failed",500);}
}