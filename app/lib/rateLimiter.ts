/**
 * Rate Limiter for TokiConvert API Routes
 * Sliding-window rate limiter per client IP with automatic pruning.
 * Designed to prevent denial of service and API quota abuse.
 */

interface RateLimitRecord {
  timestamps: number[];
  activeStreams: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Clean up stale entries every 5 minutes to prevent memory growth
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
      record.timestamps = record.timestamps.filter((ts) => now - ts < 60_000);
      if (record.timestamps.length === 0 && record.activeStreams <= 0) {
        rateLimitStore.delete(key);
      }
    }
  }, 300_000).unref();
}

export function getClientIp(reqHeaders: Headers): string {
  const forwarded = reqHeaders.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0].trim();
    if (first) return first;
  }
  return reqHeaders.get("x-real-ip") || "unknown_client";
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetSeconds: number;
}

/**
 * Checks and increments the rate limit for a given key.
 * @param key Identifier (e.g. client IP + route)
 * @param maxRequests Maximum requests permitted in window
 * @param windowSeconds Window duration in seconds
 */
export function checkRateLimit(
  key: string,
  maxRequests = 20,
  windowSeconds = 60
): RateLimitResult {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;

  let record = rateLimitStore.get(key);
  if (!record) {
    record = { timestamps: [], activeStreams: 0 };
    rateLimitStore.set(key, record);
  }

  // Remove timestamps outside window
  record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);

  if (record.timestamps.length >= maxRequests) {
    const oldest = record.timestamps[0];
    const resetSeconds = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
    return {
      success: false,
      limit: maxRequests,
      remaining: 0,
      resetSeconds,
    };
  }

  record.timestamps.push(now);
  return {
    success: true,
    limit: maxRequests,
    remaining: maxRequests - record.timestamps.length,
    resetSeconds: windowSeconds,
  };
}

/**
 * Tracks concurrent active downloads for a client IP.
 */
export function acquireStreamSlot(clientIp: string, maxConcurrent = 3): boolean {
  let record = rateLimitStore.get(clientIp);
  if (!record) {
    record = { timestamps: [], activeStreams: 0 };
    rateLimitStore.set(clientIp, record);
  }

  if (record.activeStreams >= maxConcurrent) {
    return false;
  }

  record.activeStreams++;
  return true;
}

export function releaseStreamSlot(clientIp: string): void {
  const record = rateLimitStore.get(clientIp);
  if (record && record.activeStreams > 0) {
    record.activeStreams--;
  }
}
