import { connectDB } from "@/lib/db";
import { RedirectModel } from "@/models";
import { fail, ok } from "@/lib/api";

export async function GET(req: Request) {
  try {
    const from = new URL(req.url).searchParams.get("from")?.trim() || "";
    if (!from.startsWith("/") || from.startsWith("//") || from.includes("?")) {
      return fail("Invalid redirect source", 400);
    }
    await connectDB();
    const item = await RedirectModel.findOne({ from, active: true }).select("to statusCode").lean();
    if (!item) return fail("Redirect not found", 404);
    return ok(item);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Unable to resolve redirect", 500);
  }
}
