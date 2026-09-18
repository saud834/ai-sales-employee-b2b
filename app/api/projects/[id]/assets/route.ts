import { nanoid } from "nanoid";
import fs from "node:fs/promises";
import path from "node:path";
import { NextRequest } from "next/server";
import { addAsset, listAssets } from "@/lib/repo/assets";
import { handleRoute, jsonError } from "@/lib/api-utils";

const ALLOWED_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
};
const MAX_BYTES = 8 * 1024 * 1024;

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return handleRoute(async () => listAssets(id));
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const form = await req.formData();
  const file = form.get("file");
  const alt = (form.get("alt") as string) || "Uploaded image";

  if (!(file instanceof File)) {
    return jsonError("A file is required");
  }
  const ext = ALLOWED_TYPES[file.type];
  if (!ext) {
    return jsonError("Only PNG, JPEG, WEBP, GIF, and SVG images are allowed");
  }
  if (file.size > MAX_BYTES) {
    return jsonError("File is larger than the 8MB limit");
  }

  return handleRoute(async () => {
    const projectDir = path.join(process.cwd(), "public", "uploads", id);
    await fs.mkdir(projectDir, { recursive: true });
    const filename = `${nanoid(10)}.${ext}`;
    const bytes = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(path.join(projectDir, filename), bytes);

    const url = `/uploads/${id}/${filename}`;
    return addAsset(id, url, filename, alt);
  });
}
