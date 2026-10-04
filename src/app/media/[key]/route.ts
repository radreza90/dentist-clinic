import { promises as fs } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { MediaModel } from "@/models";

export async function GET(_: Request, { params }: { params: Promise<{ key: string }> }) {
  try {
    const { key } = await params;
    await connectDB();
    const media = await MediaModel.findOne({ key }).lean();
    if (!media || media.storageDriver !== "local") {
      return new NextResponse("Not found", { status: 404 });
    }

    const root = path.resolve(process.env.LOCAL_STORAGE_PATH || "./storage");
    const filePath = path.resolve(root, key);
    if (!filePath.startsWith(root + path.sep)) return new NextResponse("Not found", { status: 404 });

    const data = await fs.readFile(filePath);
    return new NextResponse(data, {
      headers: {
        "Content-Type": media.mimeType || "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}