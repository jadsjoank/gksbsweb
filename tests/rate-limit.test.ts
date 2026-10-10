import { beforeEach, describe, expect, it, vi } from "vitest";

const supabaseMock = vi.hoisted(() => ({
  rpc: vi.fn(),
}));

vi.mock("lib/supabaseAdmin", () => ({
  supabaseAdmin: supabaseMock,
}));

beforeEach(() => {
  supabaseMock.rpc.mockReset();
});

describe("persistent rate limiter", () => {
  it("uses the atomic database RPC and calculates remaining attempts", async () => {
    supabaseMock.rpc.mockResolvedValueOnce({
      data: [{ current_count: 3 }],
      error: null,
    });

    const { rateLimit } = await import("../lib/rateLimit");
    const limiter = rateLimit({ windowMs: 15 * 60_000, max: 5 });
    const response = await limiter(new Request("https://example.com/api/login", {
      headers: { "x-forwarded-for": "203.0.113.10" },
    }));

    expect(response.ok).toBe(true);
    expect(response.remaining).toBe(2);
    expect(response.error).toBeUndefined();
    expect(supabaseMock.rpc).toHaveBeenCalledWith("consume_rate_limit", {
      p_key: "203.0.113.10:/api/login",
      p_window_start: expect.any(String),
    });
  });

  it("blocks requests at and beyond the configured limit", async () => {
    supabaseMock.rpc.mockResolvedValueOnce({
      data: [{ current_count: 6 }],
      error: null,
    });

    const { rateLimit } = await import("../lib/rateLimit");
    const response = await rateLimit({ windowMs: 60_000, max: 5 })(
      new Request("https://example.com/api/register"),
    );

    expect(response.ok).toBe(false);
    expect(response.remaining).toBe(0);
    expect(response.error).toBeUndefined();
  });

  it("fails closed when the rate-limit store is unavailable", async () => {
    supabaseMock.rpc.mockResolvedValueOnce({
      data: null,
      error: { message: "database unavailable" },
    });

    const { rateLimit } = await import("../lib/rateLimit");
    const response = await rateLimit({ windowMs: 60_000, max: 5 })(
      new Request("https://example.com/api/register"),
    );

    expect(response).toMatchObject({ ok: false, remaining: 0, error: true });
  });
});
