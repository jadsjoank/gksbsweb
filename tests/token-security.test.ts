import { describe, expect, it } from "vitest";
import { createMfaCookieValue, verifyMfaCookieValue } from "lib/mfa";
import { createAttendanceQrToken, verifyAttendanceQrToken } from "lib/attendanceToken";

const now = 1_700_000_000;

describe("signed MFA cookies", () => {
  it("accepts the correct user and rejects expiry, uid, and signature changes", () => {
    const cookie = createMfaCookieValue("admin-1", now);
    expect(verifyMfaCookieValue(cookie, "admin-1", now + 1)).toBe(true);
    expect(verifyMfaCookieValue(cookie, "admin-2", now + 1)).toBe(false);
    expect(verifyMfaCookieValue(cookie.slice(0, -1) + "x", "admin-1", now + 1)).toBe(false);
    expect(verifyMfaCookieValue(cookie, "admin-1", now + 8 * 60 * 60)).toBe(false);
  });
});

describe("short-lived attendance QR tokens", () => {
  it("rejects expiry, event changes, user changes, and signature changes", () => {
    const token = createAttendanceQrToken("event-1", "profile-1", now);
    expect(verifyAttendanceQrToken(token, now + 1)).toMatchObject({ event_id: "event-1", profile_id: "profile-1" });
    expect(verifyAttendanceQrToken(token, now + 91)).toBeNull();
    const payload = verifyAttendanceQrToken(token, now + 1);
    expect(payload?.event_id).not.toBe("event-2");
    expect(payload?.profile_id).not.toBe("profile-2");
    expect(verifyAttendanceQrToken(`${token.slice(0, -1)}x`, now + 1)).toBeNull();
  });
});
