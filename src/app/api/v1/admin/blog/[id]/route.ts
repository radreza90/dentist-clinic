import { BlogPostModel } from "@/models";
import { connectDB } from "@/lib/db";
import { getAuth,can } from "@/lib/rbac";
import { ok,fail } from "@/lib/api";
import { z } from "zod";
const localized=z.object({fa:z.string().max(5000).optional(),en:z.string().max(5000).optional()});
const input=z.object({
  slug:z.string().trim().min(1).max(160),title:localized,excerpt:localized.optional(),content:localized.optional(),
  categoryIds:z.array(z.string()).optional(),coverMediaId:z.string().nullable().optional(),
  status:z.enum(["draft","published","scheduled","archived"]).optional(),
  publishedAt:z.coerce.date().nullable().optional(),scheduledAt:z.coerce.date().nullable().optional(),authorId:z.string().optional()
}).partial();
export async function GET(req:Request,{params}:{params:Promise<{id:string}>}){const a=await getAuth(req);if(!a||!can(String(a.role),"content:read"))return fail("Forbidden",403);try{await connectDB();const {id}=await params;const item=await BlogPostModel.findById(id).lean();return item?ok(item):fail("Post not found",404);}catch(e){return fail(e instanceof Error?e.message:"Unable to load post",500);}}
export async function PUT(req:Request,{params}:{params:Promise<{id:string}>}){const a=await getAuth(req);if(!a||!can(String(a.role),"content:write"))return fail("Forbidden",403);try{const p=input.safeParse(await req.json());if(!p.success)return fail("Invalid blog post payload",422,p.error.flatten());await connectDB();const {id}=await params;if(p.data.slug&&await BlogPostModel.exists({slug:p.data.slug,_id:{$ne:id}}))return fail("Slug already exists",409);const item=await BlogPostModel.findByIdAndUpdate(id,{$set:{...p.data,updatedBy:a.sub}},{new:true,runValidators:true}).lean();return item?ok(item):fail("Post not found",404);}catch(e){return fail(e instanceof Error?e.message:"Update failed",500);}}
export async function DELETE(req:Request,{params}:{params:Promise<{id:string}>}){const a=await getAuth(req);if(!a||!can(String(a.role),"content:write"))return fail("Forbidden",403);try{await connectDB();const {id}=await params;const item=await BlogPostModel.findByIdAndUpdate(id,{$set:{status:"archived",updatedBy:a.sub}},{new:true}).lean();return item?ok(item):fail("Post not found",404);}catch(e){return fail(e instanceof Error?e.message:"Archive failed",500);}}
