import { NextRequest } from "next/server";

import { requireActor } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { tenantWhere } from "@/lib/db/tenant";
import { renderQrPng } from "@/lib/qr/qr-service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ codeAssetId: string }> }
) {
  const actor = await requireActor("qr:create");
  const { codeAssetId } = await params;
  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") ?? "svg";

  const asset = await prisma.codeAsset.findFirst({
    where: tenantWhere(actor.tenantId, { id: codeAssetId })
  });

  if (!asset) return new Response("Not found", { status: 404 });

  if (format === "png") {
    const png = await renderQrPng(asset.targetUrl);
    return new Response(new Uint8Array(png), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "private, max-age=300"
      }
    });
  }

  return new Response(asset.svg ?? "", {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "private, max-age=300",
      "X-Content-Type-Options": "nosniff"
    }
  });
}
