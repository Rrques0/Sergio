import {
  BarChart3,
  Boxes,
  ClipboardList,
  FileText,
  Hammer,
  Home,
  Receipt,
  Settings,
  Users,
  WalletCards
} from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { logoutAction } from "@/lib/services/onboarding-actions";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/ui/language-switcher";

const navItems = [
  ["dashboard", Home, ""],
  ["customers", Users, "customers"],
  ["jobs", ClipboardList, "jobs"],
  ["estimates", FileText, "estimates"],
  ["invoices", WalletCards, "invoices"],
  ["expenses", Receipt, "expenses"],
  ["materials", Boxes, "materials"],
  ["crew", Hammer, "crew"],
  ["reports", BarChart3, "reports"],
  ["settings", Settings, "settings"]
] as const;

export async function AppShell({
  locale,
  children
}: {
  locale: string;
  children: React.ReactNode;
}) {
  const t = await getTranslations("nav");
  const common = await getTranslations("common");

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <Link href={`/${locale}`} className="grid gap-0.5">
            <span className="text-sm font-black uppercase tracking-normal text-primary">
              {common("appName")}
            </span>
            <span className="hidden text-xs text-muted-foreground sm:block">
              {common("tagline")}
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSwitcher currentLocale={locale} label={common("language")} />
            <form action={logoutAction}>
              <Button type="submit" variant="outline" size="sm">
                {common("signOut")}
              </Button>
            </form>
          </div>
        </div>
        <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 pb-3">
          {navItems.map(([key, Icon, href]) => (
            <Link
              key={key}
              href={`/${locale}${href ? `/${href}` : ""}`}
              className="flex min-h-11 min-w-fit items-center gap-2 rounded-md px-3 text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <Icon className="h-4 w-4" aria-hidden />
              <span>{t(key)}</span>
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto grid max-w-7xl gap-5 px-4 py-5">{children}</main>
    </div>
  );
}
