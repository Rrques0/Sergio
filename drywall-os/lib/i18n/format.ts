export function formatMoney(cents: number, locale = "en", currency = "USD") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency
  }).format(cents / 100);
}

export function formatDate(date: Date | string | null | undefined, locale = "en") {
  if (!date) return "";
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(date));
}

export function formatNumber(value: number, locale = "en") {
  return new Intl.NumberFormat(locale).format(value);
}
