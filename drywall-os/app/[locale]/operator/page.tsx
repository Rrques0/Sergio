import { ShieldCheck } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { getOperatorMetrics } from "@/lib/services/dashboard";

export default async function OperatorPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("admin");
  const metrics = await getOperatorMetrics();

  return (
    <main className="mx-auto grid min-h-screen w-full max-w-6xl gap-5 px-4 py-5">
      <section className="rounded-lg border border-border bg-primary p-5 text-primary-foreground shadow-panel">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold opacity-85">{t("eyebrow")}</p>
            <h1 className="text-2xl font-black">{t("title")}</h1>
          </div>
          <ShieldCheck className="h-8 w-8" aria-hidden />
        </div>
      </section>
      <section className="metric-grid">
        <Card>
          <CardDescription>{t("tenantCount")}</CardDescription>
          <CardTitle className="mt-2 text-3xl">{metrics.tenantCount}</CardTitle>
        </Card>
        <Card>
          <CardDescription>{t("activeTenantCount")}</CardDescription>
          <CardTitle className="mt-2 text-3xl">{metrics.activeTenantCount}</CardTitle>
        </Card>
        <Card>
          <CardDescription>{t("userCount")}</CardDescription>
          <CardTitle className="mt-2 text-3xl">{metrics.userCount}</CardTitle>
        </Card>
        <Card>
          <CardDescription>{t("invoiceCount")}</CardDescription>
          <CardTitle className="mt-2 text-3xl">{metrics.invoiceCount}</CardTitle>
        </Card>
        <Card>
          <CardDescription>{t("storageUsage")}</CardDescription>
          <CardTitle className="mt-2 text-3xl">
            {t("kilobytes", { count: Math.round(metrics.storageBytes / 1024) })}
          </CardTitle>
        </Card>
        <Card>
          <CardDescription>{t("auditEvents")}</CardDescription>
          <CardTitle className="mt-2 text-3xl">{metrics.auditCount}</CardTitle>
        </Card>
      </section>
      <p className="text-sm text-muted-foreground">{t("localeNote", { locale })}</p>
    </main>
  );
}
