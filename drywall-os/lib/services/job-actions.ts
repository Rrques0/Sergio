"use server";

import {
  BoardType,
  DrywallThickness,
  FinishLevel,
  JobStatus,
  JobType,
  TextureType
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { writeAuditLog } from "@/lib/audit/audit-log";
import { requireActor } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { tenantWhere } from "@/lib/db/tenant";
import {
  formInt,
  formString,
  localeSchema,
  optionalFormString,
  sanitizeText
} from "@/lib/validation/common";

const jobSchema = z.object({
  locale: localeSchema.default("en"),
  customerId: z.string().min(8),
  title: z.string().min(2).max(180),
  jobAddressLine1: z.string().min(3).max(180),
  jobAddressLine2: z.string().max(180).optional(),
  city: z.string().min(2).max(100),
  state: z.string().min(2).max(64),
  postalCode: z.string().min(3).max(20),
  jobType: z.nativeEnum(JobType),
  status: z.nativeEnum(JobStatus).default("LEAD"),
  squareFootageEstimate: z.number().int().positive().optional(),
  numberOfRooms: z.number().int().positive().optional(),
  ceilingHeightFeet: z.string().optional(),
  drywallThickness: z.nativeEnum(DrywallThickness).optional(),
  boardType: z.nativeEnum(BoardType).optional(),
  finishLevel: z.nativeEnum(FinishLevel).optional(),
  textureType: z.nativeEnum(TextureType).optional(),
  startDate: z.string().optional(),
  targetCompletionDate: z.string().optional(),
  notes: z.string().max(2000).optional()
});

export async function listJobs() {
  const actor = await requireActor("job:read");
  return prisma.job.findMany({
    where: tenantWhere(actor.tenantId),
    orderBy: { createdAt: "desc" },
    include: {
      customer: true,
      estimates: { where: { deletedAt: null }, select: { id: true, status: true, totalCents: true } },
      invoices: { where: { deletedAt: null }, select: { id: true, status: true, balanceDueCents: true } },
      jobPhotos: { where: { deletedAt: null }, take: 4, orderBy: { createdAt: "desc" } }
    }
  });
}

export async function createJobAction(formData: FormData) {
  const actor = await requireActor("job:create");
  const parsed = jobSchema.parse({
    locale: formString(formData, "locale"),
    customerId: formString(formData, "customerId"),
    title: sanitizeText(formString(formData, "title"), 180),
    jobAddressLine1: sanitizeText(formString(formData, "jobAddressLine1"), 180),
    jobAddressLine2: optionalFormString(formData, "jobAddressLine2"),
    city: sanitizeText(formString(formData, "city"), 100),
    state: sanitizeText(formString(formData, "state"), 64),
    postalCode: sanitizeText(formString(formData, "postalCode"), 20),
    jobType: formString(formData, "jobType"),
    status: formString(formData, "status") || "LEAD",
    squareFootageEstimate: formInt(formData, "squareFootageEstimate"),
    numberOfRooms: formInt(formData, "numberOfRooms"),
    ceilingHeightFeet: optionalFormString(formData, "ceilingHeightFeet"),
    drywallThickness: optionalFormString(formData, "drywallThickness"),
    boardType: optionalFormString(formData, "boardType"),
    finishLevel: optionalFormString(formData, "finishLevel"),
    textureType: optionalFormString(formData, "textureType"),
    startDate: optionalFormString(formData, "startDate"),
    targetCompletionDate: optionalFormString(formData, "targetCompletionDate"),
    notes: optionalFormString(formData, "notes")
  });

  const customer = await prisma.customer.findFirst({
    where: tenantWhere(actor.tenantId, { id: parsed.customerId }),
    select: { id: true }
  });

  if (!customer) {
    throw new Error("errors.customerNotFound");
  }

  const job = await prisma.$transaction(async (tx) => {
    const created = await tx.job.create({
      data: {
        tenantId: actor.tenantId,
        customerId: parsed.customerId,
        title: parsed.title,
        jobAddressLine1: parsed.jobAddressLine1,
        jobAddressLine2: parsed.jobAddressLine2,
        city: parsed.city,
        state: parsed.state,
        postalCode: parsed.postalCode,
        jobType: parsed.jobType,
        status: parsed.status,
        squareFootageEstimate: parsed.squareFootageEstimate,
        numberOfRooms: parsed.numberOfRooms,
        ceilingHeightFeet: parsed.ceilingHeightFeet,
        drywallThickness: parsed.drywallThickness,
        boardType: parsed.boardType,
        finishLevel: parsed.finishLevel,
        textureType: parsed.textureType,
        notes: parsed.notes,
        startDate: parsed.startDate ? new Date(parsed.startDate) : undefined,
        targetCompletionDate: parsed.targetCompletionDate
          ? new Date(parsed.targetCompletionDate)
          : undefined,
        drywallDetails: {
          create: {
            tenantId: actor.tenantId,
            squareFootage: parsed.squareFootageEstimate,
            numberOfRooms: parsed.numberOfRooms,
            ceilingHeightFeet: parsed.ceilingHeightFeet,
            drywallThickness: parsed.drywallThickness,
            boardType: parsed.boardType,
            finishLevel: parsed.finishLevel,
            textureType: parsed.textureType
          }
        }
      }
    });

    await tx.jobStatusHistory.create({
      data: {
        tenantId: actor.tenantId,
        jobId: created.id,
        toStatus: parsed.status,
        changedById: actor.userId,
        note: "Initial job creation"
      }
    });

    return created;
  });

  await writeAuditLog({
    tenantId: actor.tenantId,
    actorUserId: actor.userId,
    action: "job.create",
    entityType: "Job",
    entityId: job.id
  });

  revalidatePath(`/${parsed.locale}/jobs`);
  redirect(`/${parsed.locale}/jobs`);
}

export async function updateJobStatusAction(formData: FormData) {
  const actor = await requireActor("job:update");
  const locale = formString(formData, "locale") || "en";
  const jobId = formString(formData, "jobId");
  const toStatus = z.nativeEnum(JobStatus).parse(formString(formData, "status"));

  const job = await prisma.job.findFirst({
    where: tenantWhere(actor.tenantId, { id: jobId })
  });

  if (!job) throw new Error("errors.jobNotFound");

  await prisma.$transaction(async (tx) => {
    await tx.job.update({
      where: { id: job.id },
      data: { status: toStatus }
    });
    await tx.jobStatusHistory.create({
      data: {
        tenantId: actor.tenantId,
        jobId: job.id,
        fromStatus: job.status,
        toStatus,
        changedById: actor.userId
      }
    });
  });

  await writeAuditLog({
    tenantId: actor.tenantId,
    actorUserId: actor.userId,
    action: "job.status.update",
    entityType: "Job",
    entityId: job.id,
    metadata: { fromStatus: job.status, toStatus }
  });

  revalidatePath(`/${locale}/jobs`);
}
