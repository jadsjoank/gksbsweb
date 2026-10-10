import { beforeEach, describe, expect, it, vi } from "vitest";
import { createHash } from "node:crypto";

const supabaseMock = vi.hoisted(() => ({
  from: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock("lib/supabaseAdmin", () => ({
  supabaseAdmin: supabaseMock,
}));

function chain(result: { data?: unknown; error?: unknown }) {
  const builder: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const method of ["select", "eq", "filter", "limit", "single", "maybeSingle", "insert", "update"]) {
    builder[method] = vi.fn(() => builder);
  }
  builder.then = vi.fn((resolve: (value: typeof result) => unknown) => resolve(result));
  return builder;
}

function signedBody(overrides: Record<string, unknown> = {}) {
  const body = {
    order_id: "DON-test-order",
    transaction_status: "settlement",
    fraud_status: "accept",
    status_code: "200",
    gross_amount: "50000",
    transaction_id: "txn-1",
    payment_type: "qris",
    ...overrides,
  };
  const signature = createHash("sha512")
    .update(`${body.order_id}${body.status_code}${body.gross_amount}`)
    .digest("hex");
  return { ...body, signature };
}

beforeEach(() => {
  supabaseMock.from.mockReset();
  supabaseMock.rpc.mockReset();
});

describe("payment webhook regression handling", () => {
  it("rejects unknown provider statuses before claiming the webhook", async () => {
    const { POST } = await import("../app/api/payments/webhook/route");
    const response = await POST(new Request("http://localhost/api/payments/webhook", {
      method: "POST",
      body: JSON.stringify(signedBody({ transaction_status: "unknown-provider-status" })),
      headers: { "content-type": "application/json" },
    }));

    expect(response.status).toBe(400);
    expect(supabaseMock.from).not.toHaveBeenCalled();
    expect(supabaseMock.rpc).not.toHaveBeenCalled();
  });

  it("returns a retryable response when donation status cannot be updated", async () => {
    supabaseMock.from
      .mockReturnValueOnce(chain({ data: null, error: null }));
    supabaseMock.rpc.mockResolvedValueOnce({
      data: null,
      error: { message: "database unavailable" },
    });

    const { POST } = await import("../app/api/payments/webhook/route");
    const response = await POST(new Request("http://localhost/api/payments/webhook", {
      method: "POST",
      body: JSON.stringify(signedBody()),
      headers: { "content-type": "application/json" },
    }));

    expect(response.status).toBe(503);
    expect(supabaseMock.from).toHaveBeenCalledTimes(1);
    expect(supabaseMock.rpc).toHaveBeenCalledTimes(1);
  });

  it("does not reprocess a completed duplicate webhook", async () => {
    supabaseMock.from
      .mockReturnValueOnce(chain({ error: { code: "23505", message: "duplicate" } }))
      .mockReturnValueOnce(chain({ data: { processing_status: "completed" }, error: null }));

    const { POST } = await import("../app/api/payments/webhook/route");
    const response = await POST(new Request("http://localhost/api/payments/webhook", {
      method: "POST",
      body: JSON.stringify(signedBody()),
      headers: { "content-type": "application/json" },
    }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ status: "ok", duplicate: true });
    expect(supabaseMock.rpc).not.toHaveBeenCalled();
  });

  it("defers a duplicate while another webhook is still processing", async () => {
    supabaseMock.from
      .mockReturnValueOnce(chain({ error: { code: "23505", message: "duplicate" } }))
      .mockReturnValueOnce(chain({
        data: {
          processing_status: "processing",
          created_at: new Date().toISOString(),
        },
        error: null,
      }));

    const { POST } = await import("../app/api/payments/webhook/route");
    const response = await POST(new Request("http://localhost/api/payments/webhook", {
      method: "POST",
      body: JSON.stringify(signedBody()),
      headers: { "content-type": "application/json" },
    }));

    expect(response.status).toBe(202);
    await expect(response.json()).resolves.toMatchObject({ status: "retry", processing: true });
    expect(supabaseMock.rpc).not.toHaveBeenCalled();
  });

  it("returns a retryable response when donor notification lookup fails", async () => {
    supabaseMock.from
      .mockReturnValueOnce(chain({ error: null }))
      .mockReturnValueOnce(chain({ data: { profile_id: "profile-1", donor_name: "Jemaat", amount: 50000 }, error: null }))
      .mockReturnValueOnce(chain({ data: null, error: { message: "notification lookup failed" } }));
    supabaseMock.rpc.mockResolvedValueOnce({
      data: [{ id: "donation-1", previous_status: "pending", status: "paid" }],
      error: null,
    });

    const { POST } = await import("../app/api/payments/webhook/route");
    const response = await POST(new Request("http://localhost/api/payments/webhook", {
      method: "POST",
      body: JSON.stringify(signedBody()),
      headers: { "content-type": "application/json" },
    }));

    expect(response.status).toBe(503);
  });
});
