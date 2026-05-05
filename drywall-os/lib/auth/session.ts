import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import type { Permission } from "@/lib/rbac/permissions";
import { can } from "@/lib/rbac/permissions";

export type ActorContext = {
  userId: string;
  tenantId: string;
  role: import("@prisma/client").UserRole;
  locale: string;
};

export async function getActorContext(): Promise<ActorContext | null> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) return null;

  const membership = await prisma.membership.findFirst({
    where: {
      userId,
      status: "ACTIVE",
      deletedAt: null,
      role: { not: "STANDARD_AUTOMATA_ADMIN" }
    },
    include: {
      user: { select: { preferredLocale: true } }
    },
    orderBy: { createdAt: "asc" }
  });

  if (!membership) return null;

  return {
    userId,
    tenantId: membership.tenantId,
    role: membership.role,
    locale: membership.user.preferredLocale
  };
}

export async function requireActor(permission: Permission): Promise<ActorContext> {
  const actor = await getActorContext();
  if (!actor) {
    redirect("/en/login");
  }

  if (!can(actor.role, permission)) {
    throw new Error("errors.forbidden");
  }

  return actor;
}

export async function requireOperator() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    redirect("/en/login");
  }

  const membership = await prisma.membership.findFirst({
    where: {
      userId,
      status: "ACTIVE",
      deletedAt: null,
      role: "STANDARD_AUTOMATA_ADMIN"
    }
  });

  if (!membership) {
    throw new Error("errors.operatorOnly");
  }

  return {
    userId,
    tenantId: membership.tenantId,
    role: membership.role
  };
}
