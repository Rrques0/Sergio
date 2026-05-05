import { requireActor } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { tenantWhere } from "@/lib/db/tenant";
import { toCsv } from "@/lib/validation/csv";
import { writeAuditLog } from "@/lib/audit/audit-log";

export async function GET() {
  const actor = await requireActor("expense:export");
  const expenses = await prisma.expense.findMany({
    where: tenantWhere(actor.tenantId),
    orderBy: { spentAt: "desc" },
    include: {
      category: true,
      job: { select: { title: true } }
    }
  });

  const rows = [
    [
      "Date",
      "Vendor",
      "Category",
      "Schedule C Mapping",
      "Job",
      "Amount",
      "Payment Method",
      "Tax Deductible",
      "Notes"
    ],
    ...expenses.map((expense) => [
      expense.spentAt.toISOString().slice(0, 10),
      expense.vendor,
      expense.category.name,
      expense.category.scheduleCMapping ?? "",
      expense.job?.title ?? "",
      (expense.amountCents / 100).toFixed(2),
      expense.paymentMethod ?? "",
      expense.taxDeductible ? "yes" : "no",
      expense.notes ?? ""
    ])
  ];

  await writeAuditLog({
    tenantId: actor.tenantId,
    actorUserId: actor.userId,
    action: "expense.export_csv",
    entityType: "Expense",
    metadata: { count: expenses.length }
  });

  return new Response(toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="drywall-expenses-${new Date()
        .toISOString()
        .slice(0, 10)}.csv"`,
      "X-Content-Type-Options": "nosniff"
    }
  });
}
