import { createHmac, timingSafeEqual } from "node:crypto";
import { getRequiredSecret } from "./env";

export const MFA_COOKIE_NAME = "gksbs_admin_mfa";
const MFA_TTL_SECONDS = 8 * 60 * 60;

type MfaPayload = { uid: string; iat: number; exp: number };

function encode(value: string) {
  return Buffer.from(value).toString("base64url");
}

function decode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(payload: string) {
  return createHmac("sha256", getRequiredSecret("ADMIN_MFA_SECRET")).update(payload).digest("base64url");
}

export function createMfaCookieValue(uid: string, now = Math.floor(Date.now() / 1000)) {
  const payload: MfaPayload = { uid, iat: now, exp: now + MFA_TTL_SECONDS };
  const encodedPayload = encode(JSON.stringify(payload));
  return `${encodedPayload}.${sign(encodedPayload)}`;
}

export function verifyMfaCookieValue(value: string | undefined, expectedUid: string, now = Math.floor(Date.now() / 1000)) {
  if (!value) return false;
  const [encodedPayload, signature] = value.split(".");
  if (!encodedPayload || !signature) return false;

  const expectedSignature = sign(encodedPayload);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (signatureBuffer.length !== expectedBuffer.length || !timingSafeEqual(signatureBuffer, expectedBuffer)) return false;

  try {
    const payload = JSON.parse(decode(encodedPayload)) as MfaPayload;
    return payload.uid === expectedUid && Number.isInteger(payload.iat) && Number.isInteger(payload.exp) && payload.exp > now;
  } catch {
    return false;
  }
}
