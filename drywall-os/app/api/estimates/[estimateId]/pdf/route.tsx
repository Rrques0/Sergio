import { renderToBuffer } from "@react-pdf/renderer";
import { NextRequest } from "next/server";

import { getActorContext, requireActor } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { tenantWhere } from "@/lib/db/tenant";
import { EstimatePdfDocument } from "@/lib/pdf/estimate-document";
import { getPdfLabels } from "@/lib/pdf/labels";
import { verifyScopedSignature } from "@/lib/security/signing";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ estimateId: string }> }
) {
  const { estimateId } = await params;
  const { searchParams } = new URL(request.url);
  const signed = verifyScopedSignature(
    "estimate-pdf",
    estimateId,
    searchParams.get("exp"),
    searchParams.get("sig")
  );

  let tenantId: string | undefined;
  if (!signed) {
    const actor = await requireActor("estimate:read");
    tenantId = actor.tenantId;
  } else {
    const actor = await getActorContext();
    tenantId = actor?.tenantId;
  }

  const estimate = await prisma.estimate.findFirst({
    where: signed ? { id: estimateId, deletedAt: null } : tenantWhere(tenantId!, { id: estimateId }),
    include: {
      customer: true,
      job: true,
      lineItems: { where: { deletedAt: null }, orderBy: { sortOrder: "asc" } }
    }
  });

  if (!estimate) return new Response("Not found", { status: 404 });

  const business = await prisma.businessProfile.findUnique({
    where: { tenantId: estimate.tenantId }
  });

  const label = await getPdfLabels(estimate.customerLanguage);
  const buffer = await renderToBuffer(
    <EstimatePdfDocument
      estimate={estimate}
      business={business}
      locale={estimate.customerLanguage}
      label={label}
    />
  );

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${estimate.estimateNumber}.pdf"`,
      "X-Content-Type-Options": "nosniff"
    }
  });
}
