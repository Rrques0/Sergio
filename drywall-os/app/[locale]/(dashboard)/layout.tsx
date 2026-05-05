import { redirect } from "next/navigation";

import { getActorContext } from "@/lib/auth/session";
import { AppShell } from "@/components/dashboard/app-shell";

export default async function DashboardLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const actor = await getActorContext();
  if (!actor) redirect(`/${locale}/login`);

  return <AppShell locale={locale}>{children}</AppShell>;
}
