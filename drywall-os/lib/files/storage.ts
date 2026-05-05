import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { fileTypeFromBuffer } from "file-type";
import sharp from "sharp";

const acceptedImageMimes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxImageBytes = 8 * 1024 * 1024;

function uploadRoot() {
  return path.resolve(process.env.PRIVATE_UPLOAD_ROOT ?? "./.storage/uploads");
}

function signedSecret() {
  const secret = process.env.SIGNED_URL_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("errors.missingSignedUrlSecret");
  }
  return secret;
}

function sha256(buffer: Buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

export async function storeImageFile(
  tenantId: string,
  file: File,
  folder: "job-photos" | "receipts"
) {
  if (file.size <= 0) throw new Error("errors.emptyUpload");
  if (file.size > maxImageBytes) throw new Error("errors.fileTooLarge");

  const original = Buffer.from(await file.arrayBuffer());
  const detected = await fileTypeFromBuffer(original);

  if (!detected || !acceptedImageMimes.has(detected.mime)) {
    throw new Error("errors.unsupportedFileType");
  }

  if (file.type && file.type !== detected.mime) {
    throw new Error("errors.mimeMismatch");
  }

  const encoded = await sharp(original)
    .rotate()
    .resize({ width: 2500, height: 2500, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 84 })
    .toBuffer({ resolveWithObject: true });

  const id = randomBytes(16).toString("hex");
  const storageKey = `${tenantId}/${folder}/${id}.webp`;
  const absolutePath = path.join(uploadRoot(), storageKey);
  const resolvedPath = path.resolve(absolutePath);

  if (!resolvedPath.startsWith(uploadRoot())) {
    throw new Error("errors.invalidStoragePath");
  }

  await mkdir(path.dirname(resolvedPath), { recursive: true });
  await writeFile(resolvedPath, encoded.data, { mode: 0o600 });

  return {
    storageKey,
    originalName: file.name || "upload",
    mimeType: "image/webp",
    sizeBytes: encoded.data.byteLength,
    width: encoded.info.width,
    height: encoded.info.height,
    sha256: sha256(encoded.data)
  };
}

export async function readPrivateFile(storageKey: string) {
  const root = uploadRoot();
  const absolutePath = path.resolve(path.join(root, storageKey));
  if (!absolutePath.startsWith(root)) {
    throw new Error("errors.invalidStoragePath");
  }
  return readFile(absolutePath);
}

export function createSignedFileUrl(fileId: string, expiresInSeconds = 600) {
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const sig = createHmac("sha256", signedSecret())
    .update(`${fileId}:${exp}`)
    .digest("hex");
  return `/api/files/${fileId}?exp=${exp}&sig=${sig}`;
}

export function verifySignedFileUrl(fileId: string, expValue: string | null, sigValue: string | null) {
  if (!expValue || !sigValue) return false;
  const exp = Number.parseInt(expValue, 10);
  if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) return false;

  const expected = createHmac("sha256", signedSecret())
    .update(`${fileId}:${exp}`)
    .digest("hex");

  const expectedBuffer = Buffer.from(expected, "hex");
  const actualBuffer = Buffer.from(sigValue, "hex");
  return (
    expectedBuffer.length === actualBuffer.length &&
    timingSafeEqual(expectedBuffer, actualBuffer)
  );
}
