import { connectDB } from "@/lib/db";
import { RedirectModel } from "@/models";
import { getAuth, can } from "@/lib/rbac";
import { fail, ok } from "@/lib/api";
import { z } from "zod";

const input = z.object({
  from: z.string().trim().min(1).max(500),
  to: z.string().trim().min(1).max(1000),
  statusCode: z.union([z.literal(301), z.literal(302)]).default(301),
  active: z.boolean().default(true),
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
  try {
    url = new URL(to);
  } catch {
    throw new Error("Redirect target must be a site path or absolute URL");
  }
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Redirect target must use http or https");
  }
}

export async function GET(req: Request) {
  const auth = await getAuth(req);
  if (!auth || !can(String(auth.role), "content:read")) return fail("Forbidden", 403);
  try {
    await connectDB();
    const items = await RedirectModel.find().sort({ from: 1 }).lean();
    return ok(items);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Unable to load redirects", 500);
  }
}

export async function POST(req: Request) {
  const auth = await getAuth(req);
  if (!auth || !can(String(auth.role), "content:write")) return fail("Forbidden", 403);
  try {
    const parsed = input.safeParse(await req.json());
    if (!parsed.success) return fail("Invalid redirect payload", 422, parsed.error.flatten());
    validateRedirect(parsed.data.from, parsed.data.to);
    await connectDB();
    const item = await RedirectModel.create(parsed.data);
    return ok(item, 201);
  } catch (e) {
    if (typeof e === "object" && e !== null && "code" in e && (e as { code?: number }).code === 11000) {
      return fail("A redirect with this source already exists", 409);
    }
    return fail(e instanceof Error ? e.message : "Unable to create redirect", 500);
  }
}
