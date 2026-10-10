import { beforeEach, describe, expect, it, vi } from "vitest";

const generateLink = vi.hoisted(() => vi.fn());
const sendPasswordResetEmail = vi.hoisted(() => vi.fn(async (
  _email: string,
  _link: string,
): Promise<{ ok: true }> => ({ ok: true })));

vi.mock("lib/supabaseAdmin", () => ({
  supabaseAdmin: { auth: { admin: { generateLink } } },
}));
vi.mock("lib/email", () => ({ sendPasswordResetEmail }));
vi.mock("lib/rateLimit", () => ({
  rateLimit: () => async () => ({ ok: true }),
  emailIdentityRateLimit: async () => ({ ok: true }),
}));

describe("password recovery links", () => {
  beforeEach(() => {
    generateLink.mockReset();
    sendPasswordResetEmail.mockClear();
    generateLink.mockResolvedValue({
      data: { properties: { hashed_token: "recovery-hash-123" } },
      error: null,
    });
  });

  it("sends a token-hash link that the reset page can exchange for a recovery session", async () => {
    const { POST } = await import("../app/api/auth/forgot-password/route");
    const response = await POST(new Request("https://gksbs.example/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email: " Admin@Example.com " }),
      headers: { "content-type": "application/json" },
    }));

    expect(response.status).toBe(200);
    expect(generateLink).toHaveBeenCalledWith({
      type: "recovery",
      email: "admin@example.com",
      options: { redirectTo: "https://gksbs.example/reset-password" },
    });
    const resetUrl = new URL(sendPasswordResetEmail.mock.calls[0][1]);
    expect(resetUrl.origin).toBe("https://gksbs.example");
    expect(resetUrl.pathname).toBe("/reset-password");
    expect(resetUrl.searchParams.get("token_hash")).toBe("recovery-hash-123");
    expect(resetUrl.searchParams.get("type")).toBe("recovery");
  });
});
