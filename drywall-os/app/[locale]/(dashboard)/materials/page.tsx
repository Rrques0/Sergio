import { Boxes, Plus } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/form";
import { formatMoney } from "@/lib/i18n/format";
import { createMaterialAction, listMaterials } from "@/lib/services/material-actions";

export default async function MaterialsPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("materials");
  const common = await getTranslations("common");
  const materials = await listMaterials();

  return (
    <>
      <section>
        <p className="text-sm font-bold text-primary">{t("eyebrow")}</p>
        <h1 className="text-2xl font-black">{t("title")}</h1>
      </section>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>{t("createTitle")}</CardTitle>
            <CardDescription>{t("createDescription")}</CardDescription>
          </div>
          <Boxes className="h-5 w-5 text-primary" aria-hidden />
        </CardHeader>
        <form action={createMaterialAction} className="grid gap-4">
          <input type="hidden" name="locale" value={locale} />
          <div className="form-grid">
            <Field label={t("name")}>
              <Input name="name" required />
            </Field>
            <Field label={t("unit")}>
              <Input name="unit" required />
            </Field>
            <Field label={t("unitCost")}>
              <Input name="unitCostCents" inputMode="decimal" required />
            </Field>
            <Field label={t("quantityOnHand")}>
              <Input name="quantityOnHand" inputMode="decimal" defaultValue="0" />
            </Field>
            <Field label={t("reorderThreshold")}>
              <Input name="reorderThreshold" inputMode="decimal" defaultValue="0" />
            </Field>
          </div>
          <Field label={t("notes")}>
            <Textarea name="notes" />
          </Field>
          <Button type="submit" className="w-full sm:w-fit">
            <Plus className="h-4 w-4" aria-hidden />
            {t("createAction")}
          </Button>
        </form>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>{t("listTitle")}</CardTitle>
            <CardDescription>{t("listDescription")}</CardDescription>
          </div>
        </CardHeader>
        <div className="grid gap-3">
          {materials.length ? (
            materials.map((material) => {
              const low = Number(material.quantityOnHand) <= Number(material.reorderThreshold);
              return (
                <div key={material.id} className="grid gap-2 rounded-md border border-border p-3 md:grid-cols-[1fr_auto]">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold">{material.name}</p>
                      {low ? <Badge tone="red">{t("lowStock")}</Badge> : <Badge tone="green">{t("stocked")}</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {material.quantityOnHand.toString()} {material.unit}
                    </p>
                  </div>
                  <p className="font-black">{formatMoney(material.unitCostCents, locale)}</p>
                </div>
              );
            })
          ) : (
            <p className="text-sm text-muted-foreground">{common("emptyState")}</p>
          )}
        </div>
      </Card>
    </>
  );
}
