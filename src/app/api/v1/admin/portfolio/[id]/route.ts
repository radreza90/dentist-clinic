import { PortfolioItemModel } from "@/models";
import { connectDB } from "@/lib/db";
import { getAuth,can } from "@/lib/rbac";
import { ok,fail } from "@/lib/api";
import { z } from "zod";
import { seoInput } from "@/lib/validators";
const localized=z.object({fa:z.string().max(5000).optional(),en:z.string().max(5000).optional()});
const text=z.object({fa:z.string().max(100000).optional(),en:z.string().max(100000).optional()});
const input=z.object({slug:z.string().trim().min(1).max(160),title:localized,description:text.optional(),treatment:text.optional(),categoryIds:z.array(z.string()).optional(),beforeMediaIds:z.array(z.string()).optional(),afterMediaIds:z.array(z.string()).optional(),doctorId:z.string().nullable().optional(),seo:seoInput.optional(),status:z.enum(["draft","published","scheduled","archived"]).optional()}).partial();

export async function GET(req:Request,{params}:{params:Promise<{id:string}>}){const a=await getAuth(req);if(!a||!can(String(a.role),"content:read"))return fail("Forbidden",403);try{await connectDB();const {id}=await params;const item=await PortfolioItemModel.findById(id).lean();return item?ok(item):fail("Portfolio item not found",404);}catch(e){return fail(e instanceof Error?e.message:"Unable to load portfolio item",500);}}
export async function PUT(req:Request,{params}:{params:Promise<{id:string}>}){const a=await getAuth(req);if(!a||!can(String(a.role),"content:write"))return fail("Forbidden",403);try{const p=input.safeParse(await req.json());if(!p.success)return fail("Invalid portfolio payload",422,p.error.flatten());await connectDB();const {id}=await params;if(p.data.slug&&await PortfolioItemModel.exists({slug:p.data.slug,_id:{$ne:id}}))return fail("Slug already exists",409);const item=await PortfolioItemModel.findByIdAndUpdate(id,{$set:{...p.data,updatedBy:a.sub}},{new:true,runValidators:true}).lean();return item?ok(item):fail("Portfolio item not found",404);}catch(e){return fail(e instanceof Error?e.message:"Update failed",500);}}
export async function DELETE(req:Request,{params}:{params:Promise<{id:string}>}){const a=await getAuth(req);if(!a||!can(String(a.role),"content:write"))return fail("Forbidden",403);try{await connectDB();const {id}=await params;const item=await PortfolioItemModel.findByIdAndUpdate(id,{$set:{status:"archived",updatedBy:a.sub}},{new:true}).lean();return item?ok(item):fail("Portfolio item not found",404);}catch(e){return fail(e instanceof Error?e.message:"Archive failed",500);}}
