import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  AUTH_SECRET: z.string().min(32),
  AUTH_URL: z.string().url().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  PRIVATE_UPLOAD_ROOT: z.string().default("./.storage/uploads"),
  SIGNED_URL_SECRET: z.string().min(32),
  DEFAULT_LOCALE: z.string().default("en"),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.string().default("Drywall OS <no-reply@example.com>"),
  RESEND_API_KEY: z.string().optional(),
  ENABLE_EMAIL: z.coerce.boolean().default(false),
  ENABLE_OPERATOR_CONSOLE: z.coerce.boolean().default(true),
  ENABLE_VOICE_AI: z.coerce.boolean().default(false),
  ENABLE_STRIPE: z.coerce.boolean().default(false),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development")
});

export const env = envSchema.parse(process.env);
