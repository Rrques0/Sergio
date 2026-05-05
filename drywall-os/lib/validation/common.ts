import { z } from "zod";

export const idSchema = z.string().min(8);
export const emailSchema = z.string().email().toLowerCase();
export const phoneSchema = z.string().min(7).max(32);
export const localeSchema = z.enum(["en", "es", "vi", "sq", "hmn"]);

export function formString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export function optionalFormString(formData: FormData, key: string) {
  const value = formString(formData, key);
  return value.length > 0 ? value : undefined;
}

export function formInt(formData: FormData, key: string) {
  const value = formString(formData, key);
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function formMoneyToCents(formData: FormData, key: string) {
  const raw = formString(formData, key).replace(/[$,\s]/g, "");
  if (!raw) return 0;
  const parsed = Number.parseFloat(raw);
  if (!Number.isFinite(parsed)) return 0;
  return Math.round(parsed * 100);
}

export function sanitizeText(value: string, max = 2000) {
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim().slice(0, max);
}
