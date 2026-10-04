import { Model } from "mongoose";
import { connectDB } from "@/lib/db";
import { getAuth, can } from "@/lib/rbac";
import { ok, fail } from "@/lib/api";

export async function listContent(req: Request, Model: Model<any>, permission="content:read") {
  const auth = await getAuth(req);
  if (!auth || !can(String(auth.role), permission)) return fail("Forbidden", 403);
  try {
    await connectDB();
    const url = new URL(req.url);
    const page = Math.max(1, Number(url.searchParams.get("page") || 1));
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") || 20)));
    const search = url.searchParams.get("search")?.trim();
    const status = url.searchParams.get("status");
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (search) filter.$or = [
      { "title.fa": { $regex: search, $options: "i" } },
      { "title.en": { $regex: search, $options: "i" } },
      { "name.fa": { $regex: search, $options: "i" } },
      { "name.en": { $regex: search, $options: "i" } },
      { slug: { $regex: search, $options: "i" } },
    ];
    const skip = (page - 1) * limit;
    const [items,total] = await Promise.all([
      Model.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Model.countDocuments(filter),
    ]);
    return ok({ items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (e) { return fail(e instanceof Error ? e.message : "Unable to load content", 500); }
}