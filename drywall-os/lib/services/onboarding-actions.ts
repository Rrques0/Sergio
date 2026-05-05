"use server";

import { randomBytes } from "node:crypto";

import { redirect } from "next/navigation";
import { z } from "zod";

import { signIn, signOut } from "@/auth";
import { hashPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/db/prisma";
import { writeAuditLog } from "@/lib/audit/audit-log";
import { localeSchema, sanitizeText } from "@/lib/validation/common";

const registerSchema = z.object({
  locale: localeSchema.default("en"),
  ownerName: z.string().min(2).max(120),
  email: z.string().email().toLowerCase(),
  password: z.string().min(12).max(128),
  companyName: z.string().min(2).max(160),
  phone: z.string().min(7).max(32),
  addressLine1: z.string().min(3).max(180),
  city: z.string().min(2).max(100),
  state: z.string().min(2).max(64),
  postalCode: z.string().min(3).max(20)
});

const loginSchema = z.object({
  locale: localeSchema.default("en"),
  email: z.string().email().toLowerCase(),
  password: z.string().min(8)
});

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48);
}

function getFormValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? sanitizeText(value, 500) : "";
}

export async function registerOwnerAction(formData: FormData) {
  const parsed = registerSchema.parse({
    locale: getFormValue(formData, "locale"),
    ownerName: getFormValue(formData, "ownerName"),
    email: getFormValue(formData, "email"),
    password: getFormValue(formData, "password"),
    companyName: getFormValue(formData, "companyName"),
    phone: getFormValue(formData, "phone"),
    addressLine1: getFormValue(formData, "addressLine1"),
    city: getFormValue(formData, "city"),
    state: getFormValue(formData, "state"),
    postalCode: getFormValue(formData, "postalCode")
  });

  const existingUser = await prisma.user.findUnique({
    where: { email: parsed.email },
    select: { id: true }
  });

  if (existingUser) {
    throw new Error("errors.emailAlreadyRegistered");
  }

  const passwordHash = await hashPassword(parsed.password);
  const tenantSlug = `${slugify(parsed.companyName)}-${randomBytes(3).toString("hex")}`;

  const result = await prisma.$transaction(async (tx) => {
    const tenant = await tx.tenant.create({
      data: {
        name: parsed.companyName,
        slug: tenantSlug,
        defaultLocale: parsed.locale,
        planKey: "free"
      }
    });

    const user = await tx.user.create({
      data: {
        name: parsed.ownerName,
        email: parsed.email,
        passwordHash,
        preferredLocale: parsed.locale
      }
    });

    await tx.membership.create({
      data: {
        tenantId: tenant.id,
        userId: user.id,
        role: "OWNER"
      }
    });

    await tx.businessProfile.create({
      data: {
        tenantId: tenant.id,
        companyName: parsed.companyName,
        legalName: parsed.companyName,
        phone: parsed.phone,
        email: parsed.email,
        addressLine1: parsed.addressLine1,
        city: parsed.city,
        state: parsed.state,
        postalCode: parsed.postalCode,
        defaultTerms:
          "Estimate is valid until the expiration date. Approved changes require a written change order.",
        estimateFooter:
          "Thank you for considering us for your drywall project.",
        invoiceFooter:
          "Payment is due according to the invoice terms. Thank you for your business."
      }
    });

    const categories = [
      ["Drywall materials", "Supplies"],
      ["Tools", "Supplies"],
      ["Fuel", "Car and truck"],
      ["Mileage", "Car and truck"],
      ["Vehicle maintenance", "Car and truck"],
      ["Subcontractor labor", "Contract labor"],
      ["Insurance", "Insurance"],
      ["Phone", "Utilities"],
      ["Software", "Office expense"],
      ["Dump/disposal fees", "Other expenses"],
      ["Permits", "Other expenses"]
    ];

    await tx.expenseCategory.createMany({
      data: categories.map(([name, scheduleCMapping]) => ({
        tenantId: tenant.id,
        name,
        scheduleCMapping,
        isDefault: true
      }))
    });

    const materials = [
      ["Drywall sheets", "sheet", 1600, 10],
      ["Joint compound", "bucket", 1800, 4],
      ["Drywall tape", "roll", 600, 6],
      ["Drywall screws", "box", 1200, 3],
      ["Corner bead", "piece", 350, 20],
      ["Texture material", "bag", 2200, 2]
    ];

    await tx.material.createMany({
      data: materials.map(([name, unit, unitCostCents, reorderThreshold]) => ({
        tenantId: tenant.id,
        name: String(name),
        unit: String(unit),
        unitCostCents: Number(unitCostCents),
        reorderThreshold: Number(reorderThreshold)
      }))
    });

    return { tenantId: tenant.id, userId: user.id };
  });

  await writeAuditLog({
    tenantId: result.tenantId,
    actorUserId: result.userId,
    action: "tenant.register",
    entityType: "Tenant",
    entityId: result.tenantId
  });

  await signIn("credentials", {
    email: parsed.email,
    password: parsed.password,
    redirectTo: `/${parsed.locale}`
  });
}

export async function loginAction(formData: FormData) {
  const parsed = loginSchema.parse({
    locale: getFormValue(formData, "locale"),
    email: getFormValue(formData, "email"),
    password: getFormValue(formData, "password")
  });

  await signIn("credentials", {
    email: parsed.email,
    password: parsed.password,
    redirectTo: `/${parsed.locale}`
  });
}

export async function logoutAction() {
  await signOut({ redirectTo: "/en/login" });
}

export async function goHome(locale: string) {
  redirect(`/${locale}`);
}
