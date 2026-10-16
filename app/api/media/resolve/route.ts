/**
 * /api/media/resolve - Secure server-side Media URL resolver
 * Security: Node.js runtime only (default for App Router Route Handlers),
 * SSRF guard via OS DNS lookup (getaddrinfo), domain allowlist, timeout, no stack trace leakage.
 */

import { NextRequest, NextResponse } from "next/server";
import dns from "dns/promises";
import net from "net";

// ── Types ─────────────────────────────────────────────────────────────────────

export type ErrorCategory =
  | "validation"
  | "dns"
  | "ssrf"
  | "timeout"
  | "upstream"
  | "no_result";

export interface ResolveErrorResult {
  status: false;
  errorCategory: ErrorCategory;
  message: string;
  upstreamStatus?: number;
}

// ── Safe diagnostic logger ────────────────────────────────────────────────────
// Only logs safe metadata: stage, category, sanitized host, method, upstream status.
// Never logs raw URLs with query params, cookies, tokens, or credentials.
function logDiagnostic(params: {
  stage: string;
  category: ErrorCategory;
  host: string;
  method?: string;
  upstreamStatus?: number | string;
  detail?: string;
}): void {
  console.warn(
    `[media/resolve][${params.stage}] category=${params.category} host=${params.host}` +
      (params.method ? ` method=${params.method}` : "") +
      (params.upstreamStatus !== undefined ? ` upstreamStatus=${params.upstreamStatus}` : "") +
      (params.detail ? ` detail=${params.detail}` : "")
  );
}

// ── SSRF guard ────────────────────────────────────────────────────────────────

function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) return true;
  const [a, b] = parts;
  return (
    a === 10 ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    a === 127 ||
    (a === 169 && b === 254) ||
    a === 0 ||
    a >= 240
  );
}

