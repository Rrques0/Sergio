import pino from "pino";

export const logger = pino({
  name: "drywall-os",
  level: process.env.LOG_LEVEL ?? "info",
  redact: [
    "password",
    "passwordHash",
    "totpSecretEncrypted",
    "authorization",
    "cookie",
    "*.token",
    "*.secret"
  ]
});
