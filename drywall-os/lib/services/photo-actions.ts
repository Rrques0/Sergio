"use server";

import { FileVisibility, PhotoCategory } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { writeAuditLog } from "@/lib/audit/audit-log";
import { requireActor } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { tenantWhere } from "@/lib/db/tenant";
import { createSignedFileUrl, storeImageFile } from "@/lib/files/storage";
import { formString, localeSchema, optionalFormString } from "@/lib/validation/common";

const photoSchema = z.object({
  locale: localeSchema.default("en"),
  jobId: z.string().min(8),
  category: z.nativeEnum(PhotoCategory),
  visibility: z.nativeEnum(FileVisibility).default("INTERNAL"),
  caption: z.string().max(500).optional()
});

export async function listRecentPhotos(limit = 12) {
  const actor = await requireActor("job:read");
  const photos = await prisma.jobPhoto.findMany({
    where: tenantWhere(actor.tenantId),
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      job: { select: { title: true } }
    }
  });

  return photos.map((photo) => ({
    ...photo,
    signedUrl: createSignedFileUrl(photo.id)
  }));
}

export async function uploadJobPhotoAction(formData: FormData) {
  const actor = await requireActor("file:upload");
  const parsed = photoSchema.parse({
    locale: formString(formData, "locale"),
    jobId: formString(formData, "jobId"),
    category: formString(formData, "category"),
    visibility: formString(formData, "visibility") || "INTERNAL",
    caption: optionalFormString(formData, "caption")
  });

  const job = await prisma.job.findFirst({
    where: tenantWhere(actor.tenantId, { id: parsed.jobId }),
    select: { id: true }
  });
  if (!job) throw new Error("errors.jobNotFound");

  const file = formData.get("photo");
  if (!(file instanceof File) || file.size <= 0) {
    throw new Error("errors.emptyUpload");
  }

  const stored = await storeImageFile(actor.tenantId, file, "job-photos");
  const photo = await prisma.jobPhoto.create({
    data: {
      tenantId: actor.tenantId,
      jobId: parsed.jobId,
      uploadedById: actor.userId,
      category: parsed.category,
      visibility: parsed.visibility,
      caption: parsed.caption,
      ...stored
    }
  });

  await writeAuditLog({
    tenantId: actor.tenantId,
    actorUserId: actor.userId,
    action: "job_photo.upload",
    entityType: "JobPhoto",
    entityId: photo.id,
    metadata: { category: parsed.category, visibility: parsed.visibility }
  });

  revalidatePath(`/${parsed.locale}/jobs`);
  redirect(`/${parsed.locale}/jobs`);
}
