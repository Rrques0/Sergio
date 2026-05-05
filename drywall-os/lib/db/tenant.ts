import type { Prisma } from "@prisma/client";

export function tenantWhere<T extends Record<string, unknown>>(
  tenantId: string,
  where?: T
): T & { tenantId: string; deletedAt?: null } {
  return {
    ...(where ?? {}),
    tenantId,
    deletedAt: null
  } as T & { tenantId: string; deletedAt?: null };
}

export function activeWhere<T extends Record<string, unknown>>(
  where?: T
): T & { deletedAt?: null } {
  return {
    ...(where ?? {}),
    deletedAt: null
  } as T & { deletedAt?: null };
}

export function requireSameTenant(
  tenantId: string,
  record: { tenantId: string } | null,
  entityName = "record"
) {
  if (!record || record.tenantId !== tenantId) {
    throw new Error(`${entityName}:not_found`);
  }
}

export const forbiddenRawSqlMessage =
  "Raw SQL is forbidden outside the audited database allowlist.";

export async function auditedRawQuery<T>(
  query: Prisma.Sql,
  reason: string
): Promise<T> {
  void query;
  void reason;
  throw new Error(forbiddenRawSqlMessage);
}
