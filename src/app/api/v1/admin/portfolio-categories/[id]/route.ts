import { PortfolioCategoryModel, PortfolioItemModel } from "@/models";
import { connectDB } from "@/lib/db";
import { getAuth, can } from "@/lib/rbac";
import { ok, fail } from "@/lib/api";
import { z } from "zod";
import { localizedStringInput, localizedTextInput, seoInput } from "@/lib/validators";

const input=z.object({
  slug:z.string().trim().min(1).max(160).regex(/^[a-z0-9\u0600-\u06ff]+(?:-[a-z0-9\u0600-\u06ff]+)*$/i),
  name:localizedStringInput,
  description:localizedTextInput.optional(),
  seo:seoInput.optional(),
}).partial();

export async function GET(req:Request,{params}:{params:Promise<{id:string}>}){
  const auth=await getAuth(req);if(!auth||!can(String(auth.role),"content:read"))return fail("Forbidden",403);
  try{await connectDB();const {id}=await params;const item=await PortfolioCategoryModel.findById(id).lean();return item?ok(item):fail("Category not found",404);}
  catch(e){return fail(e instanceof Error?e.message:"Unable to load category",500);}
}
export async function PUT(req:Request,{params}:{params:Promise<{id:string}>}){
  const auth=await getAuth(req);if(!auth||!can(String(auth.role),"content:write"))return fail("Forbidden",403);
  try{const parsed=input.safeParse(await req.json());if(!parsed.success)return fail("Invalid category payload",422,parsed.error.flatten());await connectDB();const {id}=await params;if(parsed.data.slug&&await PortfolioCategoryModel.exists({slug:parsed.data.slug,_id:{$ne:id}}))return fail("Slug already exists",409);const item=await PortfolioCategoryModel.findByIdAndUpdate(id,{$set:{...parsed.data,updatedBy:auth.sub}},{new:true,runValidators:true}).lean();return item?ok(item):fail("Category not found",404);}
  catch(e){return fail(e instanceof Error?e.message:"Update failed",500);}
}
export async function DELETE(req:Request,{params}:{params:Promise<{id:string}>}){
  const auth=await getAuth(req);if(!auth||!can(String(auth.role),"content:write"))return fail("Forbidden",403);
  try{await connectDB();const {id}=await params;if(await PortfolioItemModel.exists({categoryIds:id}))return fail("این دسته‌بندی در نمونه‌کارها استفاده شده و قابل حذف نیست.",409);const item=await PortfolioCategoryModel.findByIdAndDelete(id).lean();return item?ok(item):fail("Category not found",404);}
  catch(e){return fail(e instanceof Error?e.message:"Delete failed",500);}
}
