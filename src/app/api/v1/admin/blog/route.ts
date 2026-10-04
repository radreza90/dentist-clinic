import { BlogPostModel } from "@/models";
import { listContent } from "@/lib/content-crud";
import { connectDB } from "@/lib/db";
import { getAuth,can } from "@/lib/rbac";
import { ok,fail } from "@/lib/api";
import { z } from "zod";

const localized=z.object({fa:z.string().max(5000).optional().default(""),en:z.string().max(5000).optional().default("")});
const input=z.object({
  slug:z.string().trim().min(1).max(160),
  title:localized,
  excerpt:localized.optional(),
  content:localized.optional(),
  categoryIds:z.array(z.string()).optional(),
  coverMediaId:z.string().nullable().optional(),
  status:z.enum(["draft","published","scheduled","archived"]).optional(),
  publishedAt:z.coerce.date().nullable().optional(),
  scheduledAt:z.coerce.date().nullable().optional(),
  authorId:z.string().optional()
});
export async function GET(req:Request){return listContent(req,BlogPostModel);}
export async function POST(req:Request){
  const a=await getAuth(req);if(!a||!can(String(a.role),"content:write"))return fail("Forbidden",403);
  try{const p=input.safeParse(await req.json());if(!p.success)return fail("Invalid blog post payload",422,p.error.flatten());await connectDB();
    if(await BlogPostModel.exists({slug:p.data.slug}))return fail("Slug already exists",409);
    const item=await BlogPostModel.create({...p.data,authorId:p.data.authorId||a.sub,createdBy:a.sub,updatedBy:a.sub});
    return ok(item,201);
  }catch(e){return fail(e instanceof Error?e.message:"Create failed",500);}
}