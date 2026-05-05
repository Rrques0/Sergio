import { Plus, Users } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { customerTypes } from "@/lib/domain/options";
import { createCustomerAction, listCustomers } from "@/lib/services/customer-actions";
import { formatMoney } from "@/lib/i18n/format";

export default async function CustomersPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("customer");
  const common = await getTranslations("common");
  const customers = await listCustomers();

  return (
    <>
      <section>
        <p className="text-sm font-bold text-primary">{t("eyebrow")}</p>
        <h1 className="text-2xl font-black">{t("title")}</h1>
      </section>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>{t("createTitle")}</CardTitle>
            <CardDescription>{t("createDescription")}</CardDescription>
          </div>
          <Users className="h-5 w-5 text-primary" aria-hidden />
        </CardHeader>
        <form action={createCustomerAction} className="grid gap-4">
          <input type="hidden" name="locale" value={locale} />
          <div className="form-grid">
            <Field label={t("name")}>
              <Input name="name" required />
            </Field>
            <Field label={t("phone")}>
              <Input name="phone" type="tel" required />
            </Field>
            <Field label={t("email")}>
              <Input name="email" type="email" />
            </Field>
            <Field label={t("type")}>
              <Select name="customerType" required>
                {customerTypes.map((type) => (
                  <option key={type} value={type}>
                    {t(`types.${type}`)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t("preferredLanguage")}>
              <Select name="preferredLanguage" defaultValue={locale}>
                <option value="en">{common("english")}</option>
                <option value="es">{common("spanish")}</option>
              </Select>
            </Field>
            <Field label={t("billingAddress")}>
              <Input name="billingAddress" />
            </Field>
          </div>
          <Field label={t("notes")}>
            <Textarea name="notes" />
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
          {customers.length ? (
            customers.map((customer) => {
              const balance = customer.invoices.reduce(
                (sum, invoice) => sum + invoice.balanceDueCents,
                0
              );
              return (
                <div key={customer.id} className="grid gap-2 rounded-md border border-border p-3 md:grid-cols-[1fr_auto]">
                  <div>
                    <p className="font-bold">{customer.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {customer.phone} {customer.email ? ` · ${customer.email}` : ""}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge tone="slate">{t(`types.${customer.customerType}`)}</Badge>
                      <Badge tone="blue">
                        {t("jobCount", { count: customer.jobs.length })}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-left md:text-right">
                    <p className="text-sm text-muted-foreground">{t("openBalance")}</p>
                    <p className="font-black">{formatMoney(balance, locale)}</p>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-sm text-muted-foreground">{common("emptyState")}</p>
          )}
        </div>
      </Card>
    </>
  );
}
