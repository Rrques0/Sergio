"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const switchLocales = ["en", "es"] as const;

export function LanguageSwitcher({
  currentLocale,
  label
}: {
  currentLocale: string;
  label: string;
}) {
  const pathname = usePathname();
  const pathWithoutLocale = pathname.replace(/^\/(en|es|vi|sq|hmn)/, "") || "/";

  return (
    <div aria-label={label} className="inline-flex rounded-md border border-border bg-background p-1">
      {switchLocales.map((locale) => (
        <Link
          key={locale}
          href={`/${locale}${pathWithoutLocale === "/" ? "" : pathWithoutLocale}`}
          className={cn(
            "flex h-9 min-w-11 items-center justify-center rounded-sm px-2 text-xs font-bold uppercase",
            currentLocale === locale ? "bg-primary text-primary-foreground" : "text-muted-foreground"
          )}
        >
          {locale}
        </Link>
      ))}
    </div>
  );
}
