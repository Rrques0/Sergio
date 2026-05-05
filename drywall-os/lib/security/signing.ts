import { createHmac, timingSafeEqual } from "node:crypto";

function secret() {
  const value = process.env.SIGNED_URL_SECRET;
  if (!value || value.length < 32) {
    throw new Error("errors.missingSignedUrlSecret");
  }
  return value;
}

export function signScopedUrl(scope: string, id: string, expiresInSeconds = 60 * 60 * 24 * 14) {
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const sig = createHmac("sha256", secret())
    .update(`${scope}:${id}:${exp}`)
    .digest("hex");
  return { exp, sig };
}

export function verifyScopedSignature(
  scope: string,
  id: string,
  expValue: string | null,
  sigValue: string | null
) {
  if (!expValue || !sigValue) return false;
  const exp = Number.parseInt(expValue, 10);
  if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) return false;

  const expected = createHmac("sha256", secret())
    .update(`${scope}:${id}:${exp}`)
    .digest("hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  const actualBuffer = Buffer.from(sigValue, "hex");

  return (
    expectedBuffer.length === actualBuffer.length &&
    timingSafeEqual(expectedBuffer, actualBuffer)
  );
}
