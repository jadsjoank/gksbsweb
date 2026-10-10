import { beforeEach, describe, expect, it, vi } from "vitest";

const authProfile = vi.hoisted(() => ({
  value: null as {
    id: string;
    email: string;
    role: "User" | "Admin";
    full_name: string | null;
  } | null,
}));

const supabaseMock = vi.hoisted(() => ({
  from: vi.fn(),
}));

vi.mock("lib/auth", () => ({
  getProfileFromRequest: vi.fn(async () => authProfile.value),
  requireRoles: vi.fn(async () => ({ id: "admin-1", email: "admin@example.com", role: "Admin", full_name: "Admin" })),
}));

vi.mock("lib/supabaseAdmin", () => ({
  supabaseAdmin: supabaseMock,
}));

vi.mock("lib/rateLimit", () => ({
  rateLimit: () => async () => ({ ok: true, remaining: 10, resetAt: Date.now() + 60000 }),
  loginRateLimit: async () => ({ ok: true, remaining: 10, resetAt: Date.now() + 60000 }),
  otpRateLimit: async () => ({ ok: true, remaining: 3, resetAt: Date.now() + 60000 }),
  registerRateLimit: async () => ({ ok: true, remaining: 5, resetAt: Date.now() + 60000 }),
}));

function chain(result: { data?: unknown; error?: unknown }) {
  const builder: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const method of ["select", "eq", "order", "limit", "single", "maybeSingle", "insert"]) {
    builder[method] = vi.fn(() => builder);
  }
  builder.then = vi.fn((resolve: (value: typeof result) => unknown) => resolve(result));
  return builder;
}

beforeEach(() => {
  authProfile.value = null;
  supabaseMock.from.mockReset();
});

describe("login integration route", () => {
  it("rejects invalid credentials through the route", async () => {
    const { POST } = await import("../app/api/auth/login/route");
    const response = await POST(new Request("http://localhost/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "invalid", password: "short" }),
      headers: { "content-type": "application/json" },
    }));

    expect(response.status).toBe(422);
  });
});

describe("attendance submission integration route", () => {
  it("records attendance for an active event", async () => {
    authProfile.value = {
      id: "profile-1",
      email: "jemaat@example.com",
      role: "User",
      full_name: "Jemaat GKSBS",
    };
    supabaseMock.from
      .mockReturnValueOnce(chain({
        data: {
          id: "event-1",
          title: "Ibadah Minggu",
          attendance_enabled: true,
          start_date: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
          end_date: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        },
      }))
      .mockReturnValueOnce(chain({ data: { id: "profile-1" } }))
      .mockReturnValueOnce(chain({ data: null }))
      .mockReturnValueOnce(chain({ data: [{ id: "attendance-1" }] }));

    const { POST } = await import("../app/api/attendance/route");
    const { createAttendanceQrToken } = await import("lib/attendanceToken");
    const response = await POST(new Request("http://localhost/api/attendance", {
      method: "POST",
      body: JSON.stringify({ event_id: "event-1", profile_id: "profile-1", qr_token: createAttendanceQrToken("event-1", "profile-1") }),
      headers: { "content-type": "application/json" },
    }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      status: "ok",
      attendance: { id: "attendance-1" },
    });
  });

  it("rejects a member attendance request that targets another profile", async () => {
    authProfile.value = {
      id: "profile-1",
      email: "jemaat@example.com",
      role: "User",
      full_name: "Jemaat GKSBS",
    };

    const { POST } = await import("../app/api/attendance/route");
    const response = await POST(new Request("http://localhost/api/attendance", {
      method: "POST",
      body: JSON.stringify({ event_id: "event-1", profile_id: "profile-2" }),
      headers: { "content-type": "application/json" },
    }));

    expect(response.status).toBe(403);
    expect(supabaseMock.from).not.toHaveBeenCalled();
  });

  it("rejects member attendance without a QR token", async () => {
    authProfile.value = {
      id: "profile-1",
      email: "jemaat@example.com",
      role: "User",
      full_name: "Jemaat GKSBS",
    };

    const { POST } = await import("../app/api/attendance/route");
    const response = await POST(new Request("http://localhost/api/attendance", {
      method: "POST",
      body: JSON.stringify({ event_id: "event-1" }),
      headers: { "content-type": "application/json" },
    }));

    expect(response.status).toBe(403);
    expect(supabaseMock.from).not.toHaveBeenCalled();
  });

  it("rejects a wrong QR token", async () => {
    authProfile.value = {
      id: "profile-1",
      email: "jemaat@example.com",
      role: "User",
      full_name: "Jemaat GKSBS",
    };
    supabaseMock.from.mockReturnValueOnce(chain({
      data: {
        id: "event-1",
        title: "Ibadah Minggu",
        attendance_enabled: true,
        qr_token: "event-token",
        start_date: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        end_date: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      },
    }));

    const { POST } = await import("../app/api/attendance/route");
    const response = await POST(new Request("http://localhost/api/attendance", {
      method: "POST",
      body: JSON.stringify({ event_id: "event-1", qr_token: "wrong-token" }),
      headers: { "content-type": "application/json" },
    }));

    expect(response.status).toBe(401);
  });

  it("rejects unauthenticated requests that supply a profile ID", async () => {
    const { POST } = await import("../app/api/attendance/route");
    const response = await POST(new Request("http://localhost/api/attendance", {
      method: "POST",
      body: JSON.stringify({ event_id: "event-1", profile_id: "profile-1" }),
      headers: { "content-type": "application/json" },
    }));

    expect(response.status).toBe(401);
    expect(supabaseMock.from).not.toHaveBeenCalled();
  });
});

