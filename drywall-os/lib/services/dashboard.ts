import { startOfMonth } from "@/lib/services/date-utils";
import { requireActor, requireOperator } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { tenantWhere } from "@/lib/db/tenant";

export async function getDashboardMetrics() {
  const actor = await requireActor("reports:read");
  const monthStart = startOfMonth(new Date());

  const [
    activeJobs,
    estimatesSent,
    estimatesApproved,
    revenueMonth,
    outstandingInvoices,
    overdueInvoices,
    expensesMonth,
    jobsByStatus,
    upcomingJobs,
    recentPhotos
  ] = await Promise.all([
    prisma.job.count({
      where: {
        tenantId: actor.tenantId,
        deletedAt: null,
        status: { notIn: ["PAID", "ARCHIVED"] }
      }
    }),
    prisma.estimate.count({
      where: {
        tenantId: actor.tenantId,
        deletedAt: null,
        status: { in: ["SENT", "VIEWED"] }
      }
    }),
    prisma.estimate.count({
      where: { tenantId: actor.tenantId, deletedAt: null, status: "APPROVED" }
    }),
    prisma.invoice.aggregate({
      where: {
        tenantId: actor.tenantId,
        deletedAt: null,
        status: { in: ["PAID", "PARTIALLY_PAID"] },
        updatedAt: { gte: monthStart }
      },
      _sum: { paidCents: true }
    }),
    prisma.invoice.aggregate({
      where: {
        tenantId: actor.tenantId,
        deletedAt: null,
        status: { notIn: ["PAID", "VOIDED"] }
      },
      _sum: { balanceDueCents: true },
      _count: true
    }),
    prisma.invoice.count({
      where: { tenantId: actor.tenantId, deletedAt: null, status: "OVERDUE" }
    }),
    prisma.expense.aggregate({
      where: {
        tenantId: actor.tenantId,
        deletedAt: null,
        spentAt: { gte: monthStart }
      },
      _sum: { amountCents: true }
    }),
    prisma.job.groupBy({
      by: ["status"],
      where: { tenantId: actor.tenantId, deletedAt: null },
      _count: { status: true }
    }),
    prisma.job.findMany({
      where: {
        tenantId: actor.tenantId,
        deletedAt: null,
        startDate: { not: null }
      },
      orderBy: { startDate: "asc" },
      take: 5,
      include: { customer: true }
    }),
    prisma.jobPhoto.findMany({
      where: tenantWhere(actor.tenantId),
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { job: { select: { title: true } } }
    })
  ]);

  return {
    activeJobs,
    estimatesSent,
    estimatesApproved,
    revenueMonthCents: revenueMonth._sum.paidCents ?? 0,
    outstandingInvoiceCount: outstandingInvoices._count,
    outstandingInvoiceCents: outstandingInvoices._sum.balanceDueCents ?? 0,
    overdueInvoices,
    expensesMonthCents: expensesMonth._sum.amountCents ?? 0,
    profitEstimateCents:
      (revenueMonth._sum.paidCents ?? 0) - (expensesMonth._sum.amountCents ?? 0),
    jobsByStatus,
    upcomingJobs,
    recentPhotos
  };
}

export async function getOperatorMetrics() {
  await requireOperator();

  const [
    tenantCount,
    activeTenantCount,
    userCount,
    invoiceCount,
    storagePhotos,
    storageReceipts,
    activeDeployments,
    subscriptions,
    auditCount
  ] = await Promise.all([
    prisma.tenant.count({ where: { deletedAt: null } }),
    prisma.tenant.count({ where: { deletedAt: null, status: "ACTIVE" } }),
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.invoice.count({ where: { deletedAt: null } }),
    prisma.jobPhoto.aggregate({ _sum: { sizeBytes: true } }),
    prisma.receiptFile.aggregate({ _sum: { sizeBytes: true } }),
    prisma.deploymentInstance.count({ where: { deletedAt: null, status: "healthy" } }),
    prisma.subscription.groupBy({ by: ["status"], _count: { status: true } }),
    prisma.auditLog.count()
  ]);

  return {
    tenantCount,
    activeTenantCount,
    userCount,
    invoiceCount,
    storageBytes: (storagePhotos._sum.sizeBytes ?? 0) + (storageReceipts._sum.sizeBytes ?? 0),
    activeDeployments,
    subscriptions,
    auditCount
  };
}
