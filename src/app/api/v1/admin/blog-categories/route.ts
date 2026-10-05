import { BlogCategoryModel } from "@/models";
import { connectDB } from "@/lib/db";
import { getAuth, can } from "@/lib/rbac";
import { ok, fail } from "@/lib/api";
import { seoInput, localizedStringInput, localizedTextInput, contentQuery } from "@/lib/validators";
import { listContent } from "@/lib/content-crud";
import { z } from "zod";

const input=z.object({
  slug:z.string().trim().min(1).max(160).regex(/^[a-z0-9\u0600-\u06ff]+(?:-[a-z0-9\u0600-\u06ff]+)*$/i),
  name:localizedStringInput,
  description:localizedTextInput.optional(),
  seo:seoInput.optional(),
});

export async function GET(req:Request){return listContent(req,BlogCategoryModel);}

export async function POST(req:Request){
  const auth=await getAuth(req);
  if(!auth||!can(String(auth.role),"content:write"))return fail("Forbidden",403);
  try{
    const parsed=input.safeParse(await req.json());
    if(!parsed.success)return fail("Invalid blog category payload",422,parsed.error.flatten());
    await connectDB();
    if(await BlogCategoryModel.exists({slug:parsed.data.slug}))return fail("Slug already exists",409);
    return ok(await BlogCategoryModel.create({...parsed.data,createdBy:auth.sub,updatedBy:auth.sub}),201);
  }catch(e){return fail(e instanceof Error?e.message:"Create failed",500);}
}
