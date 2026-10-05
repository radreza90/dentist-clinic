import { connectDB } from "@/lib/db";
import { RedirectModel } from "@/models";
import { getAuth, can } from "@/lib/rbac";
import { fail, ok } from "@/lib/api";
import { z } from "zod";

const input = z.object({
  from: z.string().trim().min(1).max(500),
  to: z.string().trim().min(1).max(1000),
  statusCode: z.union([z.literal(301), z.literal(302)]),
  active: z.boolean(),
});

function validateRedirect(from: string, to: string) {
  if (!from.startsWith("/") || from.startsWith("//") || from.includes("?")) {
    throw new Error("Redirect source must be an absolute site path without a query string");
  }
  if (from === to) throw new Error("Redirect source and target cannot be the same");
  if (to.startsWith("/")) {
    if (to.startsWith("//")) throw new Error("Invalid redirect target");
    return;
  }
  let url: URL;
  try { url = new URL(to); } catch { throw new Error("Redirect target must be a site path or absolute URL"); }
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("Redirect target must use http or https");
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuth(req);
  if (!auth || !can(String(auth.role), "content:write")) return fail("Forbidden", 403);
  try {
    const parsed = input.safeParse(await req.json());
    if (!parsed.success) return fail("Invalid redirect payload", 422, parsed.error.flatten());
    validateRedirect(parsed.data.from, parsed.data.to);
    await connectDB();
    const id = await params;
    const item = await RedirectModel.findByIdAndUpdate(id.id, { $set: parsed.data }, { new: true, runValidators: true }).lean();
    return item ? ok(item) : fail("Redirect not found", 404);
  } catch (e) {
    if (typeof e === "object" && e !== null && "code" in e && (e as { code?: number }).code === 11000) {
      return fail("A redirect with this source already exists", 409);
    }
    return fail(e instanceof Error ? e.message : "Unable to update redirect", 500);
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuth(req);
  if (!auth || !can(String(auth.role), "content:write")) return fail("Forbidden", 403);
  try {
    await connectDB();
    const id = await params;
    const result = await RedirectModel.deleteOne({ _id: id.id });
    return result.deletedCount ? ok({ deleted: true }) : fail("Redirect not found", 404);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Unable to delete redirect", 500);
  }
}
