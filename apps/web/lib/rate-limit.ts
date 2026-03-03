import { NextResponse } from "next/server";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes to prevent memory leak
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup(): void {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key);
  }
}

export interface RateLimitConfig {
  /** Max requests per window */
  limit: number;
  /** Window size in milliseconds */
  windowMs: number;
}

const API_KEY_LIMIT: RateLimitConfig = { limit: 30, windowMs: 60_000 };
const IP_LIMIT: RateLimitConfig = { limit: 60, windowMs: 60_000 };

export function checkRateLimit(
  key: string,
  config: RateLimitConfig,
): { allowed: boolean; remaining: number; resetAt: number } {
  cleanup();

  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    const resetAt = now + config.windowMs;
    store.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: config.limit - 1, resetAt };
  }

  entry.count += 1;
  const allowed = entry.count <= config.limit;
  return {
    allowed,
    remaining: Math.max(0, config.limit - entry.count),
    resetAt: entry.resetAt,
  };
}

export function applyRateLimit(
  ip: string | null,
  apiKey: string | null,
): NextResponse | null {
  // Check API key rate limit (30/min)
  if (apiKey) {
    const result = checkRateLimit(`apikey:${apiKey}`, API_KEY_LIMIT);
    if (!result.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded for API key" },
        {
          status: 429,
          headers: {
            "Retry-After": String(
              Math.ceil((result.resetAt - Date.now()) / 1000),
            ),
            "X-RateLimit-Limit": String(API_KEY_LIMIT.limit),
            "X-RateLimit-Remaining": "0",
          },
        },
      );
    }
  }

  // Check IP rate limit (60/min)
  if (ip) {
    const result = checkRateLimit(`ip:${ip}`, IP_LIMIT);
    if (!result.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        {
          status: 429,
          headers: {
            "Retry-After": String(
              Math.ceil((result.resetAt - Date.now()) / 1000),
            ),
            "X-RateLimit-Limit": String(IP_LIMIT.limit),
            "X-RateLimit-Remaining": "0",
          },
        },
      );
    }
  }

  return null;
}
