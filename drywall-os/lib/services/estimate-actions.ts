"use server";

import { EstimateStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { writeAuditLog } from "@/lib/audit/audit-log";
import { requireActor } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { tenantWhere } from "@/lib/db/tenant";
import { nextTenantNumber } from "@/lib/services/numbering";
import {
  formMoneyToCents,
  formString,
  localeSchema,
  optionalFormString,
  sanitizeText
} from "@/lib/validation/common";

const estimateSchema = z.object({
  locale: localeSchema.default("en"),
  customerId: z.string().min(8),
  jobId: z.string().min(8),
  customerLanguage: localeSchema.default("en"),
  title: z.string().min(2).max(180),
  scopeSummary: z.string().min(3).max(2000),
  expiresAt: z.string().optional(),
  terms: z.string().max(2000).optional(),
  markupPercent: z.coerce.number().min(0).max(100).default(0),
  taxPercent: z.coerce.number().min(0).max(20).default(0),
  depositPercent: z.coerce.number().min(0).max(100).default(30)
});

function moneyLine(name: string, amountCents: number, description?: string) {
  return amountCents > 0
    ? {
        name,
        description,
        quantity: "1",
        unit: "each",
        unitPriceCents: amountCents,
        taxable: true
      }
    : null;
}

export async function listEstimates() {
  const actor = await requireActor("estimate:read");
  return prisma.estimate.findMany({
    where: tenantWhere(actor.tenantId),
    orderBy: { createdAt: "desc" },
    include: {
      customer: true,
      job: true,
      lineItems: { where: { deletedAt: null }, orderBy: { sortOrder: "asc" } },
      convertedInvoice: true
    }
  });
}

export async function createEstimateAction(formData: FormData) {
  const actor = await requireActor("estimate:create");
  const parsed = estimateSchema.parse({
    locale: formString(formData, "locale"),
    customerId: formString(formData, "customerId"),
    jobId: formString(formData, "jobId"),
    customerLanguage: formString(formData, "customerLanguage") || "en",
    title: sanitizeText(formString(formData, "title"), 180),
    scopeSummary: sanitizeText(formString(formData, "scopeSummary"), 2000),
    expiresAt: optionalFormString(formData, "expiresAt"),
    terms: optionalFormString(formData, "terms"),
    markupPercent: formString(formData, "markupPercent") || "0",
    taxPercent: formString(formData, "taxPercent") || "0",
    depositPercent: formString(formData, "depositPercent") || "30"
  });

  const job = await prisma.job.findFirst({
    where: tenantWhere(actor.tenantId, {
      id: parsed.jobId,
      customerId: parsed.customerId
    }),
    include: { customer: true }
  });

  if (!job) throw new Error("errors.jobNotFound");

  const profile = await prisma.businessProfile.findUnique({
    where: { tenantId: actor.tenantId }
  });

  const lineItems = [
    moneyLine("Drywall material", formMoneyToCents(formData, "materialsCents")),
    moneyLine("Hanging labor", formMoneyToCents(formData, "hangingLaborCents")),
    moneyLine("Taping / mudding labor", formMoneyToCents(formData, "tapingMuddingLaborCents")),
    moneyLine("Sanding labor", formMoneyToCents(formData, "sandingLaborCents")),
    moneyLine("Texture", formMoneyToCents(formData, "textureCents")),
    moneyLine("Disposal", formMoneyToCents(formData, "disposalCents")),
    moneyLine("Travel", formMoneyToCents(formData, "travelCents")),
    moneyLine("Rush fee", formMoneyToCents(formData, "rushCents")),
    moneyLine("Subcontractor cost", formMoneyToCents(formData, "subcontractorCents"))
  ].filter((item): item is NonNullable<typeof item> => item !== null);

  if (lineItems.length === 0) {
    throw new Error("errors.estimateNeedsLineItems");
  }

  const subtotalCents = lineItems.reduce(
    (sum, item) => sum + item.unitPriceCents,
    0
  );
  const markupCents = Math.round(subtotalCents * (parsed.markupPercent / 100));
  const taxableBaseCents = subtotalCents + markupCents;
  const taxCents = Math.round(taxableBaseCents * (parsed.taxPercent / 100));
  const totalCents = taxableBaseCents + taxCents;
  const depositRequiredCents = Math.round(totalCents * (parsed.depositPercent / 100));

  const estimate = await prisma.$transaction(async (tx) => {
    const estimateNumber = await nextTenantNumber(tx, actor.tenantId, "estimate");
    const created = await tx.estimate.create({
      data: {
        tenantId: actor.tenantId,
        customerId: parsed.customerId,
        jobId: parsed.jobId,
        estimateNumber,
        status: EstimateStatus.DRAFT,
        customerLanguage: parsed.customerLanguage,
        title: parsed.title,
        scopeSummary: parsed.scopeSummary,
        terms: parsed.terms ?? profile?.defaultTerms ?? "",
        expiresAt: parsed.expiresAt ? new Date(parsed.expiresAt) : undefined,
        subtotalCents,
        markupCents,
        taxCents,
        totalCents,
        depositRequiredCents,
        lineItems: {
          create: lineItems.map((item, index) => ({
            tenantId: actor.tenantId,
            ...item,
            sortOrder: index
          }))
        }
      }
    });

    await tx.job.update({
      where: { id: parsed.jobId },
      data: { status: "ESTIMATE_DRAFTED" }
    });

    await tx.jobStatusHistory.create({
      data: {
        tenantId: actor.tenantId,
        jobId: parsed.jobId,
        fromStatus: job.status,
        toStatus: "ESTIMATE_DRAFTED",
        changedById: actor.userId
      }
    });

    return created;
  });

  await writeAuditLog({
    tenantId: actor.tenantId,
    actorUserId: actor.userId,
    action: "estimate.create",
    entityType: "Estimate",
    entityId: estimate.id,
    metadata: { totalCents }
  });

  revalidatePath(`/${parsed.locale}/estimates`);
  redirect(`/${parsed.locale}/estimates`);
}
