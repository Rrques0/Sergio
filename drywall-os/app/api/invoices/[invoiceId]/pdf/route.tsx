import { renderToBuffer } from "@react-pdf/renderer";
import { NextRequest } from "next/server";

import { getActorContext, requireActor } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { tenantWhere } from "@/lib/db/tenant";
import { InvoicePdfDocument } from "@/lib/pdf/invoice-document";
import { getPdfLabels } from "@/lib/pdf/labels";
import { verifyScopedSignature } from "@/lib/security/signing";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  const { invoiceId } = await params;
  const { searchParams } = new URL(request.url);
  const signed = verifyScopedSignature(
    "invoice-pdf",
    invoiceId,
    searchParams.get("exp"),
    searchParams.get("sig")
  );

  let tenantId: string | undefined;
  if (!signed) {
    const actor = await requireActor("invoice:read");
    tenantId = actor.tenantId;
  } else {
    const actor = await getActorContext();
    tenantId = actor?.tenantId;
  }

  const invoice = await prisma.invoice.findFirst({
    where: signed ? { id: invoiceId, deletedAt: null } : tenantWhere(tenantId!, { id: invoiceId }),
    include: {
      customer: true,
      job: true,
      lineItems: { where: { deletedAt: null }, orderBy: { sortOrder: "asc" } }
    }
  });

  if (!invoice) return new Response("Not found", { status: 404 });

  const business = await prisma.businessProfile.findUnique({
    where: { tenantId: invoice.tenantId }
  });

  const label = await getPdfLabels(invoice.customerLanguage);
  const buffer = await renderToBuffer(
    <InvoicePdfDocument
      invoice={invoice}
      business={business}
      locale={invoice.customerLanguage}
      label={label}
    />
  );

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${invoice.invoiceNumber}.pdf"`,
      "X-Content-Type-Options": "nosniff"
    }
  });
}
