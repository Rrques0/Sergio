import { createHash } from "node:crypto";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

type AuditInput = {
  tenantId: string;
  actorUserId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  requestId?: string;
  metadata?: Prisma.InputJsonValue;
};

function hashAuditPayload(payload: unknown) {
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

export async function writeAuditLog(input: AuditInput) {
  const previous = await prisma.auditLog.findFirst({
    where: { tenantId: input.tenantId },
    orderBy: { createdAt: "desc" },
    select: { hash: true }
  });

  const payload = {
    ...input,
    previousHash: previous?.hash ?? null,
    createdAt: new Date().toISOString()
  };
  const hash = hashAuditPayload(payload);

  return prisma.auditLog.create({
    data: {
      ...input,
      previousHash: previous?.hash,
      metadata: input.metadata,
      hash
    }
  });
}

export async function writeOperatorAuditLog(input: Omit<AuditInput, "tenantId">) {
  const previous = await prisma.operatorAuditLog.findFirst({
    orderBy: { createdAt: "desc" },
    select: { hash: true }
  });

  const payload = {
    ...input,
    previousHash: previous?.hash ?? null,
    createdAt: new Date().toISOString()
  };
  const hash = hashAuditPayload(payload);

  return prisma.operatorAuditLog.create({
    data: {
      ...input,
      previousHash: previous?.hash,
      metadata: input.metadata,
      hash
    }
  });
}
