/**
 * SSRF Guard Utility for TokiConvert
 * Validates URLs and resolves hostnames against private/loopback/cloud metadata IP ranges.
 * Provides custom DNS lookup for Node.js http/https agents to prevent TOCTOU / DNS Rebinding attacks.
 */

import dns from "dns";
import dnsPromises from "dns/promises";
import net from "net";

export function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) return true;
  const [a, b, c] = parts;

  return (
    a === 0 || // 0.0.0.0/8 Current network
    a === 10 || // 10.0.0.0/8 Private network
    (a === 100 && b >= 64 && b <= 127) || // 100.64.0.0/10 RFC 6598 Carrier-grade NAT / Cloud VPC
    a === 127 || // 127.0.0.0/8 Loopback
    (a === 169 && b === 254) || // 169.254.0.0/16 Link-local / Cloud metadata
    (a === 172 && b >= 16 && b <= 31) || // 172.16.0.0/12 Private network
    (a === 192 && b === 0 && c === 0) || // 192.0.0.0/24 IETF Protocol Assignments
    (a === 192 && b === 0 && c === 2) || // 192.0.2.0/24 TEST-NET-1
    (a === 192 && b === 168) || // 192.168.0.0/16 Private network
    (a === 198 && b >= 18 && b <= 19) || // 198.18.0.0/15 Benchmarking
    (a === 198 && b === 51 && c === 100) || // 198.51.100.0/24 TEST-NET-2
    (a === 203 && b === 0 && c === 113) || // 203.0.113.0/24 TEST-NET-3
    a >= 224 // 224.0.0.0/4 Multicast & 240.0.0.0/4 Reserved
  );
}

export function isPrivateIPv6(ip: string): boolean {
  const lower = ip.toLowerCase().replace(/^\[/, "").replace(/\]$/, "");

  // Unspecified & Loopback
  if (lower === "::" || lower === "::1") return true;

  // Unique local addresses (fc00::/7)
  if (lower.startsWith("fc") || lower.startsWith("fd")) return true;

  // Link-local addresses (fe80::/10)
  if (lower.startsWith("fe8") || lower.startsWith("fe9") || lower.startsWith("fea") || lower.startsWith("feb")) {
    return true;
  }

  // IPv4-mapped IPv6 (::ffff:x.x.x.x)
  if (lower.startsWith("::ffff:")) {
    const ipv4Part = lower.slice(7);
    if (net.isIPv4(ipv4Part)) {
      return isPrivateIPv4(ipv4Part);
    }
    return true;
  }

  return false;
}

/**
 * Validates that destination port is standard HTTP/HTTPS (80 or 443).
 */
export function assertSafePort(portStr: string): void {
  if (!portStr) return; // default 80/443
  const p = parseInt(portStr, 10);
  if (isNaN(p) || (p !== 80 && p !== 443)) {
    throw new Error("INVALID_PORT");
  }
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
    const lookupResults = await dnsPromises.lookup(hostname, { all: true });
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

/**
 * Custom DNS lookup hook for Node.js http.request / https.request.
 * This runs immediately prior to TCP socket connection and guarantees that the actual
 * connection ONLY connects to an IP that passed private IP validation (preventing DNS rebinding / TOCTOU).
 */
export function safeDnsLookup(
  hostname: string,
  options: dns.LookupOptions,
  callback: (err: NodeJS.ErrnoException | null, address: string | dns.LookupAddress[], family?: number) => void
): void {
  const h = hostname.toLowerCase();
  if (
    h === "localhost" ||
    h.endsWith(".localhost") ||
    h.endsWith(".local") ||
    h.endsWith(".internal") ||
    h === "metadata.google.internal"
  ) {
    const err = new Error("SSRF_BLOCKED") as NodeJS.ErrnoException;
    err.code = "SSRF_BLOCKED";
    return callback(err, "");
  }

  // If already an IP address
  if (net.isIPv4(h)) {
    if (isPrivateIPv4(h)) {
      const err = new Error("SSRF_BLOCKED") as NodeJS.ErrnoException;
      err.code = "SSRF_BLOCKED";
      return callback(err, "");
    }
    return callback(null, h, 4);
  }

  if (net.isIPv6(h)) {
    if (isPrivateIPv6(h)) {
      const err = new Error("SSRF_BLOCKED") as NodeJS.ErrnoException;
      err.code = "SSRF_BLOCKED";
      return callback(err, "");
    }
    return callback(null, h, 6);
  }

  // Resolve with OS resolver
  dns.lookup(hostname, { all: true }, (lookupErr, addresses) => {
    if (lookupErr || !addresses || addresses.length === 0) {
      return callback(lookupErr || new Error("DNS_UNREACHABLE"), "");
    }

    // Verify EVERY returned IP
    for (const rec of addresses) {
      if (net.isIPv4(rec.address) && isPrivateIPv4(rec.address)) {
        const err = new Error("SSRF_BLOCKED") as NodeJS.ErrnoException;
        err.code = "SSRF_BLOCKED";
        return callback(err, "");
      }
      if (net.isIPv6(rec.address) && isPrivateIPv6(rec.address)) {
        const err = new Error("SSRF_BLOCKED") as NodeJS.ErrnoException;
        err.code = "SSRF_BLOCKED";
        return callback(err, "");
      }
    }

    // Safe to connect: pick the first verified address
    const safeTarget = addresses[0];
    if (options && typeof options === "object" && (options as { all?: boolean }).all) {
      return callback(null, addresses);
    }
    return callback(null, safeTarget.address, safeTarget.family);
  });
}