describe("donation creation integration route", () => {
  it("creates a pending QRIS donation for an authenticated user", async () => {
    authProfile.value = {
      id: "profile-1",
      email: "jemaat@example.com",
      role: "User",
      full_name: "Jemaat GKSBS",
    };
    const donationQuery = chain({ error: null });
    supabaseMock.from.mockReturnValueOnce(donationQuery);

    const { POST } = await import("../app/api/donations/route");
    const response = await POST(new Request("http://localhost/api/donations", {
      method: "POST",
      body: JSON.stringify({ amount: 50000, donor_name: "Jemaat GKSBS" }),
      headers: { "content-type": "application/json" },
    }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ status: "ok" });
    expect(donationQuery.insert).toHaveBeenCalledWith([
      expect.objectContaining({
        profile_id: "profile-1",
        amount: 50000,
        status: "pending",
        payment_method: "QRIS",
      }),
    ]);
  });
});

describe("volunteer registration integration route", () => {
  it("creates a pending volunteer application", async () => {
    authProfile.value = {
      id: "profile-1",
      email: "jemaat@example.com",
      role: "User",
      full_name: "Jemaat GKSBS",
    };
    const assignmentQuery = chain({ error: null });
    supabaseMock.from
      .mockReturnValueOnce(chain({ data: { id: "position-1", is_open: true } }))
      .mockReturnValueOnce(chain({ data: null }))
      .mockReturnValueOnce(assignmentQuery);

    const { POST } = await import("../app/api/volunteer/register/route");
    const response = await POST(new Request("http://localhost/api/volunteer/register", {
      method: "POST",
      body: JSON.stringify({
        position_id: "position-1",
        profile_id: "profile-1",
        full_name: "Jemaat GKSBS",
        email: "jemaat@example.com",
        motivation: "Ingin melayani jemaat.",
      }),
      headers: { "content-type": "application/json" },
    }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ status: "ok" });
    expect(assignmentQuery.insert).toHaveBeenCalledWith([
      expect.objectContaining({
        position_id: "position-1",
        profile_id: "profile-1",
        status: "pending",
      }),
    ]);
  });
});
