/**
 * Safe HTTP/HTTPS Client for TokiConvert
 * Uses native Node.js http/https agents with safeDnsLookup pinning to eliminate
 * Time-of-Check to Time-of-Use (TOCTOU) / DNS Rebinding vulnerabilities.
 * Maintains full TLS SNI and standard X.509 certificate validation.
 */

import http from "node:http";
import https from "node:https";
import { Readable } from "node:stream";
import { assertSafeHost, assertSafePort, safeDnsLookup } from "./ssrfGuard";

export interface SafeHttpResponse {
  statusCode: number;
  statusMessage: string;
  headers: http.IncomingHttpHeaders;
  finalUrl: URL;
  body: Readable;
}

export interface SafeHttpOptions {
  method?: "GET" | "HEAD";
  headers?: Record<string, string>;
  signal?: AbortSignal;
  timeoutMs?: number;
  maxRedirects?: number;
}

/**
 * Performs a single HTTP or HTTPS request pinned to verified IP addresses via safeDnsLookup.
 */
function singlePinnedRequest(
  targetUrl: URL,
  method: "GET" | "HEAD",
  headers: Record<string, string>,
  timeoutMs: number,
  signal?: AbortSignal
): Promise<{ statusCode: number; statusMessage: string; headers: http.IncomingHttpHeaders; body: Readable }> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      return reject(new Error("ABORTED"));
    }

    const isHttps = targetUrl.protocol === "https:";
    const transport = isHttps ? https : http;

    const reqOptions: https.RequestOptions = {
      protocol: targetUrl.protocol,
      hostname: targetUrl.hostname,
      port: targetUrl.port || (isHttps ? 443 : 80),
      path: `${targetUrl.pathname}${targetUrl.search}`,
      method,
      headers: {
        ...headers,
        Host: targetUrl.host,
      },
      // DNS pinning hook: guarantees TCP connects ONLY to verified safe IPs
      lookup: safeDnsLookup,
      // Full TLS SNI & certificate validation against original hostname
      servername: targetUrl.hostname,
      rejectUnauthorized: true,
      timeout: timeoutMs,
    };

    const req = transport.request(reqOptions, (res) => {
      resolve({
        statusCode: res.statusCode || 200,
        statusMessage: res.statusMessage || "",
        headers: res.headers,
        body: res,
      });
    });

    const onAbort = () => {
      req.destroy(new Error("ABORTED"));
      reject(new Error("ABORTED"));
    };

    if (signal) {
      signal.addEventListener("abort", onAbort, { once: true });
    }

    req.on("timeout", () => {
      req.destroy(new Error("TIMEOUT"));
      reject(new Error("TIMEOUT"));
    });

    req.on("error", (err: unknown) => {
      if (signal) signal.removeEventListener("abort", onAbort);
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("SSRF_BLOCKED") || (err as { code?: string })?.code === "SSRF_BLOCKED") {
        reject(new Error("SSRF_BLOCKED"));
      } else {
        reject(err);
      }
    });

    req.end();
  });
}

/**
 * Executes an HTTP/HTTPS request with safe manual redirect following and IP pinning.
 */
export async function safePinnedHttpFetch(
  initialUrl: URL,
  options: SafeHttpOptions = {}
): Promise<SafeHttpResponse> {
  const method = options.method || "GET";
  const headers = options.headers || {};
  const timeoutMs = options.timeoutMs || 15_000;
  const maxRedirects = options.maxRedirects ?? 3;
  const signal = options.signal;

  let currentUrl = initialUrl;
  let redirects = 0;

  while (redirects <= maxRedirects) {
    if (signal?.aborted) throw new Error("ABORTED");

    // Validate protocol and port for each hop
    if (currentUrl.protocol !== "http:" && currentUrl.protocol !== "https:") {
      throw new Error("INVALID_PROTOCOL");
    }
    assertSafePort(currentUrl.port);

    // Initial pre-check on host
    await assertSafeHost(currentUrl.hostname);

    const res = await singlePinnedRequest(currentUrl, method, headers, timeoutMs, signal);

    // Handle redirects manually
    if ([301, 302, 303, 307, 308].includes(res.statusCode)) {
      redirects++;
      // Consume body of redirect to prevent socket leaks
      res.body.resume();

      const location = res.headers.location;
      if (!location) throw new Error("REDIRECT_NO_LOCATION");

      const nextUrl = new URL(location, currentUrl);
      currentUrl = nextUrl;
      continue;
    }

    return {
      statusCode: res.statusCode,
      statusMessage: res.statusMessage,
      headers: res.headers,
      finalUrl: currentUrl,
      body: res.body,
    };
  }

  throw new Error("TOO_MANY_REDIRECTS");
}
