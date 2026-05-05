import { getRequestConfig } from "next-intl/server";
import { notFound } from "next/navigation";

import { isLocale } from "@/lib/i18n/routing";

function deepMerge(base: Record<string, unknown>, override: Record<string, unknown>) {
  const output: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(override)) {
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      output[key] &&
      typeof output[key] === "object" &&
      !Array.isArray(output[key])
    ) {
      output[key] = deepMerge(
        output[key] as Record<string, unknown>,
        value as Record<string, unknown>
      );
    } else {
      output[key] = value;
    }
  }
  return output;
}

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = await requestLocale;

  if (!locale || !isLocale(locale)) {
    notFound();
  }

  const english = (await import("../../messages/en.json")).default;
  const current = (await import(`../../messages/${locale}.json`)).default;

  return {
    locale,
    messages: locale === "en" ? english : deepMerge(english, current)
  };
});
