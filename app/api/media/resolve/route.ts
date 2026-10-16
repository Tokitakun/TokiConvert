/**
 * /api/media/resolve - Secure server-side Media URL resolver
 * Security: Node.js runtime only (default for App Router Route Handlers),
 * SSRF guard, domain allowlist, 10s timeout, no stack trace leakage.
 */

import { NextRequest, NextResponse } from "next/server";
import dns from "dns/promises";
import net from "net";

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

async function assertSafeHost(hostname: string): Promise<void> {
  const h = hostname.toLowerCase();
  if (h === "localhost" || h.endsWith(".localhost") || h.endsWith(".local")) throw new Error("SSRF_BLOCKED");
  if (net.isIPv4(h)) { if (isPrivateIPv4(h)) throw new Error("SSRF_BLOCKED"); return; }
  if (net.isIPv6(h)) { if (isPrivateIPv6(h)) throw new Error("SSRF_BLOCKED"); return; }
  try {
    const addrs = await dns.resolve(hostname);
    for (const addr of addrs) {
      if (net.isIPv4(addr) && isPrivateIPv4(addr)) throw new Error("SSRF_BLOCKED");
      if (net.isIPv6(addr) && isPrivateIPv6(addr)) throw new Error("SSRF_BLOCKED");
    }
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "SSRF_BLOCKED") throw err;
    throw new Error("DNS_RESOLVE_FAILED");
  }
}

// ── Domain allowlist ──────────────────────────────────────────────────────────

type PlatformKey = "tiktok"|"instagram"|"twitter"|"reddit"|"bandcamp"|"soundcloud"|"mediafire"|"pixeldrain"|"catbox"|"gdrive"|"unshorten";

interface AllowedPlatform {
  label: string;
  hostnames: string[];
  note: string;
  resolver: PlatformKey;
  enabled: boolean;
}

const ALLOWED_PLATFORMS: AllowedPlatform[] = [
  { label: "TikTok", hostnames: ["tiktok.com","vm.tiktok.com","vt.tiktok.com"], note: "Menggunakan scraper pihak ketiga; endpoint dapat berubah sewaktu-waktu.", resolver: "tiktok", enabled: true },
  { label: "Instagram", hostnames: ["instagram.com"], note: "Hanya konten publik.", resolver: "instagram", enabled: true },
  { label: "Twitter / X", hostnames: ["twitter.com","x.com"], note: "Hanya tweet publik.", resolver: "twitter", enabled: true },
  { label: "Reddit", hostnames: ["reddit.com","old.reddit.com"], note: "Konten publik saja.", resolver: "reddit", enabled: true },
  { label: "Bandcamp", hostnames: ["bandcamp.com"], note: "Album/track publik.", resolver: "bandcamp", enabled: true },
  { label: "SoundCloud", hostnames: ["soundcloud.com"], note: "Hanya track publik.", resolver: "soundcloud", enabled: true },
  { label: "MediaFire", hostnames: ["mediafire.com"], note: "Tautan unduhan publik.", resolver: "mediafire", enabled: true },
  { label: "Pixeldrain", hostnames: ["pixeldrain.com"], note: "File publik.", resolver: "pixeldrain", enabled: true },
  { label: "Catbox", hostnames: ["catbox.moe","files.catbox.moe"], note: "Tautan publik.", resolver: "catbox", enabled: true },
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

// ── Scrapr call with timeout ──────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ScrapeFn = (url: string) => Promise<{ status: boolean; result?: any; message?: string }>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ScraprModule = Record<string, ScrapeFn>;

async function callScrapr(resolver: PlatformKey, url: string) {
  const TIMEOUT_MS = 10_000;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const scrapr = (await import("@coflyn/scrapr")) as any;

  let scrapeFn: ScrapeFn | null = null;
  switch (resolver) {
    case "tiktok":      scrapeFn = scrapr.tiktok?.snaptik ?? scrapr.tiktok?.ssstik ?? Object.values(scrapr.tiktok as ScraprModule)[0]; break;
    case "instagram":   scrapeFn = Object.values(scrapr.instagram as ScraprModule)[0]; break;
    case "twitter":     scrapeFn = Object.values(scrapr.twitter as ScraprModule)[0]; break;
    case "reddit":      scrapeFn = Object.values(scrapr.reddit as ScraprModule)[0]; break;
    case "bandcamp":    scrapeFn = Object.values(scrapr.bandcamp as ScraprModule)[0]; break;
    case "soundcloud":  scrapeFn = Object.values(scrapr.soundcloud as ScraprModule)[0]; break;
    case "mediafire":   scrapeFn = scrapr.resolver?.mediafire; break;
    case "pixeldrain":  scrapeFn = scrapr.resolver?.pixeldrain; break;
    case "catbox":      scrapeFn = scrapr.resolver?.catbox; break;
    case "gdrive":      scrapeFn = scrapr.resolver?.gdrive; break;
    default:            scrapeFn = scrapr.resolver?.unshorten; break;
  }
  if (!scrapeFn) return { status: false, message: "Resolver tidak tersedia." };

  const timeout = new Promise<{ status: false; message: string }>((_, reject) =>
    setTimeout(() => reject(new Error("TIMEOUT")), TIMEOUT_MS)
  );
  return Promise.race([scrapeFn(url), timeout]);
}

// ── Sanitise result ───────────────────────────────────────────────────────────

function sanitiseResult(raw: unknown): unknown {
  if (typeof raw !== "object" || raw === null) return raw;
  const safe: Record<string, unknown> = {};
  const blocklist = new Set(["cookie","token","auth","secret","key","password","credential"]);
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (blocklist.has(k.toLowerCase())) continue;
    safe[k] = typeof v === "object" ? sanitiseResult(v) : v;
  }
  return safe;
}

