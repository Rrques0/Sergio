"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { writeAuditLog } from "@/lib/audit/audit-log";
import { requireActor } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { nextTenantNumber } from "@/lib/services/numbering";
import { formString } from "@/lib/validation/common";

export async function createSampleDrywallJobAction(formData: FormData) {
  const actor = await requireActor("job:create");
  const locale = formString(formData, "locale") || "en";

  const result = await prisma.$transaction(async (tx) => {
    const customer = await tx.customer.create({
      data: {
        tenantId: actor.tenantId,
        name: "Maria Rodriguez",
        phone: "555-0109",
        email: "maria@example.com",
        billingAddress: "123 Main Street",
        customerType: "HOMEOWNER",
        preferredLanguage: "es",
        notes: "Sample homeowner for a water-damage ceiling repair."
      }
    });

    const job = await tx.job.create({
      data: {
        tenantId: actor.tenantId,
        customerId: customer.id,
        title: "Water-damage ceiling repair",
        jobAddressLine1: "123 Main Street",
        city: "Phoenix",
        state: "AZ",
        postalCode: "85001",
        jobType: "WATER_DAMAGE_REPAIR",
        status: "ESTIMATE_DRAFTED",
        squareFootageEstimate: 420,
        numberOfRooms: 2,
        ceilingHeightFeet: "8",
        drywallThickness: "HALF_INCH",
        boardType: "MOISTURE_RESISTANT",
        finishLevel: "LEVEL_4",
        textureType: "ORANGE_PEEL",
        notes: "Patch ceiling water damage, match orange peel texture, paint-ready finish.",
        drywallDetails: {
          create: {
            tenantId: actor.tenantId,
            squareFootage: 420,
            numberOfRooms: 2,
            ceilingHeightFeet: "8",
            numberOfSheets: 8,
            drywallThickness: "HALF_INCH",
            boardType: "MOISTURE_RESISTANT",
            finishLevel: "LEVEL_4",
            textureType: "ORANGE_PEEL"
          }
        }
      }
    });

    await tx.jobStatusHistory.create({
      data: {
        tenantId: actor.tenantId,
        jobId: job.id,
        toStatus: "ESTIMATE_DRAFTED",
        changedById: actor.userId,
        note: "Sample job created"
      }
    });

    const estimateNumber = await nextTenantNumber(tx, actor.tenantId, "estimate");
    const estimate = await tx.estimate.create({
      data: {
        tenantId: actor.tenantId,
        customerId: customer.id,
        jobId: job.id,
        estimateNumber,
        status: "DRAFT",
        customerLanguage: "es",
        title: "Water-damage drywall repair",
        scopeSummary:
          "Repair two bedroom ceiling areas with moisture-resistant board, tape, mud, sand, orange-peel texture match, cleanup, and paint-ready finish.",
        terms:
          "Estimate is valid for 14 days. Any added hidden damage requires an approved change order.",
        subtotalCents: 150000,
        markupCents: 15000,
        taxCents: 0,
        totalCents: 165000,
        depositRequiredCents: 49500,
        lineItems: {
          create: [
            {
              tenantId: actor.tenantId,
              name: "Drywall material",
              quantity: "1",
              unit: "each",
              unitPriceCents: 30000,
              sortOrder: 0
            },
            {
              tenantId: actor.tenantId,
              name: "Repair labor",
              quantity: "1",
              unit: "each",
              unitPriceCents: 120000,
              sortOrder: 1
            }
          ]
        }
      }
    });

    return { customerId: customer.id, jobId: job.id, estimateId: estimate.id };
  });

  await writeAuditLog({
    tenantId: actor.tenantId,
    actorUserId: actor.userId,
    action: "sample_job.create",
    entityType: "Job",
    entityId: result.jobId,
    metadata: result
  });

  revalidatePath(`/${locale}`);
  redirect(`/${locale}/jobs`);
}
