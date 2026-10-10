import { describe, expect, it } from "vitest";
import { matchesFileSignature } from "lib/fileValidation";
import {
  contactMessageSchema,
  guestAttendanceSchema,
  profileCheckSchema,
} from "lib/validation/public";

describe("upload signature validation", () => {
  it("accepts matching PDF and image signatures", () => {
    expect(matchesFileSignature(Buffer.from("%PDF-1.7"), "application/pdf")).toBe(true);
    expect(matchesFileSignature(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      "image/png",
    )).toBe(true);
    expect(matchesFileSignature(
      Buffer.from("RIFF0000WEBP"),
      "image/webp",
    )).toBe(true);
  });

  it("rejects a mismatched or unsupported file signature", () => {
    expect(matchesFileSignature(Buffer.from("<script>alert(1)</script>"), "image/png")).toBe(false);
    expect(matchesFileSignature(Buffer.from("GIF89a"), "application/pdf")).toBe(false);
    expect(matchesFileSignature(Buffer.from("plain text"), "text/plain")).toBe(false);
  });
});

describe("public endpoint validation schemas", () => {
  it("accepts valid guest attendance details", () => {
    expect(guestAttendanceSchema.safeParse({
      event_id: "event-1",
      guest_name: "Jemaat GKSBS",
      guest_email: "jemaat@example.com",
      guest_phone: "081234567890",
    }).success).toBe(true);
  });

  it("rejects oversized contact messages and invalid profile checks", () => {
    expect(contactMessageSchema.safeParse({
      name: "Jemaat",
      email: "jemaat@example.com",
      subject: "Pertanyaan",
      message: "x".repeat(2001),
    }).success).toBe(false);
    expect(profileCheckSchema.safeParse({ email: "not-an-email" }).success).toBe(false);
  });
});
