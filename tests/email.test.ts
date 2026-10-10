import { beforeEach, describe, expect, it, vi } from "vitest";

const sendMail = vi.fn();
const createTransport = vi.hoisted(() => vi.fn(() => ({ sendMail })));

vi.mock("nodemailer", () => ({ default: { createTransport } }));
vi.mock("lib/audit", () => ({ logAuditAction: vi.fn() }));

describe("SMTP email delivery", () => {
  beforeEach(() => {
    sendMail.mockReset();
    sendMail.mockResolvedValue({ messageId: "test-message" });
    createTransport.mockClear();
  });

  it("awaits the transporter with the expected message", async () => {
    const { sendEmail } = await import("lib/email");
    await expect(sendEmail("jemaat@example.com", "Subject", "<p>Hello</p>", "Hello")).resolves.toEqual({ ok: true });
    expect(createTransport).toHaveBeenCalledWith(expect.objectContaining({
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 30_000,
    }));
    expect(sendMail).toHaveBeenCalledWith(expect.objectContaining({
      from: "GKSBS <test@example.com>",
      to: "jemaat@example.com",
      subject: "Subject",
      html: "<p>Hello</p>",
      text: "Hello",
    }));
  });

  it("returns a generic failure and does not log provider secrets", async () => {
    const smtpError = Object.assign(new Error("SMTP password=do-not-log OTP=123456"), {
      code: "EAUTH",
      responseCode: 535,
      command: "AUTH PLAIN",
    });
    sendMail.mockRejectedValue(smtpError);
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { sendEmail } = await import("lib/email");

    await expect(sendEmail("jemaat@example.com", "Subject", "<p>Hello</p>")).resolves.toEqual({
      ok: false,
      error: "Email delivery failed",
    });
    expect(errorSpy).toHaveBeenCalledWith("Email delivery failed", {
      code: "EAUTH",
      responseCode: 535,
      command: "AUTH PLAIN",
    });
    expect(errorSpy.mock.calls.flat().join(" ")).not.toContain("123456");
    expect(errorSpy.mock.calls.flat().join(" ")).not.toContain("do-not-log");
    errorSpy.mockRestore();
  });
});
