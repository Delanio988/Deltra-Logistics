import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
const redis = redisUrl && redisToken ? new Redis({ url: redisUrl, token: redisToken }) : null;

let warnedMissingConfig = false;

const limiters = new Map<string, Ratelimit>();

function getLimiter(name: string, requests: number, window: `${number} ${"s" | "m" | "h"}`): Ratelimit | null {
  if (!redis) return null;
  let limiter = limiters.get(name);
  if (!limiter) {
    limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(requests, window),
      prefix: `ratelimit:${name}`,
    });
    limiters.set(name, limiter);
  }
  return limiter;
}

export type RateLimitResult = { success: true } | { success: false; error: string };

/**
 * Sliding-window rate limit for a Server Action, keyed by an identifier
 * (almost always the caller's user id). When Upstash isn't configured —
 * e.g. local development, or before UPSTASH_REDIS_REST_URL/TOKEN are set in
 * production — every call is allowed through, with a one-time console
 * warning, rather than breaking the action.
 */
export async function checkRateLimit(
  name: string,
  identifier: string,
  { requests, window }: { requests: number; window: `${number} ${"s" | "m" | "h"}` }
): Promise<RateLimitResult> {
  const limiter = getLimiter(name, requests, window);
  if (!limiter) {
    if (!warnedMissingConfig) {
      warnedMissingConfig = true;
      console.warn(
        "[rate-limit] UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN are not set — rate limiting is disabled. Configure them before launch."
      );
    }
    return { success: true };
  }

  const { success } = await limiter.limit(identifier);
  if (!success) {
    return { success: false, error: "Too many requests — please wait a moment and try again." };
  }
  return { success: true };
}
