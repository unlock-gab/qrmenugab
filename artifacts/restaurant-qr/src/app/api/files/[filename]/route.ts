import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

const UPLOAD_PATHS = [
  path.join(process.cwd(), "artifacts", "restaurant-qr", "public", "uploads"),
  path.join(process.cwd(), "public", "uploads"),
  "/app/artifacts/restaurant-qr/public/uploads",
  "/app/public/uploads",
];

const MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;

  // Sanitize: only allow UUID-based filenames with known extensions
  if (!/^[\w-]+\.(jpg|jpeg|png|webp|gif)$/i.test(filename)) {
    return new NextResponse("Not found", { status: 404 });
  }

  for (const dir of UPLOAD_PATHS) {
    try {
      const filePath = path.join(dir, filename);
      const data = await readFile(filePath);
      const ext = filename.split(".").pop()?.toLowerCase() || "jpg";
      const mime = MIME[ext] || "image/jpeg";
      return new NextResponse(data, {
        headers: {
          "Content-Type": mime,
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    } catch {
      // Try next path
    }
  }

  return new NextResponse("Not found", { status: 404 });
}
