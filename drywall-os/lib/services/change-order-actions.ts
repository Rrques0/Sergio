"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { writeAuditLog } from "@/lib/audit/audit-log";
import { requireActor } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { tenantWhere } from "@/lib/db/tenant";
import { nextTenantNumber } from "@/lib/services/numbering";
import { formMoneyToCents, formString, localeSchema, sanitizeText } from "@/lib/validation/common";

const changeOrderSchema = z.object({
  locale: localeSchema.default("en"),
  jobId: z.string().min(8),
  description: z.string().min(3).max(2000),
  reason: z.string().min(3).max(1000),
  addedLaborCents: z.number().int().nonnegative(),
  addedMaterialsCents: z.number().int().nonnegative(),
  taxCents: z.number().int().nonnegative()
});

export async function listChangeOrders() {
  const actor = await requireActor("change-order:manage");
  return prisma.changeOrder.findMany({
    where: tenantWhere(actor.tenantId),
    orderBy: { createdAt: "desc" },
    include: { job: true, customer: true, lineItems: true }
  });
}

export async function createChangeOrderAction(formData: FormData) {
  const actor = await requireActor("change-order:manage");
  const parsed = changeOrderSchema.parse({
    locale: formString(formData, "locale"),
    jobId: formString(formData, "jobId"),
    description: sanitizeText(formString(formData, "description"), 2000),
    reason: sanitizeText(formString(formData, "reason"), 1000),
    addedLaborCents: formMoneyToCents(formData, "addedLaborCents"),
    addedMaterialsCents: formMoneyToCents(formData, "addedMaterialsCents"),
    taxCents: formMoneyToCents(formData, "taxCents")
  });

  const job = await prisma.job.findFirst({
    where: tenantWhere(actor.tenantId, { id: parsed.jobId }),
    select: { id: true, customerId: true }
  });
  if (!job) throw new Error("errors.jobNotFound");

  const totalCents = parsed.addedLaborCents + parsed.addedMaterialsCents + parsed.taxCents;

  const changeOrder = await prisma.$transaction(async (tx) => {
    const changeOrderNumber = await nextTenantNumber(tx, actor.tenantId, "changeOrder");
    return tx.changeOrder.create({
      data: {
        tenantId: actor.tenantId,
        customerId: job.customerId,
        jobId: job.id,
        changeOrderNumber,
        description: parsed.description,
        reason: parsed.reason,
        addedLaborCents: parsed.addedLaborCents,
        addedMaterialsCents: parsed.addedMaterialsCents,
        taxCents: parsed.taxCents,
        totalCents,
        lineItems: {
          create: [
            {
              tenantId: actor.tenantId,
              name: "Added labor",
              quantity: "1",
              unit: "each",
              unitPriceCents: parsed.addedLaborCents,
              taxable: true
            },
            {
              tenantId: actor.tenantId,
              name: "Added materials",
              quantity: "1",
              unit: "each",
              unitPriceCents: parsed.addedMaterialsCents,
              taxable: true
            }
          ].filter((item) => item.unitPriceCents > 0)
        }
      }
    });
  });

  await writeAuditLog({
    tenantId: actor.tenantId,
    actorUserId: actor.userId,
    action: "change_order.create",
    entityType: "ChangeOrder",
    entityId: changeOrder.id,
    metadata: { totalCents }
  });

  revalidatePath(`/${parsed.locale}/jobs`);
  redirect(`/${parsed.locale}/jobs`);
}

export async function approveChangeOrderAction(formData: FormData) {
  const actor = await requireActor("change-order:manage");
  const locale = formString(formData, "locale") || "en";
  const changeOrderId = formString(formData, "changeOrderId");

  const changeOrder = await prisma.changeOrder.findFirst({
    where: tenantWhere(actor.tenantId, { id: changeOrderId })
  });
  if (!changeOrder) throw new Error("errors.notFound");

  await prisma.changeOrder.update({
    where: { id: changeOrder.id },
    data: {
      status: "APPROVED",
      approvedAt: new Date()
    }
  });

  await writeAuditLog({
    tenantId: actor.tenantId,
    actorUserId: actor.userId,
    action: "change_order.approve",
    entityType: "ChangeOrder",
    entityId: changeOrder.id
  });

  revalidatePath(`/${locale}/jobs`);
}

export async function addApprovedChangeOrderToInvoiceAction(formData: FormData) {
  const actor = await requireActor("change-order:manage");
  const locale = formString(formData, "locale") || "en";
  const changeOrderId = formString(formData, "changeOrderId");
  const invoiceId = formString(formData, "invoiceId");

  const changeOrder = await prisma.changeOrder.findFirst({
    where: {
      tenantId: actor.tenantId,
      deletedAt: null,
      id: changeOrderId,
      status: "APPROVED"
    },
    include: { lineItems: { where: { deletedAt: null } } }
  });
  const invoice = await prisma.invoice.findFirst({
    where: tenantWhere(actor.tenantId, { id: invoiceId })
  });

  if (!changeOrder || !invoice) throw new Error("errors.notFound");

  await prisma.$transaction(async (tx) => {
    await tx.invoiceLineItem.createMany({
      data: changeOrder.lineItems.map((item, index) => ({
        tenantId: actor.tenantId,
        invoiceId,
        changeOrderId,
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unitPriceCents: item.unitPriceCents,
        taxable: item.taxable,
        sortOrder: index + 100
      }))
    });

    const subtotalCents = invoice.subtotalCents + changeOrder.addedLaborCents + changeOrder.addedMaterialsCents;
    const taxCents = invoice.taxCents + changeOrder.taxCents;
    const totalCents = invoice.totalCents + changeOrder.totalCents;
    const balanceDueCents = invoice.balanceDueCents + changeOrder.totalCents;

    await tx.invoice.update({
      where: { id: invoiceId },
      data: { subtotalCents, taxCents, totalCents, balanceDueCents }
    });

    await tx.changeOrder.update({
      where: { id: changeOrderId },
      data: { status: "ADDED_TO_INVOICE", invoiceId }
    });
  });

  await writeAuditLog({
    tenantId: actor.tenantId,
    actorUserId: actor.userId,
    action: "change_order.add_to_invoice",
    entityType: "ChangeOrder",
    entityId: changeOrder.id,
    metadata: { invoiceId }
  });

  revalidatePath(`/${locale}/invoices`);
}
