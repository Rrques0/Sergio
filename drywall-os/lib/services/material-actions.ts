"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { writeAuditLog } from "@/lib/audit/audit-log";
import { requireActor } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { tenantWhere } from "@/lib/db/tenant";
import { formMoneyToCents, formString, localeSchema, optionalFormString, sanitizeText } from "@/lib/validation/common";

const materialSchema = z.object({
  locale: localeSchema.default("en"),
  name: z.string().min(2).max(160),
  unit: z.string().min(1).max(40),
  unitCostCents: z.number().int().nonnegative(),
  quantityOnHand: z.string().default("0"),
  reorderThreshold: z.string().default("0"),
  notes: z.string().max(1000).optional()
});

export async function listMaterials() {
  const actor = await requireActor("materials:manage");
  return prisma.material.findMany({
    where: tenantWhere(actor.tenantId),
    orderBy: { name: "asc" },
    include: { supplier: true }
  });
}

export async function createMaterialAction(formData: FormData) {
  const actor = await requireActor("materials:manage");
  const parsed = materialSchema.parse({
    locale: formString(formData, "locale"),
    name: sanitizeText(formString(formData, "name"), 160),
    unit: sanitizeText(formString(formData, "unit"), 40),
    unitCostCents: formMoneyToCents(formData, "unitCostCents"),
    quantityOnHand: formString(formData, "quantityOnHand") || "0",
    reorderThreshold: formString(formData, "reorderThreshold") || "0",
    notes: optionalFormString(formData, "notes")
  });

  const material = await prisma.material.create({
    data: {
      tenantId: actor.tenantId,
      name: parsed.name,
      unit: parsed.unit,
      unitCostCents: parsed.unitCostCents,
      quantityOnHand: parsed.quantityOnHand,
      reorderThreshold: parsed.reorderThreshold,
      notes: parsed.notes
    }
  });

  await writeAuditLog({
    tenantId: actor.tenantId,
    actorUserId: actor.userId,
    action: "material.create",
    entityType: "Material",
    entityId: material.id
  });

  revalidatePath(`/${parsed.locale}/materials`);
  redirect(`/${parsed.locale}/materials`);
}
