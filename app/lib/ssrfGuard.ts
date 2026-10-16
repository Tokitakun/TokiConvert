/**
 * SSRF Guard Utility for TokiConvert
 * Validates URLs and resolves hostnames against private/loopback/cloud metadata IP ranges.
 */

import dns from "dns/promises";
import net from "net";

export function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) return true;
  const [a, b] = parts;
  return (
    a === 10 || // 10.0.0.0/8
    (a === 172 && b >= 16 && b <= 31) || // 172.16.0.0/12
    (a === 192 && b === 168) || // 192.168.0.0/16
    a === 127 || // 127.0.0.0/8 Loopback
    (a === 169 && b === 254) || // 169.254.0.0/16 Link-local / Cloud metadata (AWS, GCP, Azure)
    a === 0 ||
    a >= 240
  );
}

export function isPrivateIPv6(ip: string): boolean {
  const lower = ip.toLowerCase().replace(/^\[/, "").replace(/\]$/, "");
  return (
    lower === "::1" ||
    lower.startsWith("fc") ||
    lower.startsWith("fd") ||
    lower.startsWith("fe80") ||
    lower.startsWith("::ffff:")
  );
}

/**
 * Validates that the hostname does not point to internal/loopback/private/cloud-metadata IP addresses.
 */
export async function assertSafeHost(hostname: string): Promise<void> {
  const h = hostname.toLowerCase();
  if (
    h === "localhost" ||
    h.endsWith(".localhost") ||
    h.endsWith(".local") ||
    h.endsWith(".internal") ||
    h === "metadata.google.internal"
  ) {
    throw new Error("SSRF_BLOCKED");
  }

  if (net.isIPv4(h)) {
    if (isPrivateIPv4(h)) throw new Error("SSRF_BLOCKED");
    return;
  }

  if (net.isIPv6(h)) {
    if (isPrivateIPv6(h)) throw new Error("SSRF_BLOCKED");
    return;
  }

  try {
    const lookupResults = await dns.lookup(hostname, { all: true });
    if (!lookupResults || lookupResults.length === 0) {
      throw new Error("DNS_UNREACHABLE");
    }
    for (const record of lookupResults) {
      const addr = record.address;
      if (net.isIPv4(addr) && isPrivateIPv4(addr)) throw new Error("SSRF_BLOCKED");
      if (net.isIPv6(addr) && isPrivateIPv6(addr)) throw new Error("SSRF_BLOCKED");
    }
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "SSRF_BLOCKED") throw err;
    throw new Error("DNS_UNREACHABLE");
  }
}
