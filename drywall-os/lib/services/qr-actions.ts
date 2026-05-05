"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { writeAuditLog } from "@/lib/audit/audit-log";
import { requireActor } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { tenantWhere } from "@/lib/db/tenant";
import { createQrAsset } from "@/lib/qr/qr-service";
import { signScopedUrl } from "@/lib/security/signing";
import { formString } from "@/lib/validation/common";

export async function createInvoiceQrAction(formData: FormData) {
  const actor = await requireActor("qr:create");
  const locale = formString(formData, "locale") || "en";
  const invoiceId = formString(formData, "invoiceId");

  const invoice = await prisma.invoice.findFirst({
    where: tenantWhere(actor.tenantId, { id: invoiceId }),
    include: { job: true }
  });

  if (!invoice) throw new Error("errors.invoiceNotFound");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const signed = signScopedUrl("invoice-pdf", invoice.id);
  const targetUrl = `${appUrl}/api/invoices/${invoice.id}/pdf?exp=${signed.exp}&sig=${signed.sig}`;

  const codeAsset = await createQrAsset({
    tenantId: actor.tenantId,
    customerId: invoice.customerId,
    jobId: invoice.jobId,
    invoiceId: invoice.id,
    targetUrl,
    type: "INVOICE_QR"
  });

  await writeAuditLog({
    tenantId: actor.tenantId,
    actorUserId: actor.userId,
    action: "qr.invoice.create",
    entityType: "CodeAsset",
    entityId: codeAsset.id,
    metadata: { invoiceId: invoice.id }
  });

  revalidatePath(`/${locale}/invoices`);
  redirect(`/${locale}/invoices`);
}
