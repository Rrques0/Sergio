import { FileDown, FileText, Plus, ReceiptText } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Badge } from "@/components/ui/badge";
import { Button, LinkButton } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { listCustomers } from "@/lib/services/customer-actions";
import { listJobs } from "@/lib/services/job-actions";
import { createEstimateAction, listEstimates } from "@/lib/services/estimate-actions";
import { convertEstimateToInvoiceAction } from "@/lib/services/invoice-actions";
import { formatMoney } from "@/lib/i18n/format";

export default async function EstimatesPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("estimate");
  const common = await getTranslations("common");
  const [customers, jobs, estimates] = await Promise.all([
    listCustomers(),
    listJobs(),
    listEstimates()
  ]);

  return (
    <>
      <section>
        <p className="text-sm font-bold text-primary">{t("eyebrow")}</p>
        <h1 className="text-2xl font-black">{t("title")}</h1>
      </section>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>{t("builderTitle")}</CardTitle>
            <CardDescription>{t("builderDescription")}</CardDescription>
          </div>
          <FileText className="h-5 w-5 text-primary" aria-hidden />
        </CardHeader>
        <form action={createEstimateAction} className="grid gap-4">
          <input type="hidden" name="locale" value={locale} />
          <div className="form-grid">
            <Field label={t("customer")}>
              <Select name="customerId" required>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t("job")}>
              <Select name="jobId" required>
                {jobs.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.title}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t("customerLanguage")}>
              <Select name="customerLanguage" defaultValue={locale}>
                <option value="en">{common("english")}</option>
                <option value="es">{common("spanish")}</option>
              </Select>
            </Field>
            <Field label={t("estimateTitle")}>
              <Input name="title" required defaultValue={t("defaultTitle")} />
            </Field>
            <Field label={t("expiresAt")}>
              <Input name="expiresAt" type="date" />
            </Field>
            <Field label={t("markupPercent")}>
              <Input name="markupPercent" inputMode="decimal" defaultValue="10" />
            </Field>
            <Field label={t("taxPercent")}>
              <Input name="taxPercent" inputMode="decimal" defaultValue="0" />
            </Field>
            <Field label={t("depositPercent")}>
              <Input name="depositPercent" inputMode="decimal" defaultValue="30" />
            </Field>
          </div>
          <Field label={t("scopeSummary")}>
            <Textarea name="scopeSummary" required defaultValue={t("defaultScope")} />
          </Field>
          <div className="form-grid">
            <Field label={t("materials")}>
              <Input name="materialsCents" inputMode="decimal" />
            </Field>
            <Field label={t("hangingLabor")}>
              <Input name="hangingLaborCents" inputMode="decimal" />
            </Field>
            <Field label={t("tapingMuddingLabor")}>
              <Input name="tapingMuddingLaborCents" inputMode="decimal" />
            </Field>
            <Field label={t("sandingLabor")}>
              <Input name="sandingLaborCents" inputMode="decimal" />
            </Field>
            <Field label={t("texture")}>
              <Input name="textureCents" inputMode="decimal" />
            </Field>
            <Field label={t("disposal")}>
              <Input name="disposalCents" inputMode="decimal" />
            </Field>
            <Field label={t("travel")}>
              <Input name="travelCents" inputMode="decimal" />
            </Field>
            <Field label={t("rush")}>
              <Input name="rushCents" inputMode="decimal" />
            </Field>
            <Field label={t("subcontractor")}>
              <Input name="subcontractorCents" inputMode="decimal" />
            </Field>
          </div>
          <Field label={t("terms")}>
            <Textarea name="terms" />
          </Field>
          <Button type="submit" className="w-full sm:w-fit">
            <Plus className="h-4 w-4" aria-hidden />
            {t("createAction")}
          </Button>
        </form>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>{t("listTitle")}</CardTitle>
            <CardDescription>{t("listDescription")}</CardDescription>
          </div>
        </CardHeader>
        <div className="grid gap-3">
          {estimates.length ? (
            estimates.map((estimate) => (
              <div key={estimate.id} className="grid gap-3 rounded-md border border-border p-3 lg:grid-cols-[1fr_auto]">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold">{estimate.estimateNumber}</p>
                    <Badge tone={estimate.status === "APPROVED" ? "green" : "orange"}>
                      {t(`statuses.${estimate.status}`)}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {estimate.customer.name} · {estimate.job.title}
                  </p>
                  <p className="mt-2 font-black">{formatMoney(estimate.totalCents, locale)}</p>
                </div>
                <div className="flex flex-wrap items-end gap-2 lg:justify-end">
                  <LinkButton href={`/api/estimates/${estimate.id}/pdf`} variant="outline">
                    <FileDown className="h-4 w-4" aria-hidden />
                    {t("pdfAction")}
                  </LinkButton>
                  {!estimate.convertedInvoice ? (
                    <form action={convertEstimateToInvoiceAction}>
                      <input type="hidden" name="locale" value={locale} />
                      <input type="hidden" name="estimateId" value={estimate.id} />
                      <Button type="submit">
                        <ReceiptText className="h-4 w-4" aria-hidden />
                        {t("convertAction")}
                      </Button>
                    </form>
                  ) : null}
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">{common("emptyState")}</p>
          )}
        </div>
      </Card>
    </>
  );
}
