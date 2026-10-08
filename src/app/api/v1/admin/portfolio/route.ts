import { PortfolioItemModel } from "@/models";
import { listContent } from "@/lib/content-crud";
import { connectDB } from "@/lib/db";
import { getAuth,can } from "@/lib/rbac";
import { ok,fail } from "@/lib/api";
import { sanitizeLocalizedHtml } from "@/lib/sanitize";
import { z } from "zod";
import { seoInput, commentSettingsInput } from "@/lib/validators";
const localized=z.object({fa:z.string().max(5000).optional().default(""),en:z.string().max(5000).optional().default("")});
const text=z.object({fa:z.string().max(100000).optional(),en:z.string().max(100000).optional()});
const input=z.object({slug:z.string().trim().min(1).max(160),title:localized,description:text.optional(),treatment:text.optional(),categoryIds:z.array(z.string()).optional(),beforeMediaIds:z.array(z.string()).optional(),afterMediaIds:z.array(z.string()).optional(),doctorId:z.string().nullable().optional(),privacy:z.object({consentStatus:z.enum(["unknown","granted","revoked"]).optional(),hideIdentity:z.boolean().optional()}).optional(),commentSettings:commentSettingsInput.optional(),seo:seoInput.optional(),status:z.enum(["draft","published","scheduled","archived"]).optional(),publishedAt:z.coerce.date().nullable().optional(),scheduledAt:z.coerce.date().nullable().optional()});
function sanitizePortfolio(data:z.infer<typeof input>){return {...data,description:data.description?sanitizeLocalizedHtml(data.description):undefined,treatment:data.treatment?sanitizeLocalizedHtml(data.treatment):undefined};}
export async function GET(req:Request){return listContent(req,PortfolioItemModel,{categoryField:"categoryIds"});}
export async function POST(req:Request){const a=await getAuth(req);if(!a||!can(String(a.role),"content:write"))return fail("Forbidden",403);try{const p=input.safeParse(await req.json());if(!p.success)return fail("Invalid portfolio payload",422,p.error.flatten());await connectDB();if(await PortfolioItemModel.exists({slug:p.data.slug}))return fail("Slug already exists",409);return ok(await PortfolioItemModel.create({...sanitizePortfolio(p.data),createdBy:a.sub,updatedBy:a.sub}),201);}catch(e){return fail(e instanceof Error?e.message:"Create failed",500);}}
