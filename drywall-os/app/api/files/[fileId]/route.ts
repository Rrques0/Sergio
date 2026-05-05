import { NextRequest } from "next/server";

import { getActorContext } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { readPrivateFile, verifySignedFileUrl } from "@/lib/files/storage";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  const { fileId } = await params;
  const { searchParams } = new URL(request.url);
  const signed = verifySignedFileUrl(fileId, searchParams.get("exp"), searchParams.get("sig"));

  const actor = await getActorContext();
  const photo = await prisma.jobPhoto.findUnique({ where: { id: fileId } });
  const receipt = photo ? null : await prisma.receiptFile.findUnique({ where: { id: fileId } });
  const file = photo ?? receipt;

  if (!file || file.deletedAt) {
    return new Response("Not found", { status: 404 });
  }

  if (!signed && actor?.tenantId !== file.tenantId) {
    return new Response("Forbidden", { status: 403 });
  }

  const bytes = await readPrivateFile(file.storageKey);
  return new Response(bytes, {
    headers: {
      "Content-Type": file.mimeType,
      "Cache-Control": "private, max-age=300",
      "X-Content-Type-Options": "nosniff"
    }
  });
}
