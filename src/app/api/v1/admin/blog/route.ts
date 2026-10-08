import { BlogPostModel } from "@/models";
import { listContent } from "@/lib/content-crud";
import { connectDB } from "@/lib/db";
import { getAuth,can } from "@/lib/rbac";
import { ok,fail } from "@/lib/api";
import { sanitizeLocalizedHtml } from "@/lib/sanitize";
import { z } from "zod";
import { seoInput, commentSettingsInput } from "@/lib/validators";
const localized=z.object({fa:z.string().max(5000).optional().default(""),en:z.string().max(5000).optional().default("")});
const text=z.object({fa:z.string().max(100000).optional(),en:z.string().max(100000).optional()});
const input=z.object({slug:z.string().trim().min(1).max(160),title:localized,excerpt:text.optional(),content:text.optional(),categoryIds:z.array(z.string()).optional(),coverMediaId:z.string().nullable().optional(),commentSettings:commentSettingsInput.optional(),seo:seoInput.optional(),status:z.enum(["draft","published","scheduled","archived"]).optional(),publishedAt:z.coerce.date().nullable().optional(),scheduledAt:z.coerce.date().nullable().optional(),authorId:z.string().optional()});
function sanitizePost(data:z.infer<typeof input>){return {...data,excerpt:data.excerpt?sanitizeLocalizedHtml(data.excerpt):undefined,content:data.content?sanitizeLocalizedHtml(data.content):undefined};}
export async function GET(req:Request){return listContent(req,BlogPostModel,{categoryField:"categoryIds"});}
export async function POST(req:Request){
 const a=await getAuth(req);if(!a||!can(String(a.role),"content:write"))return fail("Forbidden",403);
 try{const p=input.safeParse(await req.json());if(!p.success)return fail("Invalid blog post payload",422,p.error.flatten());await connectDB();if(await BlogPostModel.exists({slug:p.data.slug}))return fail("Slug already exists",409);return ok(await BlogPostModel.create({...sanitizePost(p.data),authorId:p.data.authorId||a.sub,createdBy:a.sub,updatedBy:a.sub}),201);}
 catch(e){return fail(e instanceof Error?e.message:"Create failed",500);}
}
