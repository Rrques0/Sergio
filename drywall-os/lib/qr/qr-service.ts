import { createHash } from "node:crypto";

import QRCode from "qrcode";

import { prisma } from "@/lib/db/prisma";

function payloadHash(payload: string) {
  return createHash("sha256").update(payload).digest("hex");
}

export function sanitizeSvg(svg: string) {
  return svg
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/\son[a-z]+="[^"]*"/gi, "")
    .replace(/\son[a-z]+='[^']*'/gi, "");
}

export async function createQrAsset(input: {
  tenantId: string;
  customerId?: string;
  jobId?: string;
  estimateId?: string;
  invoiceId?: string;
  targetUrl: string;
  type:
    | "INVOICE_QR"
    | "PAYMENT_LINK_QR"
    | "JOB_FOLDER_QR"
    | "ESTIMATE_APPROVAL_QR"
    | "CUSTOMER_PORTAL_QR"
    | "REVIEW_REQUEST_QR"
    | "WARRANTY_QR";
}) {
  const svg = sanitizeSvg(
    await QRCode.toString(input.targetUrl, {
      type: "svg",
      errorCorrectionLevel: "M",
      margin: 2,
      width: 512
    })
  );

  return prisma.codeAsset.create({
    data: {
      tenantId: input.tenantId,
      customerId: input.customerId,
      jobId: input.jobId,
      estimateId: input.estimateId,
      invoiceId: input.invoiceId,
      type: input.type,
      format: "QR",
      targetUrl: input.targetUrl,
      payloadHash: payloadHash(input.targetUrl),
      svg,
      isFallback: true,
      scannable: true
    }
  });
}

export async function renderQrPng(targetUrl: string) {
  return QRCode.toBuffer(targetUrl, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 512,
    type: "png"
  });
}
