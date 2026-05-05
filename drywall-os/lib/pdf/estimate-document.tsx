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

type EstimatePdfProps = {
  estimate: {
    estimateNumber: string;
    title: string;
    scopeSummary: string;
    terms: string;
    subtotalCents: number;
    markupCents: number;
    taxCents: number;
    totalCents: number;
    depositRequiredCents: number;
    expiresAt: Date | null;
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
    estimateFooter: string;
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
  value: { fontSize: 10, marginBottom: 3 },
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
  totals: { width: 210, marginLeft: "auto", marginTop: 12 },
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

export function EstimatePdfDocument({ estimate, business, locale, label }: EstimatePdfProps) {
  const currency = business?.currency ?? "USD";

  return (
    <Document title={`${label("estimate")} ${estimate.estimateNumber}`}>
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
            <Text style={styles.title}>{label("estimate")}</Text>
            <Text style={styles.value}>{estimate.estimateNumber}</Text>
            {estimate.expiresAt ? (
              <Text>
                {label("expires")}: {estimate.expiresAt.toISOString().slice(0, 10)}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>{label("customer")}</Text>
          <Text style={styles.value}>{estimate.customer.name}</Text>
          <Text>{estimate.customer.phone}</Text>
          <Text>{estimate.customer.email}</Text>
          <Text>
            {estimate.job.jobAddressLine1}, {estimate.job.city}, {estimate.job.state}{" "}
            {estimate.job.postalCode}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>{label("scope")}</Text>
          <Text>{estimate.scopeSummary}</Text>
        </View>

        <View style={[styles.row, styles.th]}>
          <Text style={styles.desc}>{label("description")}</Text>
          <Text style={styles.qty}>{label("quantity")}</Text>
          <Text style={styles.money}>{label("price")}</Text>
        </View>
        {estimate.lineItems.map((item) => (
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
            <Text>{formatMoney(estimate.subtotalCents, locale, currency)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text>{label("markup")}</Text>
            <Text>{formatMoney(estimate.markupCents, locale, currency)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text>{label("tax")}</Text>
            <Text>{formatMoney(estimate.taxCents, locale, currency)}</Text>
          </View>
          <View style={[styles.totalRow, styles.grandTotal]}>
            <Text>{label("total")}</Text>
            <Text>{formatMoney(estimate.totalCents, locale, currency)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text>{label("deposit")}</Text>
            <Text>{formatMoney(estimate.depositRequiredCents, locale, currency)}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.label}>{label("terms")}</Text>
          <Text>{estimate.terms}</Text>
          <Text>{business?.estimateFooter}</Text>
        </View>
      </Page>
    </Document>
  );
}
