import { UserRole } from "@prisma/client";

export const permissions = [
  "business:manage",
  "customer:read",
  "customer:create",
  "customer:update",
  "job:read",
  "job:create",
  "job:update",
  "estimate:read",
  "estimate:create",
  "estimate:update",
  "estimate:send",
  "invoice:read",
  "invoice:create",
  "invoice:update",
  "payment:create",
  "expense:read",
  "expense:create",
  "expense:export",
  "file:upload",
  "qr:create",
  "crew:manage",
  "materials:manage",
  "change-order:manage",
  "reports:read",
  "audit:read",
  "operator:read",
  "operator:manage"
] as const;

export type Permission = (typeof permissions)[number];

const rolePermissions: Record<UserRole, Permission[]> = {
  OWNER: [
    "business:manage",
    "customer:read",
    "customer:create",
    "customer:update",
    "job:read",
    "job:create",
    "job:update",
    "estimate:read",
    "estimate:create",
    "estimate:update",
    "estimate:send",
    "invoice:read",
    "invoice:create",
    "invoice:update",
    "payment:create",
    "expense:read",
    "expense:create",
    "expense:export",
    "file:upload",
    "qr:create",
    "crew:manage",
    "materials:manage",
    "change-order:manage",
    "reports:read",
    "audit:read"
  ],
  MANAGER: [
    "customer:read",
    "customer:create",
    "customer:update",
    "job:read",
    "job:create",
    "job:update",
    "estimate:read",
    "estimate:create",
    "estimate:update",
    "estimate:send",
    "invoice:read",
    "invoice:create",
    "invoice:update",
    "expense:read",
    "expense:create",
    "file:upload",
    "qr:create",
    "crew:manage",
    "materials:manage",
    "change-order:manage",
    "reports:read"
  ],
  CREW_LEAD: ["job:read", "job:update", "file:upload", "crew:manage"],
  WORKER: ["job:read", "file:upload"],
  BOOKKEEPER: [
    "customer:read",
    "job:read",
    "estimate:read",
    "invoice:read",
    "invoice:create",
    "invoice:update",
    "payment:create",
    "expense:read",
    "expense:create",
    "expense:export",
    "reports:read"
  ],
  AUDITOR: ["customer:read", "job:read", "estimate:read", "invoice:read", "expense:read", "reports:read", "audit:read"],
  STANDARD_AUTOMATA_ADMIN: ["operator:read", "operator:manage", "audit:read"]
};

export function can(role: UserRole, permission: Permission) {
  return rolePermissions[role].includes(permission);
}
