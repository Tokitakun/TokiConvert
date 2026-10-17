/**
 * Proxy Signature Utility for TokiConvert
 * Generates and verifies HMAC-SHA256 tokens for verified media URLs to prevent open proxy abuse.
 * Enforces strict fail-closed secret configuration in production.
 */

import crypto from "crypto";

const MIN_SECRET_LENGTH_PROD = 32;
const MIN_SECRET_LENGTH_DEV = 16;
const DEV_DEFAULT_SECRET = "tokiconvert_dev_insecure_static_proxy_secret_key_32_characters_minimum";

/**
 * Retrieves the cryptographic secret for HMAC signatures.
 * Fail-closed in production: strictly requires PROXY_SECRET of at least 32 characters.
 * Never leaks the secret value in errors or logs.
 */
export function getConsistentServerSecret(): string {
  const envSecret = process.env.PROXY_SECRET;
  const isProd = process.env.NODE_ENV === "production";

  if (isProd) {
    if (!envSecret) {
      throw new Error(
        "SERVER_CONFIG_ERROR: PROXY_SECRET environment variable is missing in production environment. A secure secret of at least 32 characters is required."
      );
    }
    if (envSecret.length < MIN_SECRET_LENGTH_PROD) {
      throw new Error(
        `SERVER_CONFIG_ERROR: PROXY_SECRET is too short in production (${envSecret.length} chars). Minimum ${MIN_SECRET_LENGTH_PROD} characters required.`
      );
    }
    return envSecret;
  }

  // Development / Test environment
  if (envSecret) {
    if (envSecret.length < MIN_SECRET_LENGTH_DEV) {
      throw new Error(
        `SERVER_CONFIG_ERROR: PROXY_SECRET must be at least ${MIN_SECRET_LENGTH_DEV} characters.`
      );
    }
    return envSecret;
  }

  // Deterministic fallback exclusively for development / test when PROXY_SECRET is not set
  return DEV_DEFAULT_SECRET;
}

export interface SignedProxyData {
  token: string;
  expiresAt: number;
}

/**
 * Normalizes URL string to eliminate trivial differences in casing, default ports, and formatting.
 */
export function normalizeUrlForSignature(rawUrl: string): string {
  try {
    const u = new URL(rawUrl.trim());
    return u.href;
  } catch {
    return rawUrl.trim();
  }
}

/**
 * Creates an HMAC-SHA256 signature for a verified media URL with a finite time-to-live.
 * Binds the hostname, normalized URL, and expiration timestamp.
 */
export function signProxyUrl(targetUrl: string, ttlSeconds = 7200): SignedProxyData {
  const secret = getConsistentServerSecret();
  const normalized = normalizeUrlForSignature(targetUrl);
  let hostname = "";
  try {
    hostname = new URL(normalized).hostname.toLowerCase();
  } catch {
    hostname = "unknown";
  }

  const expiresAt = Math.floor(Date.now() / 1000) + ttlSeconds;
  const payload = `${hostname}:${normalized}:${expiresAt}`;
  const token = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  return { token, expiresAt };
}

/**
 * Verifies that a given token and expiry match the specified target URL.
 * Fails closed safely if the server secret is invalid or unconfigured.
 */
export function verifyProxyUrl(
  targetUrl: string,
  token: string | undefined,
  expiresAt: number | string | undefined
): boolean {
  if (!token || !expiresAt) {
    return false;
  }

  const numExpires = typeof expiresAt === "number" ? expiresAt : parseInt(String(expiresAt), 10);
  if (isNaN(numExpires)) {
    return false;
  }

  // Check expiration
  const now = Math.floor(Date.now() / 1000);
  if (now > numExpires) {
    return false;
  }

  let secret: string;
  try {
    secret = getConsistentServerSecret();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "CONFIG_ERROR";
    console.error(`[proxySignature] Token verification rejected: ${msg}`);
    return false;
  }

  const normalized = normalizeUrlForSignature(targetUrl);
  let hostname = "";
  try {
    hostname = new URL(normalized).hostname.toLowerCase();
  } catch {
    hostname = "unknown";
  }

  const payload = `${hostname}:${normalized}:${numExpires}`;
  const expectedToken = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  try {
    const a = Buffer.from(token, "hex");
    const b = Buffer.from(expectedToken, "hex");
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
