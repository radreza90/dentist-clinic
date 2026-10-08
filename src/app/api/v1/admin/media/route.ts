import { unlink } from "node:fs/promises";
import path from "node:path";
import { connectDB } from "@/lib/db";
import {
  BlogPostModel,
  DoctorModel,
  MediaModel,
  PageModel,
  PortfolioItemModel,
  ServiceModel,
  SiteSettingsModel,
} from "@/models";
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

export async function PATCH(req: Request) {
  const auth = await getAuth(req as never);
  if (!auth || !can(String(auth.role), "media:write")) return fail("Forbidden", 403);

  try {
    const body = await req.json();
    const { id, titleFa, altFa, captionFa, folder } = body;
    if (typeof id !== "string" || !/^[a-f\d]{24}$/i.test(id)) return fail("Invalid media id", 422);

    const fields = { titleFa, altFa, captionFa, folder };
    if (Object.values(fields).some(value => typeof value !== "string")) return fail("Invalid media metadata", 422);
    if (titleFa.length > 160 || altFa.length > 300 || captionFa.length > 500 || folder.length > 80) {
      return fail("Media metadata is too long", 422);
    }

    await connectDB();
    const item = await MediaModel.findByIdAndUpdate(id, {
      $set: {
        "title.fa": titleFa.trim(),
        "alt.fa": altFa.trim(),
        "caption.fa": captionFa.trim(),
        folder: folder.trim() || "general",
      },
    }, { new: true, runValidators: true }).lean();
    if (!item) return fail("Media not found", 404);
    return ok(item);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Could not update media", 500);
  }
}

export async function DELETE(req: Request) {
  const auth = await getAuth(req as never);
  if (!auth || !can(String(auth.role), "media:write")) return fail("Forbidden", 403);

  try {
    const body: unknown = await req.json();
    if (typeof body !== "object" || body === null || !("id" in body)) return fail("Invalid media id", 422);
    const { id } = body;
    if (typeof id !== "string" || !/^[a-f\d]{24}$/i.test(id)) return fail("Invalid media id", 422);

    await connectDB();
    const item = await MediaModel.findById(id).lean();
    if (!item) return fail("Media not found", 404);
    if (item.storageDriver !== "local") return fail("Deleting files from this storage provider is not supported", 422);

    const mediaUrl = new RegExp(String(item.url || `/media/${item.key}`).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    const referenceChecks = await Promise.all([
      SiteSettingsModel.exists({ $or: [{ logoMediaId: id }, { faviconMediaId: id }, { "defaultSeo.ogImageMediaId": id }] }),
      DoctorModel.exists({ $or: [{ photoMediaId: id }, { "certificates.mediaId": id }, { "seo.ogImageMediaId": id }, { "bio.fa": mediaUrl }, { "bio.en": mediaUrl }] }),
      ServiceModel.exists({ $or: [{ coverMediaId: id }, { "seo.ogImageMediaId": id }, { "content.fa": mediaUrl }, { "content.en": mediaUrl }] }),
      BlogPostModel.exists({ $or: [{ coverMediaId: id }, { "seo.ogImageMediaId": id }, { "content.fa": mediaUrl }, { "content.en": mediaUrl }] }),
      PageModel.exists({ $or: [{ "seo.ogImageMediaId": id }, { "content.fa": mediaUrl }, { "content.en": mediaUrl }] }),
      PortfolioItemModel.exists({ $or: [{ beforeMediaIds: id }, { afterMediaIds: id }, { "seo.ogImageMediaId": id }, { "description.fa": mediaUrl }, { "description.en": mediaUrl }, { "treatment.fa": mediaUrl }, { "treatment.en": mediaUrl }] }),
    ]);
    if (referenceChecks.some(Boolean)) return fail("این فایل در محتوای سایت استفاده شده است؛ ابتدا آن را از محتوا جدا کنید.", 409);

    const root = path.resolve(process.env.LOCAL_STORAGE_PATH || "./storage");
    const filePath = path.resolve(root, item.key);
    if (!filePath.startsWith(root + path.sep)) return fail("Invalid media path", 422);

    try {
      await unlink(filePath);
    } catch (error) {
      if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) throw error;
    }
    await MediaModel.findByIdAndDelete(id);
    return ok({ deleted: true, id });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Could not delete media", 500);
  }
}