import { PortfolioItemModel } from "@/models";
import { listContent } from "@/lib/content-crud";
import { connectDB } from "@/lib/db";
import { getAuth,can } from "@/lib/rbac";
import { ok,fail } from "@/lib/api";
import { z } from "zod";

const localized=z.object({fa:z.string().max(5000).optional().default(""),en:z.string().max(5000).optional().default("")});
const input=z.object({
  slug:z.string().trim().min(1).max(160),
  title:localized,
  description:localized.optional(),
  treatment:localized.optional(),
  categoryIds:z.array(z.string()).optional(),
  beforeMediaIds:z.array(z.string()).optional(),
  afterMediaIds:z.array(z.string()).optional(),
  doctorId:z.string().nullable().optional(),
  status:z.enum(["draft","published","scheduled","archived"]).optional()
});
export async function GET(req:Request){return listContent(req,PortfolioItemModel);}
export async function POST(req:Request){
  const a=await getAuth(req);if(!a||!can(String(a.role),"content:write"))return fail("Forbidden",403);
  try{const p=input.safeParse(await req.json());if(!p.success)return fail("Invalid portfolio payload",422,p.error.flatten());await connectDB();
    if(await PortfolioItemModel.exists({slug:p.data.slug}))return fail("Slug already exists",409);
    return ok(await PortfolioItemModel.create({...p.data,createdBy:a.sub,updatedBy:a.sub}),201);
  }catch(e){return fail(e instanceof Error?e.message:"Create failed",500);}
}