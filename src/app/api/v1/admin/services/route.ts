import { connectDB } from "@/lib/db";
import { ServiceModel } from "@/models";
import { getAuth, can } from "@/lib/rbac";
import { ok, fail } from "@/lib/api";
import { serviceInput, contentQuery } from "@/lib/validators";
import { sanitizeLocalizedHtml } from "@/lib/sanitize";

function sanitizeService(data:any){
  return {
    ...data,
    content: data.content ? sanitizeLocalizedHtml(data.content) : undefined,
    suitableFor: data.suitableFor ? sanitizeLocalizedHtml(data.suitableFor) : undefined,
    benefits: data.benefits ? sanitizeLocalizedHtml(data.benefits) : undefined,
    limitations: data.limitations ? sanitizeLocalizedHtml(data.limitations) : undefined,
    careInstructions: data.careInstructions ? sanitizeLocalizedHtml(data.careInstructions) : undefined,
    faqs: data.faqs?.map((faq:any)=>({
      ...faq,
      answer:sanitizeLocalizedHtml(faq.answer),
    })),
  };
}

export async function GET(req: Request) {
  const auth = await getAuth(req);
  if (!auth || !can(String(auth.role), "content:read")) return fail("Forbidden", 403);
  try {
    await connectDB();
    const url = new URL(req.url);
    const query = contentQuery.parse(Object.fromEntries(url.searchParams));
    const filter: Record<string, unknown> = {};
    if (query.status) filter.status = query.status;
    if (query.search) filter.$or = [
      { "title.fa": { $regex: query.search, $options: "i" } },
      { "title.en": { $regex: query.search, $options: "i" } },
      { slug: { $regex: query.search, $options: "i" } },
    ];
    const skip = (query.page - 1) * query.limit;
    const [items,total] = await Promise.all([
      ServiceModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(query.limit).lean(),
      ServiceModel.countDocuments(filter),
    ]);
    return ok({items,pagination:{page:query.page,limit:query.limit,total,pages:Math.ceil(total/query.limit)}});
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Unable to load services", 500);
  }
}

export async function POST(req: Request) {
  const auth = await getAuth(req);
  if (!auth || !can(String(auth.role), "content:write")) return fail("Forbidden", 403);
  try {
    const parsed = serviceInput.safeParse(await req.json());
    if (!parsed.success) return fail("Invalid service payload", 422, parsed.error.flatten());
    await connectDB();
    if (await ServiceModel.exists({ slug: parsed.data.slug })) return fail("A service with this slug already exists", 409);
    const item = await ServiceModel.create({
      ...sanitizeService(parsed.data),
      createdBy: auth.sub,
      updatedBy: auth.sub,
    });
    return ok(item, 201);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Create failed", 500);
  }
}