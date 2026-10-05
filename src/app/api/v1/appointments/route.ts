import { connectDB } from "@/lib/db";
import { AppointmentModel } from "@/models";
import { ok, fail } from "@/lib/api";
import { can, getAuth } from "@/lib/rbac";

export async function GET(req: Request) {
  try {
    const auth = await getAuth(req as never);
    if (!auth) return fail("Authentication required", 401);
    await connectDB();

    const filter = can(auth.role, "appointments:read")
      ? { status: { $nin: ["cancelled"] } }
      : { userId: String(auth.sub), status: { $nin: ["cancelled"] } };

    const items = await AppointmentModel.find(filter).sort({ startsAt: 1 }).limit(100).lean();
    return ok(items);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Unable to load appointments", 500);
  }
}
