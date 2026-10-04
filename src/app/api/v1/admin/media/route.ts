import { connectDB } from "@/lib/db";
import { MediaModel } from "@/models";
import { getAuth, can } from "@/lib/rbac";
import { saveLocal } from "@/lib/storage";
import { ok, fail } from "@/lib/api";
import { validateUpload } from "@/lib/upload";

export async function GET(req: Request) {
  const auth = await getAuth(req as never);
  if (!auth || !can(String(auth.role), "media:write")) return fail("Forbidden", 403);
  await connectDB();
  return ok(await MediaModel.find().sort({ createdAt: -1 }).limit(100).lean());
}

export async function POST(req: Request) {
  const auth = await getAuth(req as never);
  if (!auth || !can(String(auth.role), "media:write")) return fail("Forbidden", 403);

  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return fail("file is required", 422);

    const validationError = validateUpload(file);
    if (validationError) return fail(validationError, 422);

    const buffer = Buffer.from(await file.arrayBuffer());
    const saved = await saveLocal(buffer, file.name);

    await connectDB();
    const item = await MediaModel.create({
      key: saved.key,
      url: saved.url,
      mimeType: file.type,
      size: file.size,
      folder: String(form.get("folder") || "general"),
      alt: {
        fa: String(form.get("altFa") || ""),
        en: String(form.get("altEn") || ""),
      },
    });

    return ok(item, 201);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Upload failed", 500);
  }
}