import { connectDB } from "@/lib/db";
import { UserModel } from "@/models";
import { ok, fail } from "@/lib/api";
import { getAuth } from "@/lib/rbac";

export async function GET(req: Request) {
  try {
    const auth = await getAuth(req as never);
    if (!auth) return fail("Authentication required", 401);
    await connectDB();

    const user = await UserModel.findById(auth.sub)
      .select("_id email phone firstName lastName role isActive lastLoginAt")
      .lean();

    if (!user || !user.isActive) return fail("User not found", 404);
    return ok(user);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Unable to load profile", 500);
  }
}