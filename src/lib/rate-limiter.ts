import type { NextRequest } from 'next/server';

/**
 * Record of IP address to an array of request timestamps (epoch ms).
 *
 * Uses an in-memory Map for single-process deployments.
 * For multi-instance deployments, swap this with Redis or an
 * equivalent distributed store.
 */
const requestLog = new Map<string, number[]>();

/** Maximum number of requests allowed within the time window. */
const MAX_REQUESTS = 20;

/** Sliding window duration in milliseconds (1 minute). */
const WINDOW_MS = 60_000;

/**
 * Result returned by the rate limiter check.
 *
 * - `allowed`: Whether the request should proceed.
 * - `remaining`: How many requests the client has left in the window.
 * - `retryAfterSeconds`: Seconds until the client can retry (0 if allowed).
 */
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

/**
 * Extracts the client IP address from a Next.js request.
 *
 * Checks `x-forwarded-for` first (common behind reverse proxies),
 * then falls back to `x-real-ip`, and finally `127.0.0.1` as a
 * last resort for local development.
 *
 * @param request - The incoming Next.js request.
 * @returns The extracted IP address string.
 */
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const firstIp = forwarded.split(',')[0];
    return firstIp?.trim() ?? '127.0.0.1';
  }
  return request.headers.get('x-real-ip') ?? '127.0.0.1';
}

/**
 * Checks whether a request from the given IP is within the rate limit.
 *
 * Implements a sliding window algorithm: timestamps older than
 * `WINDOW_MS` are pruned on each call. If the remaining count of
 * timestamps is below `MAX_REQUESTS`, the request is allowed and
 * the current timestamp is recorded.
 *
 * @param request - The incoming Next.js request (used to extract IP).
 * @returns A `RateLimitResult` indicating whether the request is allowed.
 *
 * @example
 * ```ts
 * const result = checkRateLimit(request);
 * if (!result.allowed) {
 *   return new Response('Too Many Requests', {
 *     status: 429,
 *     headers: { 'Retry-After': String(result.retryAfterSeconds) },
 *   });
 * }
 * ```
 */
export function checkRateLimit(request: NextRequest): RateLimitResult {
  const ip = getClientIp(request);
  const now = Date.now();
  const windowStart = now - WINDOW_MS;

  // Get existing timestamps and prune expired ones
  const timestamps = requestLog.get(ip) ?? [];
  const validTimestamps = timestamps.filter((t) => t > windowStart);

  if (validTimestamps.length >= MAX_REQUESTS) {
    // Find the earliest timestamp in the window to calculate retry-after
    const oldestInWindow = validTimestamps[0] ?? now;
    const retryAfterMs = oldestInWindow + WINDOW_MS - now;
    const retryAfterSeconds = Math.ceil(retryAfterMs / 1000);

    // Update the map with pruned timestamps (don't add current)
    requestLog.set(ip, validTimestamps);

    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(retryAfterSeconds, 1),
    };
  }

  // Record this request
  validTimestamps.push(now);
  requestLog.set(ip, validTimestamps);

  return {
    allowed: true,
    remaining: MAX_REQUESTS - validTimestamps.length,
    retryAfterSeconds: 0,
  };
}

/**
 * Generates standard rate-limit response headers.
 *
 * @param result - The rate limit check result.
 * @returns An object of HTTP headers to attach to the response.
 */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': String(MAX_REQUESTS),
    'X-RateLimit-Remaining': String(result.remaining),
  };

  if (!result.allowed) {
    headers['Retry-After'] = String(result.retryAfterSeconds);
  }

  return headers;
}

/**
 * Clears the in-memory rate limit store.
 * Intended for use in tests only.
 */
export function clearRateLimitStore(): void {
  requestLog.clear();
}
