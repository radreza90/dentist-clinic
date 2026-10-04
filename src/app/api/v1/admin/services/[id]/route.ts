import { connectDB } from "@/lib/db";
import { ServiceModel } from "@/models";
import { getAuth, can } from "@/lib/rbac";
import { ok, fail } from "@/lib/api";
import { serviceInput } from "@/lib/validators";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuth(req as never);
  if (!auth || !can(String(auth.role), "content:read")) return fail("Forbidden", 403);
  try {
    await connectDB();
    const { id } = await params;
    const item = await ServiceModel.findById(id).lean();
    return item ? ok(item) : fail("Service not found", 404);
  } catch (e) { return fail(e instanceof Error ? e.message : "Unable to load service", 500); }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuth(req as never);
  if (!auth || !can(String(auth.role), "content:write")) return fail("Forbidden", 403);
  try {
    const parsed = serviceInput.partial().safeParse(await req.json());
    if (!parsed.success) return fail("Invalid service payload", 422, parsed.error.flatten());
    await connectDB();
    const { id } = await params;
    if (parsed.data.slug && await ServiceModel.exists({ slug: parsed.data.slug, _id: { $ne: id } })) {
      return fail("A service with this slug already exists", 409);
    }
    const item = await ServiceModel.findByIdAndUpdate(
      id, { $set: { ...parsed.data, updatedBy: auth.sub } }, { new: true, runValidators: true }
    ).lean();
    return item ? ok(item) : fail("Service not found", 404);
  } catch (e) { return fail(e instanceof Error ? e.message : "Update failed", 500); }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuth(req as never);
  if (!auth || !can(String(auth.role), "content:write")) return fail("Forbidden", 403);
  try {
    await connectDB();
    const { id } = await params;
    const item = await ServiceModel.findByIdAndUpdate(
      id, { $set: { status: "archived", updatedBy: auth.sub } }, { new: true }
    ).lean();
    return item ? ok(item) : fail("Service not found", 404);
  } catch (e) { return fail(e instanceof Error ? e.message : "Archive failed", 500); }
}