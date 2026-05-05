import { FileDown, QrCode } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Badge } from "@/components/ui/badge";
import { Button, LinkButton } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createInvoiceQrAction } from "@/lib/services/qr-actions";
import { listInvoices } from "@/lib/services/invoice-actions";
import { formatMoney } from "@/lib/i18n/format";

export default async function InvoicesPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("invoice");
  const qrT = await getTranslations("qr");
  const common = await getTranslations("common");
  const invoices = await listInvoices();

  return (
    <>
      <section>
        <p className="text-sm font-bold text-primary">{t("eyebrow")}</p>
        <h1 className="text-2xl font-black">{t("title")}</h1>
      </section>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>{t("listTitle")}</CardTitle>
            <CardDescription>{t("listDescription")}</CardDescription>
          </div>
        </CardHeader>
        <div className="grid gap-3">
          {invoices.length ? (
            invoices.map((invoice) => {
              const qrAsset = invoice.codeAssets.find((asset) => asset.type === "INVOICE_QR");
              return (
                <div key={invoice.id} className="grid gap-3 rounded-md border border-border p-3 lg:grid-cols-[1fr_auto]">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold">{invoice.invoiceNumber}</p>
                      <Badge tone={invoice.status === "PAID" ? "green" : "orange"}>
                        {t(`statuses.${invoice.status}`)}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {invoice.customer.name} · {invoice.job.title}
                    </p>
                    <p className="mt-2 font-black">{formatMoney(invoice.balanceDueCents, locale)}</p>
                  </div>
                  <div className="grid gap-2 lg:justify-items-end">
                    <div className="flex flex-wrap gap-2">
                      <LinkButton href={`/api/invoices/${invoice.id}/pdf`} variant="outline">
                        <FileDown className="h-4 w-4" aria-hidden />
                        {t("pdfAction")}
                      </LinkButton>
                      <form action={createInvoiceQrAction}>
                        <input type="hidden" name="locale" value={locale} />
                        <input type="hidden" name="invoiceId" value={invoice.id} />
                        <Button type="submit" variant="secondary">
                          <QrCode className="h-4 w-4" aria-hidden />
                          {qrT("createInvoiceQr")}
                        </Button>
                      </form>
                    </div>
                    {qrAsset ? (
                      <div className="grid justify-items-end gap-1">
                        <img
                          src={`/api/qr/${qrAsset.id}`}
                          alt={qrT("invoiceQrAlt")}
                          className="h-28 w-28 rounded-md border border-border bg-white p-2"
                        />
                        <LinkButton href={`/api/qr/${qrAsset.id}?format=png`} variant="ghost" size="sm">
                          {qrT("downloadPng")}
                        </LinkButton>
                      </div>
                    ) : null}
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
