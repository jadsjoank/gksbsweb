import { describe, expect, it, vi } from "vitest";

const getUser = vi.fn();
const profileQuery = vi.fn();
const mfaCookie = vi.hoisted(() => ({ value: undefined as string | undefined }));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ get: () => mfaCookie.value ? { value: mfaCookie.value } : undefined })),
}));

vi.mock("lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({ auth: { getUser } })),
}));
vi.mock("lib/supabaseAdmin", () => ({
  supabaseAdmin: { from: vi.fn(() => ({ select: () => ({ eq: () => ({ single: profileQuery }) }) })) },
}));

describe("admin authorization", () => {
  it("rejects a normal user", async () => {
    mfaCookie.value = undefined;
    getUser.mockResolvedValue({ data: { user: { id: "user-1", email: "user@example.com" } } });
    profileQuery.mockResolvedValue({ data: { id: "user-1", email: "user@example.com", role: "User", full_name: "User" }, error: null });
    const { requireAdmin } = await import("lib/auth");
    await expect(requireAdmin()).resolves.toBeNull();
  });

  it("rejects an admin without MFA", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "admin-1", email: "admin@example.com" } } });
    profileQuery.mockResolvedValue({ data: { id: "admin-1", email: "admin@example.com", role: "Admin", full_name: "Admin" }, error: null });
    mfaCookie.value = undefined;
    const { requireAdmin } = await import("lib/auth");
    await expect(requireAdmin()).resolves.toBeNull();
  });

  it("accepts an admin profile", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "admin-1", email: "admin@example.com" } } });
    profileQuery.mockResolvedValue({ data: { id: "admin-1", email: "admin@example.com", role: "Admin", full_name: "Admin" }, error: null });
    const { createMfaCookieValue } = await import("lib/mfa");
    mfaCookie.value = createMfaCookieValue("admin-1");
    const { requireAdmin } = await import("lib/auth");
    await expect(requireAdmin()).resolves.toMatchObject({ id: "admin-1", role: "Admin" });
  });
});
