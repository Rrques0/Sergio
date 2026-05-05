import type { Locale } from "@/lib/i18n/routing";

type Messages = {
  pdf?: Record<string, string>;
};

async function loadPdfMessages(locale: string): Promise<Record<string, string>> {
  const messages = (await import(`../../messages/${locale}.json`)).default as Messages;
  return messages.pdf ?? {};
}

export async function getPdfLabels(locale: Locale | string) {
  const english = await loadPdfMessages("en");
  const current = locale === "en" ? english : await loadPdfMessages(locale);

  return (key: string) => {
    const currentValue = current[key] ?? english[key] ?? key;
    if (locale === "en") return currentValue;
    const englishValue = english[key] ?? key;
    return `${currentValue} / ${englishValue}`;
  };
}
