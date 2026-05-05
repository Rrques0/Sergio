"use server";

import { CrewRole, PayType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { writeAuditLog } from "@/lib/audit/audit-log";
import { requireActor } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { tenantWhere } from "@/lib/db/tenant";
import { formMoneyToCents, formString, localeSchema, optionalFormString, sanitizeText } from "@/lib/validation/common";

const crewMemberSchema = z.object({
  locale: localeSchema.default("en"),
  name: z.string().min(2).max(160),
  role: z.nativeEnum(CrewRole),
  phone: z.string().max(32).optional(),
  payType: z.nativeEnum(PayType),
  payRateCents: z.number().int().nonnegative().optional(),
  availability: z.string().max(500).optional(),
  notes: z.string().max(1000).optional()
});

export async function listCrewMembers() {
  const actor = await requireActor("crew:manage");
  return prisma.crewMember.findMany({
    where: tenantWhere(actor.tenantId),
    orderBy: { name: "asc" },
    include: {
      assignments: {
        where: { deletedAt: null },
        include: { job: { select: { id: true, title: true, status: true } } }
      }
    }
  });
}

export async function createCrewMemberAction(formData: FormData) {
  const actor = await requireActor("crew:manage");
  const parsed = crewMemberSchema.parse({
    locale: formString(formData, "locale"),
    name: sanitizeText(formString(formData, "name"), 160),
    role: formString(formData, "role"),
    phone: optionalFormString(formData, "phone"),
    payType: formString(formData, "payType"),
    payRateCents: formString(formData, "payRateCents")
      ? formMoneyToCents(formData, "payRateCents")
      : undefined,
    availability: optionalFormString(formData, "availability"),
    notes: optionalFormString(formData, "notes")
  });

  const member = await prisma.crewMember.create({
    data: {
      tenantId: actor.tenantId,
      name: parsed.name,
      role: parsed.role,
      phone: parsed.phone,
      payType: parsed.payType,
      payRateCents: parsed.payRateCents,
      availability: parsed.availability,
      notes: parsed.notes
    }
  });

  await writeAuditLog({
    tenantId: actor.tenantId,
    actorUserId: actor.userId,
    action: "crew_member.create",
    entityType: "CrewMember",
    entityId: member.id
  });

  revalidatePath(`/${parsed.locale}/crew`);
  redirect(`/${parsed.locale}/crew`);
}

export async function assignCrewMemberAction(formData: FormData) {
  const actor = await requireActor("crew:manage");
  const locale = formString(formData, "locale") || "en";
  const crewMemberId = formString(formData, "crewMemberId");
  const jobId = formString(formData, "jobId");

  const [member, job] = await Promise.all([
    prisma.crewMember.findFirst({ where: tenantWhere(actor.tenantId, { id: crewMemberId }) }),
    prisma.job.findFirst({ where: tenantWhere(actor.tenantId, { id: jobId }) })
  ]);

  if (!member || !job) throw new Error("errors.notFound");

  const assignment = await prisma.crewAssignment.create({
    data: {
      tenantId: actor.tenantId,
      crewMemberId,
      jobId,
      assignedRole: member.role
    }
  });

  await writeAuditLog({
    tenantId: actor.tenantId,
    actorUserId: actor.userId,
    action: "crew.assign",
    entityType: "CrewAssignment",
    entityId: assignment.id,
    metadata: { jobId, crewMemberId }
  });

  revalidatePath(`/${locale}/crew`);
}
