import { createHash, createHmac } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

const requireAdmin = vi.hoisted(() => vi.fn(async () => ({ id: "admin-1", email: "admin@example.com", role: "Admin", full_name: "Admin" })));
const sendEmail = vi.hoisted(() => vi.fn(async (
  _to: string,
  _subject: string,
  _html: string,
): Promise<{ ok: true } | { ok: false; error: string }> => ({ ok: true })));
const otpVerifyIdentityRateLimit = vi.hoisted(() => vi.fn(async () => ({ ok: true, remaining: 4, resetAt: Date.now() + 60000 })));
const otpRateLimit = vi.hoisted(() => vi.fn(async () => ({ ok: true, remaining: 2, resetAt: Date.now() + 60000 })));
const emailIdentityRateLimit = vi.hoisted(() => vi.fn(async () => ({ ok: true, remaining: 2, resetAt: Date.now() + 60000 })));
const from = vi.hoisted(() => vi.fn());
const otpAttemptRateLimit = vi.hoisted(() => vi.fn(async () => ({ ok: true, remaining: 4, resetAt: Date.now() + 60000 })));
const otpCooldownRateLimit = vi.hoisted(() => vi.fn(async () => ({ ok: true, remaining: 0, resetAt: Date.now() + 60000 })));

vi.mock("lib/auth", () => ({ requireAdmin }));
vi.mock("lib/email", () => ({ sendEmail }));
vi.mock("lib/rateLimit", () => ({ otpRateLimit, otpVerifyIdentityRateLimit, emailIdentityRateLimit, otpAttemptRateLimit, otpCooldownRateLimit }));
vi.mock("lib/supabaseAdmin", () => ({ supabaseAdmin: { from } }));

function chain(result: { data?: unknown; error?: unknown }) {
  const builder: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const method of ["select", "eq", "gt", "order", "limit", "single", "update", "insert"]) {
    builder[method] = vi.fn(() => builder);
  }
  builder.then = vi.fn((resolve: (value: typeof result) => unknown) => resolve(result));
  return builder;
}

describe("admin OTP security", () => {
  beforeEach(() => {
    from.mockReset();
    sendEmail.mockClear();
    otpCooldownRateLimit.mockResolvedValue({ ok: true, remaining: 0, resetAt: Date.now() + 60000 });
    otpAttemptRateLimit.mockResolvedValue({ ok: true, remaining: 4, resetAt: Date.now() + 60000 });
    otpVerifyIdentityRateLimit.mockResolvedValue({ ok: true, remaining: 4, resetAt: Date.now() + 60000 });
  });

  it("rejects expired or unavailable OTPs", async () => {
    from.mockReturnValue(chain({ data: null, error: { message: "not found" } }));
    const { PUT } = await import("../app/api/auth/otp/route");
    const response = await PUT(new Request("http://localhost/api/auth/otp", {
      method: "PUT",
      body: JSON.stringify({ otp_code: "123456" }),
      headers: { "content-type": "application/json" },
    }));
    expect(response.status).toBe(401);
  });

  it("blocks verification after the rate limit is reached", async () => {
    otpVerifyIdentityRateLimit.mockResolvedValue({ ok: false, remaining: 0, resetAt: Date.now() + 60000 });
    const { PUT } = await import("../app/api/auth/otp/route");
    const response = await PUT(new Request("http://localhost/api/auth/otp", {
      method: "PUT",
      body: JSON.stringify({ otp_code: "123456" }),
      headers: { "content-type": "application/json" },
    }));
    expect(response.status).toBe(429);
    expect(from).not.toHaveBeenCalled();
  });

  it("returns the server cooldown when an OTP resend is requested too soon", async () => {
    otpCooldownRateLimit.mockResolvedValue({ ok: false, remaining: 0, resetAt: Date.now() + 45_000 });
    const { POST } = await import("../app/api/auth/otp/route");
    const response = await POST(new Request("http://localhost/api/auth/otp", { method: "POST" }));
    expect(response.status).toBe(429);
    expect(Number(response.headers.get("Retry-After"))).toBeGreaterThan(0);
    expect(otpRateLimit).not.toHaveBeenCalled();
    expect(from).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("stores a hash instead of the OTP code", async () => {
    const updateQuery = chain({ error: null });
    const insertQuery = chain({ error: null });
    from.mockReturnValueOnce(updateQuery).mockReturnValueOnce(insertQuery);
    const { POST } = await import("../app/api/auth/otp/route");
    const response = await POST(new Request("http://localhost/api/auth/otp", { method: "POST" }));
    expect(response.status).toBe(200);
    const inserted = insertQuery.insert.mock.calls[0][0][0];
    expect(inserted.otp_code).toMatch(/^[a-f0-9]{64}$/);
    expect(sendEmail).toHaveBeenCalledOnce();
    await expect(response.json()).resolves.toMatchObject({ resend_after: expect.any(Number) });
    expect(insertQuery.insert.mock.invocationCallOrder[0]).toBeLessThan(sendEmail.mock.invocationCallOrder[0]);
  });

  it("does not send an OTP when saving it fails", async () => {
    from.mockReturnValueOnce(chain({ error: null })).mockReturnValueOnce(chain({ error: { message: "database unavailable" } }));
    const { POST } = await import("../app/api/auth/otp/route");
    const response = await POST(new Request("http://localhost/api/auth/otp", { method: "POST" }));
    expect(response.status).toBe(500);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("invalidates an OTP when email delivery fails", async () => {
    sendEmail.mockResolvedValueOnce({ ok: false, error: "Email delivery failed" });
    from
      .mockReturnValueOnce(chain({ error: null }))
      .mockReturnValueOnce(chain({ error: null }))
      .mockReturnValueOnce(chain({ error: null }));
    const { POST } = await import("../app/api/auth/otp/route");
    const response = await POST(new Request("http://localhost/api/auth/otp", { method: "POST" }));
    expect(response.status).toBe(502);
    expect(from).toHaveBeenCalledTimes(3);
  });

  it("accepts peppered HMAC and consumes the OTP, but rejects legacy SHA-256", async () => {
    const hmac = createHmac("sha256", process.env.OTP_PEPPER!).update("admin-1:123456").digest("hex");
    from.mockReturnValueOnce(chain({ data: { id: "otp-1", otp_code: hmac, expires_at: new Date(Date.now() + 60000).toISOString(), is_used: false }, error: null }));
    from.mockReturnValueOnce(chain({ error: null }));
    const { PUT } = await import("../app/api/auth/otp/route");
    const validResponse = await PUT(new Request("http://localhost/api/auth/otp", { method: "PUT", body: JSON.stringify({ otp_code: "123456" }) }));
    expect(validResponse.status).toBe(200);

    const legacyHash = createHash("sha256").update("123456").digest("hex");
    from.mockReturnValueOnce(chain({ data: { id: "otp-2", otp_code: legacyHash, expires_at: new Date(Date.now() + 60000).toISOString(), is_used: false }, error: null }));
    const legacyResponse = await PUT(new Request("http://localhost/api/auth/otp", { method: "PUT", body: JSON.stringify({ otp_code: "123456" }) }));
    expect(legacyResponse.status).toBe(401);
  });
});
