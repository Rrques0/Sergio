import { HardHat, Plus, UserRoundPlus } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { crewRoles, payTypes } from "@/lib/domain/options";
import { assignCrewMemberAction, createCrewMemberAction, listCrewMembers } from "@/lib/services/crew-actions";
import { listJobs } from "@/lib/services/job-actions";

export default async function CrewPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("crew");
  const common = await getTranslations("common");
  const [members, jobs] = await Promise.all([listCrewMembers(), listJobs()]);

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
          <HardHat className="h-5 w-5 text-primary" aria-hidden />
        </CardHeader>
        <form action={createCrewMemberAction} className="grid gap-4">
          <input type="hidden" name="locale" value={locale} />
          <div className="form-grid">
            <Field label={t("name")}>
              <Input name="name" required />
            </Field>
            <Field label={t("role")}>
              <Select name="role" required>
                {crewRoles.map((role) => (
                  <option key={role} value={role}>
                    {t(`roles.${role}`)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t("phone")}>
              <Input name="phone" type="tel" />
            </Field>
            <Field label={t("payType")}>
              <Select name="payType" required>
                {payTypes.map((type) => (
                  <option key={type} value={type}>
                    {t(`payTypes.${type}`)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t("payRate")}>
              <Input name="payRateCents" inputMode="decimal" />
            </Field>
            <Field label={t("availability")}>
              <Input name="availability" />
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
            <CardTitle>{t("assignTitle")}</CardTitle>
            <CardDescription>{t("assignDescription")}</CardDescription>
          </div>
        </CardHeader>
        <form action={assignCrewMemberAction} className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
          <input type="hidden" name="locale" value={locale} />
          <Field label={t("member")}>
            <Select name="crewMemberId" required>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t("job")}>
            <Select name="jobId" required>
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title}
                </option>
              ))}
            </Select>
          </Field>
          <Button type="submit">
            <UserRoundPlus className="h-4 w-4" aria-hidden />
            {t("assignAction")}
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
          {members.length ? (
            members.map((member) => (
              <div key={member.id} className="grid gap-2 rounded-md border border-border p-3 md:grid-cols-[1fr_auto]">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold">{member.name}</p>
                    <Badge tone="blue">{t(`roles.${member.role}`)}</Badge>
                    <Badge tone="slate">{t(`payTypes.${member.payType}`)}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{member.phone}</p>
                </div>
                <p className="text-sm font-bold">
                  {t("assignmentCount", { count: member.assignments.length })}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">{common("emptyState")}</p>
          )}
        </div>
      </Card>
    </>
  );
}
