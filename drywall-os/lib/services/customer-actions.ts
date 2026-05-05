"use server";

import { CustomerType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { writeAuditLog } from "@/lib/audit/audit-log";
import { requireActor } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { tenantWhere } from "@/lib/db/tenant";
import { formString, localeSchema, optionalFormString, sanitizeText } from "@/lib/validation/common";

const customerSchema = z.object({
  locale: localeSchema.default("en"),
  name: z.string().min(2).max(160),
  phone: z.string().min(7).max(32),
  email: z.string().email().optional(),
  billingAddress: z.string().max(500).optional(),
  customerType: z.nativeEnum(CustomerType),
  preferredLanguage: localeSchema.default("en"),
  notes: z.string().max(2000).optional()
});

export async function listCustomers() {
  const actor = await requireActor("customer:read");
  return prisma.customer.findMany({
    where: tenantWhere(actor.tenantId),
    orderBy: { createdAt: "desc" },
    include: {
      jobs: {
        where: { deletedAt: null },
        select: { id: true, status: true }
      },
      invoices: {
        where: { deletedAt: null },
        select: { balanceDueCents: true, status: true }
      }
    }
  });
}

export async function createCustomerAction(formData: FormData) {
  const actor = await requireActor("customer:create");
  const parsed = customerSchema.parse({
    locale: formString(formData, "locale"),
    name: sanitizeText(formString(formData, "name"), 160),
    phone: sanitizeText(formString(formData, "phone"), 32),
    email: optionalFormString(formData, "email"),
    billingAddress: optionalFormString(formData, "billingAddress"),
    customerType: formString(formData, "customerType"),
    preferredLanguage: formString(formData, "preferredLanguage") || "en",
    notes: optionalFormString(formData, "notes")
  });

  const customer = await prisma.customer.create({
    data: {
      tenantId: actor.tenantId,
      name: parsed.name,
      phone: parsed.phone,
      email: parsed.email,
      billingAddress: parsed.billingAddress,
      customerType: parsed.customerType,
      preferredLanguage: parsed.preferredLanguage,
      notes: parsed.notes
    }
  });

  await writeAuditLog({
    tenantId: actor.tenantId,
    actorUserId: actor.userId,
    action: "customer.create",
    entityType: "Customer",
    entityId: customer.id
  });

  revalidatePath(`/${parsed.locale}/customers`);
  redirect(`/${parsed.locale}/customers`);
}
