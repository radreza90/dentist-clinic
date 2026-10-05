import { PageModel } from "@/models";
import { connectDB } from "@/lib/db";
import { getAuth, can } from "@/lib/rbac";
import { ok, fail } from "@/lib/api";
import { z } from "zod";
import { createContentRevision } from "@/lib/revisions";
import { seoInput } from "@/lib/validators";
import { createContentRevision } from "@/lib/revisions";
const localized=z.object({fa:z.string().max(5000).optional(),en:z.string().max(5000).optional()});
const input=z.object({
  slug:z.string().trim().min(1).max(160),title:localized,excerpt:localized.optional(),
  content:z.object({fa:z.string().max(100000).optional(),en:z.string().max(100000).optional()}).optional(),
  seo:seoInput.optional(),status:z.enum(["draft","published","scheduled","archived"]).optional()
}).partial();

export async function GET(req:Request,{params}:{params:Promise<{id:string}>}){const a=await getAuth(req);if(!a||!can(String(a.role),"content:read"))return fail("Forbidden",403);try{await connectDB();const {id}=await params;const item=await PageModel.findById(id).lean();return item?ok(item):fail("Page not found",404);}catch(e){return fail(e instanceof Error?e.message:"Unable to load page",500);}}
export async function PUT(req:Request,{params}:{params:Promise<{id:string}>}){const a=await getAuth(req);if(!a||!can(String(a.role),"content:write"))return fail("Forbidden",403);try{const p=input.safeParse(await req.json());if(!p.success)return fail("Invalid page payload",422,p.error.flatten());await connectDB();const {id}=await params;if(p.data.slug&&await PageModel.exists({slug:p.data.slug,_id:{$ne:id}}))return fail("Slug already exists",409);const item=await PageModel.findByIdAndUpdate(id,{$set:{...p.data,updatedBy:a.sub}},{new:true,runValidators:true}).lean();if(item)await createContentRevision("page",id,item,String(a.sub),"update");return item?ok(item):fail("Page not found",404);}catch(e){return fail(e instanceof Error?e.message:"Update failed",500);}}
export async function DELETE(req:Request,{params}:{params:Promise<{id:string}>}){const a=await getAuth(req);if(!a||!can(String(a.role),"content:write"))return fail("Forbidden",403);try{await connectDB();const {id}=await params;const item=await PageModel.findByIdAndUpdate(id,{$set:{status:"archived",updatedBy:a.sub}},{new:true}).lean();return item?ok(item):fail("Page not found",404);}catch(e){return fail(e instanceof Error?e.message:"Archive failed",500);}}
