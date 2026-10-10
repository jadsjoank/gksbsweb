import { describe, expect, it } from "vitest";
import { loginSchema, registerSchema } from "lib/validation/auth";
import { forbiddenResponse, unauthorizedResponse } from "lib/auth";

describe("authentication validation schemas", () => {
  it("accepts valid login credentials", () => {
    expect(loginSchema.safeParse({
      email: "jemaat@example.com",
      password: "Password1!",
    }).success).toBe(true);
  });

  it("rejects invalid login credentials", () => {
    expect(loginSchema.safeParse({
      email: "not-an-email",
      password: "short",
    }).success).toBe(false);
  });

  it("accepts a valid registration", () => {
    expect(registerSchema.safeParse({
      email: "jemaat@example.com",
      password: "Password1!",
      confirmPassword: "Password1!",
      name: "Jemaat GKSBS",
    }).success).toBe(true);
  });

  it("rejects weak or mismatched registration passwords", () => {
    expect(registerSchema.safeParse({
      email: "jemaat@example.com",
      password: "password",
      confirmPassword: "different",
      name: "Jemaat GKSBS",
    }).success).toBe(false);
  });
});

describe("authentication response helpers", () => {
  it("returns a standardized unauthorized response", async () => {
    const response = unauthorizedResponse();
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      status: "unauthorized",
      message: "Authentication required",
    });
  });

  it("returns a standardized forbidden response", async () => {
    const response = forbiddenResponse();
    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      status: "forbidden",
      message: "Insufficient permissions",
    });
  });
});
