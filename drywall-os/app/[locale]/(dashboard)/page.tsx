import { AlertTriangle, CalendarDays, FileText, ImageIcon, WalletCards } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, LinkButton } from "@/components/ui/button";
import { formatMoney } from "@/lib/i18n/format";
import { getDashboardMetrics } from "@/lib/services/dashboard";
import { createSignedFileUrl } from "@/lib/files/storage";
import { createSampleDrywallJobAction } from "@/lib/services/sample-data-actions";

export default async function DashboardPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("dashboard");
  const jobT = await getTranslations("job.statuses");
  const common = await getTranslations("common");
  const metrics = await getDashboardMetrics();

  const metricCards = [
    ["activeJobs", metrics.activeJobs, FileText],
    ["estimatesSent", metrics.estimatesSent, FileText],
    ["estimatesApproved", metrics.estimatesApproved, WalletCards],
    ["overdueInvoices", metrics.overdueInvoices, AlertTriangle]
  ] as const;

  return (
    <>
      <section className="rounded-lg border border-border bg-primary p-5 text-primary-foreground shadow-panel">
        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p className="text-sm font-bold opacity-85">{t("eyebrow")}</p>
            <h1 className="mt-1 text-2xl font-black">{t("title")}</h1>
            <p className="mt-2 max-w-2xl text-sm opacity-90">{t("summary")}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <LinkButton href={`/${locale}/estimates`} variant="secondary">
              {t("newEstimate")}
            </LinkButton>
            <LinkButton href={`/${locale}/expenses`} variant="outline" className="bg-white text-primary">
              {t("logExpense")}
            </LinkButton>
            <form action={createSampleDrywallJobAction}>
              <input type="hidden" name="locale" value={locale} />
              <Button type="submit" variant="outline" className="bg-white text-primary">
                {t("sampleJob")}
              </Button>
            </form>
          </div>
        </div>
      </section>

      <section className="metric-grid">
        {metricCards.map(([key, value, Icon]) => (
          <Card key={key}>
            <CardHeader className="mb-2">
              <div>
                <CardDescription>{t(key)}</CardDescription>
                <CardTitle className="text-3xl">{value}</CardTitle>
              </div>
              <Icon className="h-5 w-5 text-primary" aria-hidden />
            </CardHeader>
          </Card>
        ))}
        <Card>
          <CardDescription>{t("revenueMonth")}</CardDescription>
          <CardTitle className="mt-2 text-3xl">
            {formatMoney(metrics.revenueMonthCents, locale)}
          </CardTitle>
        </Card>
        <Card>
          <CardDescription>{t("outstandingInvoices")}</CardDescription>
          <CardTitle className="mt-2 text-3xl">
            {formatMoney(metrics.outstandingInvoiceCents, locale)}
          </CardTitle>
        </Card>
        <Card>
          <CardDescription>{t("expensesMonth")}</CardDescription>
          <CardTitle className="mt-2 text-3xl">
            {formatMoney(metrics.expensesMonthCents, locale)}
          </CardTitle>
        </Card>
        <Card>
          <CardDescription>{t("profitEstimate")}</CardDescription>
          <CardTitle className="mt-2 text-3xl">
            {formatMoney(metrics.profitEstimateCents, locale)}
          </CardTitle>
        </Card>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>{t("jobsByStatus")}</CardTitle>
              <CardDescription>{t("jobsByStatusDescription")}</CardDescription>
            </div>
          </CardHeader>
          <div className="flex flex-wrap gap-2">
            {metrics.jobsByStatus.length ? (
              metrics.jobsByStatus.map((item) => (
                <Badge key={item.status} tone="blue">
                  {jobT(item.status)}: {item._count.status}
                </Badge>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">{common("emptyState")}</p>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>{t("upcomingJobs")}</CardTitle>
              <CardDescription>{t("upcomingJobsDescription")}</CardDescription>
            </div>
            <CalendarDays className="h-5 w-5 text-primary" aria-hidden />
          </CardHeader>
          <div className="grid gap-3">
            {metrics.upcomingJobs.length ? (
              metrics.upcomingJobs.map((job) => (
                <div key={job.id} className="rounded-md border border-border p-3">
                  <p className="font-bold">{job.title}</p>
                  <p className="text-sm text-muted-foreground">{job.customer.name}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">{common("emptyState")}</p>
            )}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>{t("recentPhotos")}</CardTitle>
            <CardDescription>{t("recentPhotosDescription")}</CardDescription>
          </div>
          <ImageIcon className="h-5 w-5 text-primary" aria-hidden />
        </CardHeader>
        {metrics.recentPhotos.length ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
            {metrics.recentPhotos.map((photo) => (
              <img
                key={photo.id}
                src={createSignedFileUrl(photo.id)}
                alt={photo.caption ?? photo.job.title}
                className="aspect-square rounded-md border border-border object-cover"
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{common("emptyState")}</p>
        )}
      </Card>
    </>
  );
}
