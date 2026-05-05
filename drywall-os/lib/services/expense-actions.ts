"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { writeAuditLog } from "@/lib/audit/audit-log";
import { requireActor } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { tenantWhere } from "@/lib/db/tenant";
import { storeImageFile } from "@/lib/files/storage";
import {
  formMoneyToCents,
  formString,
  localeSchema,
  optionalFormString,
  sanitizeText
} from "@/lib/validation/common";

const expenseSchema = z.object({
  locale: localeSchema.default("en"),
  categoryId: z.string().min(8),
  jobId: z.string().optional(),
  vendor: z.string().min(1).max(160),
  amountCents: z.number().int().nonnegative(),
  spentAt: z.string().min(4),
  paymentMethod: z.string().max(80).optional(),
  taxDeductible: z.boolean().default(true),
  notes: z.string().max(1000).optional()
});

export async function listExpenses() {
  const actor = await requireActor("expense:read");
  return prisma.expense.findMany({
    where: tenantWhere(actor.tenantId),
    orderBy: { spentAt: "desc" },
    include: {
      category: true,
      job: { select: { id: true, title: true } },
      receiptFiles: { where: { deletedAt: null } }
    }
  });
}

export async function listExpenseCategories() {
  const actor = await requireActor("expense:read");
  return prisma.expenseCategory.findMany({
    where: tenantWhere(actor.tenantId),
    orderBy: { name: "asc" }
  });
}

export async function createExpenseAction(formData: FormData) {
  const actor = await requireActor("expense:create");
  const parsed = expenseSchema.parse({
    locale: formString(formData, "locale"),
    categoryId: formString(formData, "categoryId"),
    jobId: optionalFormString(formData, "jobId"),
    vendor: sanitizeText(formString(formData, "vendor"), 160),
    amountCents: formMoneyToCents(formData, "amountCents"),
    spentAt: formString(formData, "spentAt"),
    paymentMethod: optionalFormString(formData, "paymentMethod"),
    taxDeductible: formData.get("taxDeductible") === "on",
    notes: optionalFormString(formData, "notes")
  });

  const category = await prisma.expenseCategory.findFirst({
    where: tenantWhere(actor.tenantId, { id: parsed.categoryId }),
    select: { id: true }
  });
  if (!category) throw new Error("errors.categoryNotFound");

  if (parsed.jobId) {
    const job = await prisma.job.findFirst({
      where: tenantWhere(actor.tenantId, { id: parsed.jobId }),
      select: { id: true }
    });
    if (!job) throw new Error("errors.jobNotFound");
  }

  const file = formData.get("receipt");

  const expense = await prisma.expense.create({
    data: {
      tenantId: actor.tenantId,
      jobId: parsed.jobId,
      categoryId: parsed.categoryId,
      vendor: parsed.vendor,
      amountCents: parsed.amountCents,
      spentAt: new Date(parsed.spentAt),
      paymentMethod: parsed.paymentMethod,
      taxDeductible: parsed.taxDeductible,
      notes: parsed.notes
    }
  });

  if (file instanceof File && file.size > 0) {
    const stored = await storeImageFile(actor.tenantId, file, "receipts");
    await prisma.receiptFile.create({
      data: {
        tenantId: actor.tenantId,
        expenseId: expense.id,
        uploadedById: actor.userId,
        ...stored
      }
    });
  }

  await writeAuditLog({
    tenantId: actor.tenantId,
    actorUserId: actor.userId,
    action: "expense.create",
    entityType: "Expense",
    entityId: expense.id,
    metadata: { amountCents: parsed.amountCents }
  });

  revalidatePath(`/${parsed.locale}/expenses`);
  redirect(`/${parsed.locale}/expenses`);
}
