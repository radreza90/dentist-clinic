import { PortfolioCategoryModel } from "@/models";
import { connectDB } from "@/lib/db";
import { getAuth, can } from "@/lib/rbac";
import { fail } from "@/lib/api";
import { listContent } from "@/lib/content-crud";
import { localizedStringInput, localizedTextInput, seoInput } from "@/lib/validators";
import { ok } from "@/lib/api";
import { z } from "zod";

const input=z.object({
  slug:z.string().trim().min(1).max(160).regex(/^[a-z0-9\u0600-\u06ff]+(?:-[a-z0-9\u0600-\u06ff]+)*$/i),
  name:localizedStringInput,
  description:localizedTextInput.optional(),
  seo:seoInput.optional(),
});

export async function GET(req:Request){return listContent(req,PortfolioCategoryModel);}
export async function POST(req:Request){
  const auth=await getAuth(req);if(!auth||!can(String(auth.role),"content:write"))return fail("Forbidden",403);
  try{const parsed=input.safeParse(await req.json());if(!parsed.success)return fail("Invalid portfolio category payload",422,parsed.error.flatten());await connectDB();if(await PortfolioCategoryModel.exists({slug:parsed.data.slug}))return fail("Slug already exists",409);return ok(await PortfolioCategoryModel.create({...parsed.data,createdBy:auth.sub,updatedBy:auth.sub}),201);}
  catch(e){return fail(e instanceof Error?e.message:"Create failed",500);}
}
