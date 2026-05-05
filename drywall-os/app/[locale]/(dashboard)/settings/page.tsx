import { Save } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/form";
import { getBusinessProfile, updateBusinessProfileAction } from "@/lib/services/business-actions";

export default async function SettingsPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("settings");
  const profile = await getBusinessProfile();

  return (
    <>
      <section>
        <p className="text-sm font-bold text-primary">{t("eyebrow")}</p>
        <h1 className="text-2xl font-black">{t("title")}</h1>
      </section>
      <Card>
        <CardHeader>
          <div>
            <CardTitle>{t("businessTitle")}</CardTitle>
            <CardDescription>{t("businessDescription")}</CardDescription>
          </div>
        </CardHeader>
        <form action={updateBusinessProfileAction} className="grid gap-4">
          <input type="hidden" name="locale" value={locale} />
          <div className="form-grid">
            <Field label={t("companyName")}>
              <Input name="companyName" required defaultValue={profile?.companyName} />
            </Field>
            <Field label={t("phone")}>
              <Input name="phone" required defaultValue={profile?.phone} />
            </Field>
            <Field label={t("email")}>
              <Input name="email" type="email" required defaultValue={profile?.email} />
            </Field>
            <Field label={t("website")}>
              <Input name="website" type="url" defaultValue={profile?.website ?? ""} />
            </Field>
            <Field label={t("licenseNumber")}>
              <Input name="licenseNumber" defaultValue={profile?.licenseNumber ?? ""} />
            </Field>
            <Field label={t("addressLine1")}>
              <Input name="addressLine1" required defaultValue={profile?.addressLine1} />
            </Field>
            <Field label={t("addressLine2")}>
              <Input name="addressLine2" defaultValue={profile?.addressLine2 ?? ""} />
            </Field>
            <Field label={t("city")}>
              <Input name="city" required defaultValue={profile?.city} />
            </Field>
            <Field label={t("state")}>
              <Input name="state" required defaultValue={profile?.state} />
            </Field>
            <Field label={t("postalCode")}>
              <Input name="postalCode" required defaultValue={profile?.postalCode} />
            </Field>
          </div>
          <Field label={t("defaultTerms")}>
            <Textarea name="defaultTerms" required defaultValue={profile?.defaultTerms} />
          </Field>
          <Field label={t("estimateFooter")}>
            <Textarea name="estimateFooter" required defaultValue={profile?.estimateFooter} />
          </Field>
          <Field label={t("invoiceFooter")}>
            <Textarea name="invoiceFooter" required defaultValue={profile?.invoiceFooter} />
          </Field>
          <Button type="submit" className="w-full sm:w-fit">
            <Save className="h-4 w-4" aria-hidden />
            {t("saveAction")}
          </Button>
        </form>
      </Card>
    </>
  );
}
