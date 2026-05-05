import { Building2, UserPlus } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/form";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { registerOwnerAction } from "@/lib/services/onboarding-actions";

export default async function RegisterPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("auth");
  const common = await getTranslations("common");

  return (
    <main className="mx-auto grid min-h-screen w-full max-w-4xl place-items-center px-4 py-8">
      <div className="grid w-full gap-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-black uppercase text-primary">{common("appName")}</p>
            <h1 className="text-2xl font-black">{t("registerTitle")}</h1>
          </div>
          <LanguageSwitcher currentLocale={locale} label={common("language")} />
        </div>
        <Card>
          <CardHeader>
            <div>
              <CardTitle>{t("registerCardTitle")}</CardTitle>
              <CardDescription>{t("registerCardDescription")}</CardDescription>
            </div>
            <Building2 className="h-8 w-8 text-primary" aria-hidden />
          </CardHeader>
          <form action={registerOwnerAction} className="grid gap-5">
            <input type="hidden" name="locale" value={locale} />
            <div className="form-grid">
              <Field label={t("ownerName")}>
                <Input name="ownerName" autoComplete="name" required />
              </Field>
              <Field label={t("email")}>
                <Input name="email" type="email" autoComplete="email" required />
              </Field>
              <Field label={t("password")}>
                <Input name="password" type="password" autoComplete="new-password" minLength={12} required />
              </Field>
              <Field label={t("companyName")}>
                <Input name="companyName" required defaultValue="[FRIEND'S DRYWALL LLC NAME]" />
              </Field>
              <Field label={t("phone")}>
                <Input name="phone" type="tel" required />
              </Field>
              <Field label={t("addressLine1")}>
                <Input name="addressLine1" required />
              </Field>
              <Field label={t("city")}>
                <Input name="city" required />
              </Field>
              <Field label={t("state")}>
                <Input name="state" required />
              </Field>
              <Field label={t("postalCode")}>
                <Input name="postalCode" required />
              </Field>
            </div>
            <Button type="submit">
              <UserPlus className="h-4 w-4" aria-hidden />
              {t("createOwnerAccount")}
            </Button>
          </form>
        </Card>
        <p className="text-center text-sm text-muted-foreground">
          {t("haveAccount")}{" "}
          <Link className="font-bold text-primary" href={`/${locale}/login`}>
            {t("signIn")}
          </Link>
        </p>
      </div>
    </main>
  );
}
