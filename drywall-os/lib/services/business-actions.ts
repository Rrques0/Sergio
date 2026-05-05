"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { writeAuditLog } from "@/lib/audit/audit-log";
import { requireActor } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { formString, localeSchema, optionalFormString, sanitizeText } from "@/lib/validation/common";

const businessSchema = z.object({
  locale: localeSchema.default("en"),
  companyName: z.string().min(2).max(160),
  phone: z.string().min(7).max(32),
  email: z.string().email(),
  website: z.string().url().optional(),
  licenseNumber: z.string().max(80).optional(),
  addressLine1: z.string().min(3).max(180),
  addressLine2: z.string().max(180).optional(),
  city: z.string().min(2).max(100),
  state: z.string().min(2).max(64),
  postalCode: z.string().min(3).max(20),
  defaultTerms: z.string().min(3).max(2000),
  estimateFooter: z.string().min(3).max(1000),
  invoiceFooter: z.string().min(3).max(1000)
});

export async function getBusinessProfile() {
  const actor = await requireActor("business:manage");
  return prisma.businessProfile.findUnique({
    where: { tenantId: actor.tenantId }
  });
}

export async function updateBusinessProfileAction(formData: FormData) {
  const actor = await requireActor("business:manage");
  const parsed = businessSchema.parse({
    locale: formString(formData, "locale"),
    companyName: sanitizeText(formString(formData, "companyName"), 160),
    phone: sanitizeText(formString(formData, "phone"), 32),
    email: sanitizeText(formString(formData, "email"), 160),
    website: optionalFormString(formData, "website"),
    licenseNumber: optionalFormString(formData, "licenseNumber"),
    addressLine1: sanitizeText(formString(formData, "addressLine1"), 180),
    addressLine2: optionalFormString(formData, "addressLine2"),
    city: sanitizeText(formString(formData, "city"), 100),
    state: sanitizeText(formString(formData, "state"), 64),
    postalCode: sanitizeText(formString(formData, "postalCode"), 20),
    defaultTerms: sanitizeText(formString(formData, "defaultTerms"), 2000),
    estimateFooter: sanitizeText(formString(formData, "estimateFooter"), 1000),
    invoiceFooter: sanitizeText(formString(formData, "invoiceFooter"), 1000)
  });
  const { locale, ...profileData } = parsed;

  await prisma.businessProfile.upsert({
    where: { tenantId: actor.tenantId },
    create: {
      tenantId: actor.tenantId,
      ...profileData
    },
    update: profileData
  });

  await writeAuditLog({
    tenantId: actor.tenantId,
    actorUserId: actor.userId,
    action: "business_profile.update",
    entityType: "BusinessProfile",
    entityId: actor.tenantId
  });

  revalidatePath(`/${locale}/settings`);
  redirect(`/${locale}/settings`);
}
