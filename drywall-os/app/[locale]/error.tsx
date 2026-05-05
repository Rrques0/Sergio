"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("errors");

  return (
    <main className="grid min-h-screen place-items-center px-4">
      <section className="grid max-w-lg gap-4 rounded-lg border border-border bg-card p-5">
        <p className="text-sm font-bold text-primary">{t("supportReady")}</p>
        <h1 className="text-2xl font-black">{t("genericTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t("genericBody")}</p>
        {error.digest ? (
          <p className="rounded-md bg-muted p-3 text-sm font-bold">
            {t("requestId", { id: error.digest })}
          </p>
        ) : null}
        <Button type="button" onClick={reset}>
          {t("tryAgain")}
        </Button>
      </section>
    </main>
  );
}