function isPrivateIPv6(ip: string): boolean {
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
 * Validates that the hostname does not point to internal/loopback/private IP addresses.
 * Uses dns.lookup (OS getaddrinfo) rather than dns.resolve (c-ares) to avoid ECONNREFUSED
 * errors on systems where local DNS stub resolvers block direct port-53 queries.
 */
async function assertSafeHost(hostname: string): Promise<void> {
  const h = hostname.toLowerCase();
  if (h === "localhost" || h.endsWith(".localhost") || h.endsWith(".local") || h.endsWith(".internal")) {
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

// ── Domain allowlist ──────────────────────────────────────────────────────────

type PlatformKey =
  | "tiktok"
  | "instagram"
  | "twitter"
  | "reddit"
  | "bandcamp"
  | "soundcloud"
  | "mediafire"
  | "pixeldrain"
  | "catbox"
  | "gdrive"
  | "unshorten";

interface AllowedPlatform {
  label: string;
  hostnames: string[];
  note: string;
  resolver: PlatformKey;
  enabled: boolean;
}

const ALLOWED_PLATFORMS: AllowedPlatform[] = [
  { label: "TikTok", hostnames: ["tiktok.com", "vm.tiktok.com", "vt.tiktok.com"], note: "Menggunakan scraper pihak ketiga; endpoint dapat berubah sewaktu-waktu.", resolver: "tiktok", enabled: true },
  { label: "Instagram", hostnames: ["instagram.com"], note: "Hanya konten publik.", resolver: "instagram", enabled: true },
  { label: "Twitter / X", hostnames: ["twitter.com", "x.com"], note: "Hanya tweet publik.", resolver: "twitter", enabled: true },
  { label: "Reddit", hostnames: ["reddit.com", "old.reddit.com"], note: "Konten publik saja.", resolver: "reddit", enabled: true },
  { label: "Bandcamp", hostnames: ["bandcamp.com"], note: "Album/track publik.", resolver: "bandcamp", enabled: true },
  { label: "SoundCloud", hostnames: ["soundcloud.com"], note: "Hanya track publik.", resolver: "soundcloud", enabled: true },
  { label: "MediaFire", hostnames: ["mediafire.com"], note: "Tautan unduhan publik.", resolver: "mediafire", enabled: true },
  { label: "Pixeldrain", hostnames: ["pixeldrain.com"], note: "File publik.", resolver: "pixeldrain", enabled: true },
  { label: "Catbox", hostnames: ["catbox.moe", "files.catbox.moe"], note: "Tautan publik.", resolver: "catbox", enabled: true },
  { label: "Google Drive", hostnames: ["drive.google.com"], note: "File/folder yang dapat diakses publik.", resolver: "gdrive", enabled: true },
  { label: "URL Shortener", hostnames: [], note: "Unshorten link pendek.", resolver: "unshorten", enabled: true },
];

function matchPlatform(hostname: string): AllowedPlatform | null {
  const h = hostname.toLowerCase().replace(/^www\./, "");
  for (const p of ALLOWED_PLATFORMS) {
    if (!p.enabled || p.resolver === "unshorten") continue;
    for (const allowed of p.hostnames) {
      const a = allowed.toLowerCase().replace(/^www\./, "");
      if (h === a || h.endsWith("." + a)) return p;
    }
  }
  return null;
}

// ── Scrapr call with timeout and fallback ─────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ScrapeFn = (url: string) => Promise<{ status: boolean; result?: any; message?: string }>;
type ScraprModule = Record<string, ScrapeFn>;

interface ScraprCallResult {
  status: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  result?: any;
  message?: string;
  category?: ErrorCategory;
  upstreamStatus?: number;
  methodUsed?: string;
}

async function callScrapr(resolver: PlatformKey, url: string, host: string): Promise<ScraprCallResult> {
  const TIMEOUT_MS = 10_000;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const scrapr = (await import("@coflyn/scrapr")) as any;

  // Instagram special handling: use fallback chain (direct -> indown -> snapsave)
  // snapinsta is deliberately excluded to avoid heavy browser automation (playwright) requirements.
  if (resolver === "instagram") {
    const methods: { name: string; fn: ScrapeFn }[] = [
      { name: "direct", fn: scrapr.instagram?.direct },
      { name: "indown", fn: scrapr.instagram?.indown },
      { name: "snapsave", fn: scrapr.instagram?.snapsave },
    ].filter((m) => typeof m.fn === "function");

    let lastError = "Gagal memproses URL Instagram.";
    let lastCategory: ErrorCategory = "no_result";
    let lastMethod = "direct";

    for (const candidate of methods) {
      lastMethod = candidate.name;
      try {
        const singleTimeout = new Promise<{ status: false; message: string }>((_, reject) =>
          setTimeout(() => reject(new Error("TIMEOUT")), 5_000)
        );
        const res = await Promise.race([candidate.fn(url), singleTimeout]);
        if (res && res.status) {
          return { ...res, methodUsed: candidate.name };
        }
        if (res && res.message) {
          lastError = res.message;
          const lower = res.message.toLowerCase();
          if (lower.includes("private") || lower.includes("could not find") || lower.includes("not found")) {
            lastCategory = "no_result";
          } else if (lower.includes("timeout")) {
            lastCategory = "timeout";
          } else {
            lastCategory = "upstream";
          }
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "";
        if (msg === "TIMEOUT") {
          lastCategory = "timeout";
          lastError = "Koneksi ke resolver Instagram melebihi batas waktu.";
        } else {
          lastCategory = "upstream";
          lastError = msg;
        }
      }
    }

    logDiagnostic({
      stage: "scrapr_instagram_fallback",
      category: lastCategory,
      host,
      method: lastMethod,
      detail: lastError,
    });

    return {
      status: false,
      category: lastCategory,
      message: lastError,
      methodUsed: lastMethod,
    };
  }

  let scrapeFn: ScrapeFn | null = null;
  let methodName = "default";
  switch (resolver) {
    case "tiktok":
      scrapeFn = scrapr.tiktok?.snaptik ?? scrapr.tiktok?.ssstik ?? Object.values(scrapr.tiktok as ScraprModule)[0];
      methodName = "tiktok.snaptik";
      break;
    case "twitter":
      scrapeFn = scrapr.twitter?.direct ?? Object.values(scrapr.twitter as ScraprModule)[0];
      methodName = "twitter";
      break;
    case "reddit":
      scrapeFn = Object.values(scrapr.reddit as ScraprModule)[0];
      methodName = "reddit";
      break;
    case "bandcamp":
      scrapeFn = scrapr.bandcamp?.direct ?? Object.values(scrapr.bandcamp as ScraprModule)[0];
      methodName = "bandcamp";
      break;
    case "soundcloud":
      scrapeFn = Object.values(scrapr.soundcloud as ScraprModule)[0];
      methodName = "soundcloud";
      break;
    case "mediafire":
      scrapeFn = scrapr.resolver?.mediafire;
      methodName = "mediafire";
      break;
    case "pixeldrain":
      scrapeFn = scrapr.resolver?.pixeldrain;
      methodName = "pixeldrain";
      break;
    case "catbox":
      scrapeFn = scrapr.resolver?.catbox;
      methodName = "catbox";
      break;
    case "gdrive":
      scrapeFn = scrapr.resolver?.gdrive;
      methodName = "gdrive";
      break;
    default:
      scrapeFn = scrapr.resolver?.unshorten;
      methodName = "unshorten";
      break;
  }

  if (!scrapeFn) {
    logDiagnostic({ stage: "scrapr_resolve", category: "validation", host, method: methodName, detail: "resolver_unavailable" });
    return { status: false, category: "validation", message: "Resolver tidak tersedia untuk platform ini." };
  }

  const timeout = new Promise<{ status: false; category: ErrorCategory; message: string }>((_, reject) =>
    setTimeout(() => reject(new Error("TIMEOUT")), TIMEOUT_MS)
  );

  try {
    const res = await Promise.race([scrapeFn(url), timeout]);
    return { ...res, methodUsed: methodName };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    if (msg === "TIMEOUT") {
      return { status: false, category: "timeout", message: "Waktu permintaan habis (timeout).", methodUsed: methodName };
    }
    return { status: false, category: "upstream", message: msg || "Gagal menghubungi upstream.", methodUsed: methodName };
  }
}

// ── Sanitise result ───────────────────────────────────────────────────────────

function sanitiseResult(raw: unknown): unknown {
  if (typeof raw !== "object" || raw === null) return raw;
  const safe: Record<string, unknown> = {};
  const blocklist = new Set(["cookie", "token", "auth", "secret", "key", "password", "credential", "sessionid"]);
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (blocklist.has(k.toLowerCase())) continue;
    safe[k] = typeof v === "object" ? sanitiseResult(v) : v;
  }
  return safe;
}

// ── Handlers ──────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: { url?: string };
  try {
    body = await req.json();
  } catch {
    logDiagnostic({ stage: "body_parse", category: "validation", host: "unknown" });
    return NextResponse.json(
      { status: false, errorCategory: "validation", message: "Request tidak valid. Harap kirim payload JSON." },
      { status: 400 }
    );
  }

  const rawUrl = (body.url ?? "").trim();
  if (!rawUrl) {
    logDiagnostic({ stage: "url_validation", category: "validation", host: "empty" });
    return NextResponse.json(
      { status: false, errorCategory: "validation", message: "URL tidak boleh kosong." },
      { status: 400 }
    );
  }

  let parsed: URL;
  try {
    const candidate = rawUrl.startsWith("http://") || rawUrl.startsWith("https://") ? rawUrl : "https://" + rawUrl;
    parsed = new URL(candidate);
    if (!parsed.hostname.includes(".")) {
      throw new Error("INVALID_HOST");
    }
  } catch {
    logDiagnostic({ stage: "url_parse", category: "validation", host: "invalid_format" });
    return NextResponse.json(
      { status: false, errorCategory: "validation", message: "Format URL tidak valid." },
      { status: 400 }
    );
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    logDiagnostic({ stage: "protocol_check", category: "validation", host: parsed.hostname });
    return NextResponse.json(
      { status: false, errorCategory: "validation", message: "Hanya URL HTTP/HTTPS yang diizinkan." },
      { status: 400 }
    );
  }

  // 1. Allowlist check first
  const platform = matchPlatform(parsed.hostname);
  if (!platform) {
    logDiagnostic({ stage: "platform_match", category: "validation", host: parsed.hostname });
    return NextResponse.json(
      {
        status: false,
        errorCategory: "validation",
        message: `Platform "${parsed.hostname}" belum didukung atau tidak ada di allowlist.`,
      },
      { status: 400 }
    );
  }

  // 2. SSRF & DNS check on allowed host
  try {
    await assertSafeHost(parsed.hostname);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    if (msg === "SSRF_BLOCKED") {
      logDiagnostic({ stage: "ssrf_guard", category: "ssrf", host: parsed.hostname });
      return NextResponse.json(
        {
          status: false,
          errorCategory: "ssrf",
          message: "URL mengarah ke alamat jaringan lokal atau privat yang diblokir demi keamanan.",
        },
        { status: 403 }
      );
    }
    logDiagnostic({ stage: "dns_lookup", category: "dns", host: parsed.hostname, detail: msg });
    return NextResponse.json(
      {
        status: false,
        errorCategory: "dns",
        message: "Host tidak dapat dijangkau atau domain tidak ditemukan di DNS.",
      },
      { status: 404 }
    );
  }

  const resolverKey: PlatformKey = platform.resolver;

  let scraprResult: ScraprCallResult;
  try {
    scraprResult = await callScrapr(resolverKey, rawUrl, parsed.hostname);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "unknown";
    if (msg === "TIMEOUT") {
      logDiagnostic({ stage: "resolver_timeout", category: "timeout", host: parsed.hostname, method: resolverKey });
      return NextResponse.json(
        { status: false, errorCategory: "timeout", message: "Waktu permintaan habis (timeout). Coba lagi nanti." },
        { status: 504 }
      );
    }
    logDiagnostic({ stage: "resolver_exception", category: "upstream", host: parsed.hostname, method: resolverKey, detail: msg });
    return NextResponse.json(
      { status: false, errorCategory: "upstream", message: "Gagal memproses URL pada layanan resolver upstream." },
      { status: 502 }
    );
  }

  if (!scraprResult.status) {
    const cat = scraprResult.category ?? "no_result";
    logDiagnostic({
      stage: "resolver_no_result",
      category: cat,
      host: parsed.hostname,
      method: scraprResult.methodUsed,
      detail: scraprResult.message,
    });

    if (cat === "timeout") {
      return NextResponse.json(
        { status: false, errorCategory: "timeout", message: "Waktu permintaan habis (timeout). Coba lagi nanti." },
        { status: 504 }
      );
    }

    if (cat === "no_result") {
      return NextResponse.json(
        {
          status: false,
          errorCategory: "no_result",
          message:
            "Resolver tidak memperoleh hasil. Konten mungkin bersifat privat, telah dihapus, atau dibatasi oleh platform asal.",
        },
        { status: 422 }
      );
    }

    return NextResponse.json(
      {
        status: false,
        errorCategory: "upstream",
        message:
          scraprResult.message || "Layanan resolver pihak ketiga sedang tidak dapat dijangkau. Coba beberapa saat lagi.",
      },
      { status: 502 }
    );
  }

  return NextResponse.json({
    status: true,
    platform: platform?.label ?? "URL",
    platformNote: platform?.note ?? "",
    result: sanitiseResult(scraprResult.result),
  });
}

export async function GET(): Promise<NextResponse> {
  const list = ALLOWED_PLATFORMS.filter((p) => p.enabled && p.resolver !== "unshorten").map((p) => ({
    label: p.label,
    note: p.note,
    hostnames: p.hostnames,
  }));
  return NextResponse.json({ platforms: list });
}

