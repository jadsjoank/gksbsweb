import { createHmac, timingSafeEqual } from "node:crypto";
import { getRequiredSecret } from "./env";

const QR_TTL_SECONDS = 90;

type AttendanceQrPayload = { event_id: string; profile_id: string; exp: number };

function encode(value: string) {
  return Buffer.from(value).toString("base64url");
}

function decode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signature(encodedPayload: string) {
  return createHmac("sha256", getRequiredSecret("ATTENDANCE_QR_SECRET")).update(encodedPayload).digest("base64url");
}

export function createAttendanceQrToken(eventId: string, profileId: string, now = Math.floor(Date.now() / 1000)) {
  const payload: AttendanceQrPayload = { event_id: eventId, profile_id: profileId, exp: now + QR_TTL_SECONDS };
  const encodedPayload = encode(JSON.stringify(payload));
  return `${encodedPayload}.${signature(encodedPayload)}`;
}

export function verifyAttendanceQrToken(token: string | undefined, now = Math.floor(Date.now() / 1000)) {
  if (!token) return null;
  const [encodedPayload, providedSignature] = token.split(".");
  if (!encodedPayload || !providedSignature) return null;

  const expectedSignature = signature(encodedPayload);
  const providedBuffer = Buffer.from(providedSignature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (providedBuffer.length !== expectedBuffer.length || !timingSafeEqual(providedBuffer, expectedBuffer)) return null;

  try {
    const payload = JSON.parse(decode(encodedPayload)) as AttendanceQrPayload;
    if (!payload.event_id || !payload.profile_id || !Number.isInteger(payload.exp) || payload.exp <= now) return null;
    return payload;
  } catch {
    return null;
  }
}
