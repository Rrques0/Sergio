import { Download, Plus, Receipt } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Button, LinkButton } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { createSignedFileUrl } from "@/lib/files/storage";
import { formatMoney } from "@/lib/i18n/format";
import { listJobs } from "@/lib/services/job-actions";
import { createExpenseAction, listExpenseCategories, listExpenses } from "@/lib/services/expense-actions";

export default async function ExpensesPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("expense");
  const common = await getTranslations("common");
  const [expenses, categories, jobs] = await Promise.all([
    listExpenses(),
    listExpenseCategories(),
    listJobs()
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
            <CardTitle>{t("createTitle")}</CardTitle>
            <CardDescription>{t("createDescription")}</CardDescription>
          </div>
          <Receipt className="h-5 w-5 text-primary" aria-hidden />
        </CardHeader>
        <form action={createExpenseAction} className="grid gap-4">
          <input type="hidden" name="locale" value={locale} />
          <div className="form-grid">
            <Field label={t("category")}>
              <Select name="categoryId" required>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t("job")}>
              <Select name="jobId">
                <option value="">{common("none")}</option>
                {jobs.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.title}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t("vendor")}>
              <Input name="vendor" required />
            </Field>
            <Field label={t("amount")}>
              <Input name="amountCents" inputMode="decimal" required />
            </Field>
            <Field label={t("spentAt")}>
              <Input name="spentAt" type="date" required />
            </Field>
            <Field label={t("paymentMethod")}>
              <Input name="paymentMethod" />
            </Field>
            <Field label={t("receipt")}>
              <Input name="receipt" type="file" accept="image/png,image/jpeg,image/webp" />
            </Field>
          </div>
          <label className="flex min-h-11 items-center gap-2 text-sm font-semibold">
            <input name="taxDeductible" type="checkbox" defaultChecked className="h-5 w-5" />
            {t("taxDeductible")}
          </label>
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
          <LinkButton href="/api/expenses/export" variant="outline">
            <Download className="h-4 w-4" aria-hidden />
            {t("exportCsv")}
          </LinkButton>
        </CardHeader>
        <div className="grid gap-3">
          {expenses.length ? (
            expenses.map((expense) => (
              <div key={expense.id} className="grid gap-2 rounded-md border border-border p-3 md:grid-cols-[1fr_auto]">
                <div>
                  <p className="font-bold">{expense.vendor}</p>
                  <p className="text-sm text-muted-foreground">
                    {expense.category.name} {expense.job ? ` · ${expense.job.title}` : ""}
                  </p>
                  {expense.receiptFiles.length ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {expense.receiptFiles.map((receipt) => (
                        <a
                          key={receipt.id}
                          href={createSignedFileUrl(receipt.id)}
                          className="text-sm font-bold text-primary"
                        >
                          {t("viewReceipt")}
                        </a>
                      ))}
                    </div>
                  ) : null}
                </div>
                <p className="font-black">{formatMoney(expense.amountCents, locale)}</p>
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