// ── Handlers ──────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: { url?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ status: false, message: "Request tidak valid." }, { status: 400 }); }

  const rawUrl = (body.url ?? "").trim();
  if (!rawUrl) return NextResponse.json({ status: false, message: "URL tidak boleh kosong." }, { status: 400 });

  let parsed: URL;
  try { parsed = new URL(rawUrl.startsWith("http") ? rawUrl : "https://" + rawUrl); }
  catch { return NextResponse.json({ status: false, message: "Format URL tidak valid." }, { status: 400 }); }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return NextResponse.json({ status: false, message: "Hanya URL HTTP/HTTPS yang diizinkan." }, { status: 400 });
  }

  try { await assertSafeHost(parsed.hostname); }
  catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    if (msg === "SSRF_BLOCKED") return NextResponse.json({ status: false, message: "URL mengarah ke alamat jaringan yang tidak diizinkan." }, { status: 403 });
    return NextResponse.json({ status: false, message: "Gagal memvalidasi host URL." }, { status: 400 });
  }

  let platform = matchPlatform(parsed.hostname);
  let resolverKey: PlatformKey = "unshorten";
  if (platform) { resolverKey = platform.resolver; }
  else { platform = ALLOWED_PLATFORMS.find((p) => p.resolver === "unshorten") ?? null; }

  let scraprResult: { status: boolean; result?: unknown; message?: string };
  try { scraprResult = await callScrapr(resolverKey, rawUrl); }
  catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "unknown";
    if (msg === "TIMEOUT") return NextResponse.json({ status: false, message: "Resolver timeout. Coba lagi nanti." }, { status: 504 });
    console.error("[media/resolve] scraper error:", err);
    return NextResponse.json({ status: false, message: "Gagal memproses URL. Coba lagi nanti." }, { status: 502 });
  }

  if (!scraprResult.status) {
    return NextResponse.json({ status: false, message: "Platform tidak dapat di-resolve saat ini. Coba lagi nanti." }, { status: 422 });
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
