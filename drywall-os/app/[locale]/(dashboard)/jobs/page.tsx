import { Camera, ClipboardList, Plus, RefreshCcw } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import {
  boardTypes,
  drywallThicknesses,
  finishLevels,
  jobStatuses,
  jobTypes,
  photoCategories,
  textureTypes
} from "@/lib/domain/options";
import { listCustomers } from "@/lib/services/customer-actions";
import { createJobAction, listJobs, updateJobStatusAction } from "@/lib/services/job-actions";
import { uploadJobPhotoAction } from "@/lib/services/photo-actions";
import { createChangeOrderAction, listChangeOrders, approveChangeOrderAction } from "@/lib/services/change-order-actions";
import { formatMoney } from "@/lib/i18n/format";

export default async function JobsPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("job");
  const customerT = await getTranslations("customer");
  const photosT = await getTranslations("photos");
  const changeT = await getTranslations("changeOrder");
  const common = await getTranslations("common");
  const [customers, jobs, changeOrders] = await Promise.all([
    listCustomers(),
    listJobs(),
    listChangeOrders()
  ]);

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
          <ClipboardList className="h-5 w-5 text-primary" aria-hidden />
        </CardHeader>
        <form action={createJobAction} className="grid gap-4">
          <input type="hidden" name="locale" value={locale} />
          <div className="form-grid">
            <Field label={customerT("title")}>
              <Select name="customerId" required>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t("jobTitle")}>
              <Input name="title" required />
            </Field>
            <Field label={t("jobType")}>
              <Select name="jobType" required>
                {jobTypes.map((type) => (
                  <option key={type} value={type}>
                    {t(`types.${type}`)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t("status")}>
              <Select name="status" defaultValue="LEAD">
                {jobStatuses.map((status) => (
                  <option key={status} value={status}>
                    {t(`statuses.${status}`)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t("addressLine1")}>
              <Input name="jobAddressLine1" required />
            </Field>
            <Field label={t("addressLine2")}>
              <Input name="jobAddressLine2" />
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
            <Field label={t("squareFootage")}>
              <Input name="squareFootageEstimate" type="number" min="1" />
            </Field>
            <Field label={t("numberOfRooms")}>
              <Input name="numberOfRooms" type="number" min="1" />
            </Field>
            <Field label={t("ceilingHeight")}>
              <Input name="ceilingHeightFeet" type="number" step="0.1" min="1" />
            </Field>
            <Field label={t("drywallThickness")}>
              <Select name="drywallThickness">
                <option value="">{common("select")}</option>
                {drywallThicknesses.map((value) => (
                  <option key={value} value={value}>
                    {t(`thickness.${value}`)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t("boardType")}>
              <Select name="boardType">
                <option value="">{common("select")}</option>
                {boardTypes.map((value) => (
                  <option key={value} value={value}>
                    {t(`boardTypes.${value}`)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t("finishLevel")}>
              <Select name="finishLevel">
                <option value="">{common("select")}</option>
                {finishLevels.map((value) => (
                  <option key={value} value={value}>
                    {t(`finishLevels.${value}`)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t("textureType")}>
              <Select name="textureType">
                <option value="">{common("select")}</option>
                {textureTypes.map((value) => (
                  <option key={value} value={value}>
                    {t(`textureTypes.${value}`)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t("startDate")}>
              <Input name="startDate" type="date" />
            </Field>
            <Field label={t("targetCompletionDate")}>
              <Input name="targetCompletionDate" type="date" />
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
            <CardTitle>{photosT("uploadTitle")}</CardTitle>
            <CardDescription>{photosT("uploadDescription")}</CardDescription>
          </div>
          <Camera className="h-5 w-5 text-primary" aria-hidden />
        </CardHeader>
        <form action={uploadJobPhotoAction} className="grid gap-4 md:grid-cols-[1fr_1fr_1fr_auto] md:items-end">
          <input type="hidden" name="locale" value={locale} />
          <Field label={t("title")}>
            <Select name="jobId" required>
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={photosT("category")}>
            <Select name="category" defaultValue="BEFORE">
              {photoCategories.map((category) => (
                <option key={category} value={category}>
                  {photosT(`categories.${category}`)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={photosT("file")}>
            <Input name="photo" type="file" accept="image/png,image/jpeg,image/webp" required />
          </Field>
          <Button type="submit">
            <Camera className="h-4 w-4" aria-hidden />
            {photosT("uploadAction")}
          </Button>
        </form>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>{changeT("createTitle")}</CardTitle>
            <CardDescription>{changeT("createDescription")}</CardDescription>
          </div>
        </CardHeader>
        <form action={createChangeOrderAction} className="grid gap-4">
          <input type="hidden" name="locale" value={locale} />
          <div className="form-grid">
            <Field label={t("title")}>
              <Select name="jobId" required>
                {jobs.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.title}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={changeT("addedLabor")}>
              <Input name="addedLaborCents" inputMode="decimal" />
            </Field>
            <Field label={changeT("addedMaterials")}>
              <Input name="addedMaterialsCents" inputMode="decimal" />
            </Field>
            <Field label={changeT("tax")}>
              <Input name="taxCents" inputMode="decimal" />
            </Field>
          </div>
          <Field label={changeT("description")}>
            <Textarea name="description" required />
          </Field>
          <Field label={changeT("reason")}>
            <Textarea name="reason" required />
          </Field>
          <Button type="submit" className="w-full sm:w-fit">
            <Plus className="h-4 w-4" aria-hidden />
            {changeT("createAction")}
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
          {jobs.length ? (
            jobs.map((job) => (
              <div key={job.id} className="grid gap-3 rounded-md border border-border p-3 lg:grid-cols-[1fr_auto]">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold">{job.title}</p>
                    <Badge tone="orange">{t(`statuses.${job.status}`)}</Badge>
                    <Badge tone="blue">{t(`types.${job.jobType}`)}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {job.customer.name} · {job.jobAddressLine1}, {job.city}
                  </p>
                  <p className="mt-2 text-sm">
                    {t("estimateCount", { count: job.estimates.length })} ·{" "}
                    {t("invoiceCount", { count: job.invoices.length })}
                  </p>
                </div>
                <form action={updateJobStatusAction} className="flex flex-wrap items-end gap-2">
                  <input type="hidden" name="locale" value={locale} />
                  <input type="hidden" name="jobId" value={job.id} />
                  <Field label={t("status")}>
                    <Select name="status" defaultValue={job.status}>
                      {jobStatuses.map((status) => (
                        <option key={status} value={status}>
                          {t(`statuses.${status}`)}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Button type="submit" variant="outline">
                    <RefreshCcw className="h-4 w-4" aria-hidden />
                    {common("update")}
                  </Button>
                </form>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">{common("emptyState")}</p>
          )}
        </div>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>{changeT("listTitle")}</CardTitle>
            <CardDescription>{changeT("listDescription")}</CardDescription>
          </div>
        </CardHeader>
        <div className="grid gap-3">
          {changeOrders.length ? (
            changeOrders.map((order) => (
              <div key={order.id} className="grid gap-2 rounded-md border border-border p-3 md:grid-cols-[1fr_auto]">
                <div>
                  <p className="font-bold">{order.changeOrderNumber}</p>
                  <p className="text-sm text-muted-foreground">{order.description}</p>
                  <Badge tone={order.status === "APPROVED" ? "green" : "orange"}>
                    {changeT(`statuses.${order.status}`)}
                  </Badge>
                </div>
                <div className="grid gap-2 md:justify-items-end">
                  <p className="font-black">{formatMoney(order.totalCents, locale)}</p>
                  {order.status === "DRAFT" || order.status === "SENT" ? (
                    <form action={approveChangeOrderAction}>
                      <input type="hidden" name="locale" value={locale} />
                      <input type="hidden" name="changeOrderId" value={order.id} />
                      <Button type="submit" size="sm" variant="outline">
                        {changeT("approveAction")}
                      </Button>
                    </form>
                  ) : null}
                </div>
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
