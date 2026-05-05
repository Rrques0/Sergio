import {
  Document,
  Page,
  StyleSheet,
  Text,
  View
} from "@react-pdf/renderer";

import { formatMoney } from "@/lib/i18n/format";

type LineItem = {
  name: string;
  description: string | null;
  quantity: unknown;
  unit: string;
  unitPriceCents: number;
};

type InvoicePdfProps = {
  invoice: {
    invoiceNumber: string;
    title: string;
    terms: string;
    dueDate: Date | null;
    subtotalCents: number;
    taxCents: number;
    totalCents: number;
    paidCents: number;
    balanceDueCents: number;
    paymentLink: string | null;
    customer: { name: string; email: string | null; phone: string };
    job: { jobAddressLine1: string; city: string; state: string; postalCode: string };
    lineItems: LineItem[];
  };
  business: {
    companyName: string;
    phone: string;
    email: string;
    addressLine1: string;
    city: string;
    state: string;
    postalCode: string;
    invoiceFooter: string;
    currency: string;
  } | null;
  locale: string;
  label: (key: string) => string;
};

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontSize: 10,
    color: "#0f172a",
    fontFamily: "Helvetica"
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#d6d3c8",
    paddingBottom: 18,
    marginBottom: 20
  },
  company: { fontSize: 18, fontWeight: 700, marginBottom: 6 },
  title: { fontSize: 22, fontWeight: 700, marginBottom: 8, color: "#075985" },
  section: { marginBottom: 16 },
  label: { color: "#475569", fontSize: 9, marginBottom: 3 },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e7e5dc",
    paddingVertical: 7
  },
  th: { fontWeight: 700, color: "#334155" },
  desc: { flex: 4 },
  qty: { flex: 1, textAlign: "right" },
  money: { flex: 1.4, textAlign: "right" },
  totals: { width: 230, marginLeft: "auto", marginTop: 12 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 5 },
  grandTotal: { fontSize: 13, fontWeight: 700, color: "#166534" },
  footer: {
    marginTop: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#d6d3c8",
    color: "#475569"
  }
});

export function InvoicePdfDocument({ invoice, business, locale, label }: InvoicePdfProps) {
  const currency = business?.currency ?? "USD";

  return (
    <Document title={`${label("invoice")} ${invoice.invoiceNumber}`}>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.company}>{business?.companyName ?? "Drywall OS"}</Text>
            <Text>{business?.addressLine1}</Text>
            <Text>
              {business?.city}, {business?.state} {business?.postalCode}
            </Text>
            <Text>{business?.phone}</Text>
            <Text>{business?.email}</Text>
          </View>
          <View>
            <Text style={styles.title}>{label("invoice")}</Text>
            <Text>{invoice.invoiceNumber}</Text>
            {invoice.dueDate ? (
              <Text>
                {label("due")}: {invoice.dueDate.toISOString().slice(0, 10)}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>{label("billTo")}</Text>
          <Text>{invoice.customer.name}</Text>
          <Text>{invoice.customer.phone}</Text>
          <Text>{invoice.customer.email}</Text>
          <Text>
            {invoice.job.jobAddressLine1}, {invoice.job.city}, {invoice.job.state}{" "}
            {invoice.job.postalCode}
          </Text>
        </View>

        <View style={[styles.row, styles.th]}>
          <Text style={styles.desc}>{label("description")}</Text>
          <Text style={styles.qty}>{label("quantity")}</Text>
          <Text style={styles.money}>{label("price")}</Text>
        </View>
        {invoice.lineItems.map((item) => (
          <View key={item.name} style={styles.row}>
            <View style={styles.desc}>
              <Text>{item.name}</Text>
              {item.description ? <Text style={styles.label}>{item.description}</Text> : null}
            </View>
            <Text style={styles.qty}>
              {Number(item.quantity).toFixed(2)} {item.unit}
            </Text>
            <Text style={styles.money}>
              {formatMoney(item.unitPriceCents, locale, currency)}
            </Text>
          </View>
        ))}

        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text>{label("subtotal")}</Text>
            <Text>{formatMoney(invoice.subtotalCents, locale, currency)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text>{label("tax")}</Text>
            <Text>{formatMoney(invoice.taxCents, locale, currency)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text>{label("paid")}</Text>
            <Text>{formatMoney(invoice.paidCents, locale, currency)}</Text>
          </View>
          <View style={[styles.totalRow, styles.grandTotal]}>
            <Text>{label("balanceDue")}</Text>
            <Text>{formatMoney(invoice.balanceDueCents, locale, currency)}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.label}>{label("terms")}</Text>
          <Text>{invoice.terms}</Text>
          {invoice.paymentLink ? <Text>{invoice.paymentLink}</Text> : null}
          <Text>{business?.invoiceFooter}</Text>
        </View>
      </Page>
    </Document>
  );
}
