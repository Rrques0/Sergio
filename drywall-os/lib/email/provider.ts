import { Resend } from "resend";

import { env } from "@/lib/env";

export type EmailPayload = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export interface EmailProvider {
  send(payload: EmailPayload): Promise<{ id: string }>;
}

class DisabledEmailProvider implements EmailProvider {
  async send(payload: EmailPayload) {
    return { id: `disabled:${Buffer.from(payload.to).toString("base64url")}` };
  }
}

class ResendEmailProvider implements EmailProvider {
  private resend = new Resend(env.RESEND_API_KEY);

  async send(payload: EmailPayload) {
    const result = await this.resend.emails.send({
      from: env.SMTP_FROM,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text
    });

    if (result.error) throw result.error;
    return { id: result.data?.id ?? "resend:unknown" };
  }
}

export function getEmailProvider(): EmailProvider {
  if (!env.ENABLE_EMAIL || !env.RESEND_API_KEY) {
    return new DisabledEmailProvider();
  }
  return new ResendEmailProvider();
}
