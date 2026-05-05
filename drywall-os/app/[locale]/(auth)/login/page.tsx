import { LogIn } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/form";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { loginAction } from "@/lib/services/onboarding-actions";

export default async function LoginPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("auth");
  const common = await getTranslations("common");

  return (
    <main className="grid min-h-screen place-items-center px-4 py-8">
      <div className="grid w-full max-w-md gap-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-black uppercase text-primary">{common("appName")}</p>
            <h1 className="text-2xl font-black">{t("loginTitle")}</h1>
          </div>
          <LanguageSwitcher currentLocale={locale} label={common("language")} />
        </div>
        <Card>
          <CardHeader>
            <div>
              <CardTitle>{t("loginCardTitle")}</CardTitle>
              <CardDescription>{t("loginCardDescription")}</CardDescription>
            </div>
          </CardHeader>
          <form action={loginAction} className="grid gap-4">
            <input type="hidden" name="locale" value={locale} />
            <Field label={t("email")}>
              <Input name="email" type="email" autoComplete="email" required />
            </Field>
            <Field label={t("password")}>
              <Input name="password" type="password" autoComplete="current-password" required />
            </Field>
            <Button type="submit">
              <LogIn className="h-4 w-4" aria-hidden />
              {t("signIn")}
            </Button>
          </form>
        </Card>
        <p className="text-center text-sm text-muted-foreground">
          {t("noAccount")}{" "}
          <Link className="font-bold text-primary" href={`/${locale}/register`}>
            {t("createAccount")}
          </Link>
        </p>
      </div>
    </main>
  );
}
