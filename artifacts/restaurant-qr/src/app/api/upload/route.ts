import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 5 * 1024 * 1024;

// Resolve persistent upload directory
// In standalone Docker: /app/artifacts/restaurant-qr/public/uploads
// In dev: <workspace>/artifacts/restaurant-qr/public/uploads
function getUploadDir(): string {
  const cwd = process.cwd();
  // Standalone: cwd = /app, public is at /app/artifacts/restaurant-qr/public
  // Dev: cwd = /home/runner/workspace, public is inside artifacts/restaurant-qr/public
  const candidates = [
    path.join(cwd, "artifacts", "restaurant-qr", "public", "uploads"),
    path.join(cwd, "public", "uploads"),
  ];
  // Return first that is writable — we'll create it on upload
  return candidates[0];
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) {
    return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Format non autorisé. Utilisez JPG, PNG ou WebP." },
      { status: 400 }
    );
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "Fichier trop grand. Maximum 5 Mo." },
      { status: 400 }
    );
  }

  const ext = file.type === "image/webp" ? "webp"
    : file.type === "image/png" ? "png"
    : file.type === "image/gif" ? "gif"
    : "jpg";

  const filename = `${randomUUID()}.${ext}`;
  const uploadDir = getUploadDir();

  try {
    await mkdir(uploadDir, { recursive: true });
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(path.join(uploadDir, filename), buffer);
  } catch (err) {
    console.error("[upload] filesystem write failed:", err);
    return NextResponse.json(
      { error: "Échec de l'enregistrement du fichier sur le serveur." },
      { status: 500 }
    );
  }

  return NextResponse.json({ url: `/api/files/${filename}` });
}
