import type { PrismaClient } from "@prisma/client";

type NumberKind = "estimate" | "invoice" | "changeOrder";
type NumberingClient = Pick<PrismaClient, "estimate" | "invoice" | "changeOrder">;

const prefixes: Record<NumberKind, string> = {
  estimate: "EST",
  invoice: "INV",
  changeOrder: "CO"
};

export async function nextTenantNumber(
  tx: NumberingClient,
  tenantId: string,
  kind: NumberKind
) {
  const year = new Date().getFullYear();
  const count =
    kind === "estimate"
      ? await tx.estimate.count({ where: { tenantId } })
      : kind === "invoice"
        ? await tx.invoice.count({ where: { tenantId } })
        : await tx.changeOrder.count({ where: { tenantId } });

  return `${prefixes[kind]}-${year}-${String(count + 1).padStart(4, "0")}`;
}
