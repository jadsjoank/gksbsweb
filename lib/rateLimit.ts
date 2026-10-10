import { supabaseAdmin } from "./supabaseAdmin";
import { createHash } from "node:crypto";
import { logAuditAction } from "./audit";

/**
 * Persistent Supabase-backed rate limiter.
 *
 * Chosen over Upstash because the project already depends on Supabase and
 * no additional infrastructure or external Redis service is required.
 * The storage uses a rate_limits table with a composite key of (key, window_start).
 * Increments are performed by a PostgreSQL RPC so concurrent requests cannot
 * read the same count and both pass the limit.
 */

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  resetAt: number;
  error?: boolean;
};

function getRequestKey(request: Request) {
  const ip =
    (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() ||
    (request.headers.get("x-real-ip") ?? "") ||
    "unknown";

  return `${ip}:${new URL(request.url).pathname}`;
}

function getWindowStart(now: number, windowMs: number) {
  return Math.floor(now / windowMs) * windowMs;
}

export function rateLimit(options: { windowMs: number; max: number }) {
  return async function check(request: Request): Promise<RateLimitResult> {
    return consumeRateLimit(getRequestKey(request), options);
  };
}

export function rateLimitForIdentity(options: { windowMs: number; max: number }) {
  return async function check(request: Request, identity: string): Promise<RateLimitResult> {
    const identityHash = createHash("sha256").update(identity.trim().toLowerCase()).digest("hex");
    const result = await consumeRateLimit(`${getRequestKey(request)}:${identityHash}`, options);
    if (!result.ok && !result.error) {
      await logAuditAction({ entityType: "rate_limit", entityId: identityHash, action: "blocked" });
    }
    return result;
  };
}

export function rateLimitForKey(options: { windowMs: number; max: number }) {
  return async function check(key: string): Promise<RateLimitResult> {
    return consumeRateLimit(key, options);
  };
}

async function consumeRateLimit(key: string, options: { windowMs: number; max: number }): Promise<RateLimitResult> {
    const now = Date.now();
    const windowStart = getWindowStart(now, options.windowMs);
    const windowStartIso = new Date(windowStart).toISOString();

    const { data, error } = await supabaseAdmin.rpc("consume_rate_limit", {
      p_key: key,
      p_window_start: windowStartIso,
    });

    if (error || !data?.[0]) {
      console.error("Rate limit increment failed:", error?.message ?? "No counter returned");
      return {
        ok: false,
        remaining: 0,
        resetAt: windowStart + options.windowMs,
        error: true,
      };
    }

    const nextCount = data[0].current_count;
    const remaining = Math.max(0, options.max - nextCount);
    return {
      ok: nextCount <= options.max,
      remaining,
      resetAt: windowStart + options.windowMs,
    };
}

/** Pre-configured limiters */
export const loginRateLimit = rateLimit({ windowMs: 15 * 60_000, max: 10 }); // 10 attempts per 15 min
export const otpRateLimit = rateLimit({ windowMs: 10 * 60_000, max: 3 }); // 3 attempts per 10 min
export const otpVerifyRateLimit = rateLimit({ windowMs: 10 * 60_000, max: 5 }); // 5 failed/successful verification requests per 10 min
export const otpVerifyIdentityRateLimit = rateLimitForIdentity({ windowMs: 10 * 60_000, max: 5 });
export const otpAttemptRateLimit = rateLimitForKey({ windowMs: 10 * 60_000, max: 5 });
export const otpCooldownRateLimit = rateLimitForIdentity({ windowMs: 60_000, max: 1 });
export const registerRateLimit = rateLimit({ windowMs: 60 * 60_000, max: 5 }); // 5 registrations per hour
export const emailIdentityRateLimit = rateLimitForIdentity({ windowMs: 60 * 60_000, max: 3 }); // 3 messages per address per hour
