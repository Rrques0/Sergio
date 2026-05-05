import { getTranslations } from "next-intl/server";

import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { formatMoney } from "@/lib/i18n/format";
import { getDashboardMetrics } from "@/lib/services/dashboard";

export default async function ReportsPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("reports");
  const metrics = await getDashboardMetrics();

  return (
    <>
      <section>
        <p className="text-sm font-bold text-primary">{t("eyebrow")}</p>
        <h1 className="text-2xl font-black">{t("title")}</h1>
      </section>
      <section className="metric-grid">
        <Card>
          <CardDescription>{t("closeRate")}</CardDescription>
          <CardTitle className="mt-2 text-3xl">
            {metrics.estimatesSent + metrics.estimatesApproved === 0
              ? "0%"
              : `${Math.round((metrics.estimatesApproved / (metrics.estimatesSent + metrics.estimatesApproved)) * 100)}%`}
          </CardTitle>
        </Card>
        <Card>
          <CardDescription>{t("profitEstimate")}</CardDescription>
          <CardTitle className="mt-2 text-3xl">
            {formatMoney(metrics.profitEstimateCents, locale)}
          </CardTitle>
        </Card>
        <Card>
          <CardDescription>{t("unpaidBalances")}</CardDescription>
          <CardTitle className="mt-2 text-3xl">
            {formatMoney(metrics.outstandingInvoiceCents, locale)}
          </CardTitle>
        </Card>
      </section>
    </>
  );
}
