"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { writeAuditLog } from "@/lib/audit/audit-log";
import { requireActor } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { tenantWhere } from "@/lib/db/tenant";
import { nextTenantNumber } from "@/lib/services/numbering";
import { formString } from "@/lib/validation/common";

export async function listInvoices() {
  const actor = await requireActor("invoice:read");
  return prisma.invoice.findMany({
    where: tenantWhere(actor.tenantId),
    orderBy: { createdAt: "desc" },
    include: {
      customer: true,
      job: true,
      sourceEstimate: true,
      lineItems: { where: { deletedAt: null }, orderBy: { sortOrder: "asc" } },
      codeAssets: { where: { deletedAt: null }, orderBy: { createdAt: "desc" } }
    }
  });
}

export async function convertEstimateToInvoiceAction(formData: FormData) {
  const actor = await requireActor("invoice:create");
  const locale = formString(formData, "locale") || "en";
  const estimateId = formString(formData, "estimateId");

  const estimate = await prisma.estimate.findFirst({
    where: tenantWhere(actor.tenantId, { id: estimateId }),
    include: {
      lineItems: { where: { deletedAt: null }, orderBy: { sortOrder: "asc" } },
      job: true
    }
  });

  if (!estimate) throw new Error("errors.estimateNotFound");

  const invoice = await prisma.$transaction(async (tx) => {
    const invoiceNumber = await nextTenantNumber(tx, actor.tenantId, "invoice");
    const created = await tx.invoice.create({
      data: {
        tenantId: actor.tenantId,
        customerId: estimate.customerId,
        jobId: estimate.jobId,
        sourceEstimateId: estimate.id,
        invoiceNumber,
        status: "DRAFT",
        customerLanguage: estimate.customerLanguage,
        title: estimate.title,
        terms: estimate.terms,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        subtotalCents: estimate.subtotalCents + estimate.markupCents,
        taxCents: estimate.taxCents,
        totalCents: estimate.totalCents,
        balanceDueCents: estimate.totalCents,
        lineItems: {
          create: estimate.lineItems.map((item) => ({
            tenantId: actor.tenantId,
            name: item.name,
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            unitPriceCents: item.unitPriceCents,
            taxable: item.taxable,
            sortOrder: item.sortOrder
          }))
        }
      }
    });

    await tx.estimate.update({
      where: { id: estimate.id },
      data: { status: "CONVERTED" }
    });

    await tx.job.update({
      where: { id: estimate.jobId },
      data: { status: "INVOICED" }
    });

    await tx.jobStatusHistory.create({
      data: {
        tenantId: actor.tenantId,
        jobId: estimate.jobId,
        fromStatus: estimate.job.status,
        toStatus: "INVOICED",
        changedById: actor.userId
      }
    });

    return created;
  });

  await writeAuditLog({
    tenantId: actor.tenantId,
    actorUserId: actor.userId,
    action: "invoice.create_from_estimate",
    entityType: "Invoice",
    entityId: invoice.id,
    metadata: { estimateId: estimate.id, totalCents: invoice.totalCents }
  });

  revalidatePath(`/${locale}/invoices`);
  redirect(`/${locale}/invoices`);
}
