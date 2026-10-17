/**
 * /api/media/resolve - Secure server-side Media URL resolver
 * Security: Node.js runtime only (default for App Router Route Handlers),
 * SSRF guard via OS DNS lookup (getaddrinfo), domain allowlist, timeout, no stack trace leakage.
 */

import { NextRequest, NextResponse } from "next/server";
import { assertSafeHost, assertSafePort } from "@/app/lib/ssrfGuard";
import { signProxyUrl } from "@/app/lib/proxySignature";
import { checkRateLimit, getClientIp } from "@/app/lib/rateLimiter";
import { isAllowedMediaHost, isSafeMediaUrlToSign } from "@/app/lib/mediaAllowlist";

// ── Types ─────────────────────────────────────────────────────────────────────

export type ErrorCategory =
  | "validation"
  | "dns"
  | "ssrf"
  | "timeout"
  | "upstream"
  | "no_result"
  | "rate_limit";

export interface ResolveErrorResult {
  status: false;
  errorCategory: ErrorCategory;
  message: string;
  upstreamStatus?: number;
}

// ── Safe diagnostic logger ────────────────────────────────────────────────────
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

// ── Domain allowlist ──────────────────────────────────────────────────────────

type PlatformKey =
  | "youtube"
  | "spotify"
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
  { label: "YouTube", hostnames: ["youtube.com", "youtu.be", "m.youtube.com"], note: "Video & audio YouTube publik (MP4 720p & MP3 320kbps).", resolver: "youtube", enabled: true },
  { label: "Spotify", hostnames: ["spotify.com", "open.spotify.com"], note: "Track Spotify publik.", resolver: "spotify", enabled: true },
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

async function callScrapr(
  resolver: PlatformKey,
  url: string,
  host: string,
  format?: "best" | "mp3" | "mp4"
): Promise<ScraprCallResult> {
  const TIMEOUT_MS = 15_000;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const scrapr = (await import("@coflyn/scrapr")) as any;

  // 1. YouTube specialized resolver with format negotiation and resilient fallback
  if (resolver === "youtube") {
    const ytmp3 = scrapr.youtube?.ytmp3;
    const ytmp3gg = scrapr.youtube?.ytmp3gg;

    if (!ytmp3 && !ytmp3gg) {
      return { status: false, category: "validation", message: "Modul YouTube resolver tidak tersedia." };
    }

    try {
      if (format === "mp3") {
        if (ytmp3) {
          const res = await ytmp3(url, "mp3");
          if (res && res.status) return { ...res, methodUsed: "youtube.ytmp3.mp3" };
        }
        if (ytmp3gg) {
          const res2 = await ytmp3gg(url);
          if (res2 && res2.status) return { ...res2, methodUsed: "youtube.ytmp3gg" };
        }
        return {
          status: false,
          category: "no_result",
          message: "Gagal memperoleh stream audio MP3 YouTube. Konten mungkin dibatasi usia, regional, atau berstatus privat.",
          methodUsed: "youtube.ytmp3",
        };
      }

      if (format === "mp4") {
        if (ytmp3) {
          const res = await ytmp3(url, "mp4");
          if (res && res.status) return { ...res, methodUsed: "youtube.ytmp3.mp4" };
        }
        return {
          status: false,
          category: "no_result",
          message: "Gagal memperoleh stream video MP4 YouTube. Konten mungkin dibatasi usia, regional, atau berstatus privat.",
          methodUsed: "youtube.ytmp3",
        };
      }

      // format === "best" or undefined: attempt both MP4 and MP3 in parallel
      const [resMp4, resMp3] = await Promise.allSettled([
        ytmp3 ? ytmp3(url, "mp4") : Promise.resolve(null),
        ytmp3 ? ytmp3(url, "mp3") : Promise.resolve(null),
      ]);

      const valMp4 = resMp4.status === "fulfilled" && resMp4.value?.status ? resMp4.value : null;
      const valMp3 = resMp3.status === "fulfilled" && resMp3.value?.status ? resMp3.value : null;

      if (valMp4 || valMp3) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const baseResult = ((valMp4?.result || valMp3?.result || {}) as Record<string, any>);
        const mp4Downloads = Array.isArray(valMp4?.result?.downloads) ? valMp4.result.downloads : [];
        const mp3Downloads = Array.isArray(valMp3?.result?.downloads) ? valMp3.result.downloads : [];

        // Combine downloads with unique URLs
        const seenUrls = new Set<string>();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const combinedDownloads: any[] = [];
        for (const dl of [...mp4Downloads, ...mp3Downloads]) {
          if (dl && dl.url && !seenUrls.has(dl.url)) {
            seenUrls.add(dl.url);
            combinedDownloads.push(dl);
          }
        }

        return {
          status: true,
          result: {
            ...baseResult,
            downloads: combinedDownloads,
          },
          methodUsed: "youtube.ytmp3.combined",
        };
      }

      // Fallback to ytmp3gg
      if (ytmp3gg) {
        const resGg = await ytmp3gg(url);
        if (resGg && resGg.status) return { ...resGg, methodUsed: "youtube.ytmp3gg" };
      }

      return {
        status: false,
        category: "no_result",
        message: "Tidak dapat mengambil media YouTube. Video mungkin dibatasi hak cipta, usia, atau berstatus privat.",
        methodUsed: "youtube.ytmp3",
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      return { status: false, category: "upstream", message: msg || "Gagal memproses YouTube.", methodUsed: "youtube" };
    }
  }

  // 2. Spotify specialized resolver
  if (resolver === "spotify") {
    const methods: { name: string; fn: ScrapeFn }[] = [
      { name: "spotmate", fn: scrapr.spotify?.spotmate },
      { name: "soundloaders", fn: scrapr.spotify?.soundloaders },
      { name: "spotidown", fn: scrapr.spotify?.spotidown },
      { name: "spotisaver", fn: scrapr.spotify?.spotisaver },
    ].filter((m) => typeof m.fn === "function");

    let lastError = "Gagal memproses track Spotify.";
    let lastMethod = "spotmate";

    for (const candidate of methods) {
      lastMethod = candidate.name;
      try {
        const singleTimeout = new Promise<{ status: false; message: string }>((_, reject) =>
          setTimeout(() => reject(new Error("TIMEOUT")), 8_000)
        );
        const res = await Promise.race([candidate.fn(url), singleTimeout]);
        if (res && res.status) {
          return { ...res, methodUsed: `spotify.${candidate.name}` };
        }
        if (res?.message) lastError = res.message;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "";
        if (msg) lastError = msg;
      }
    }

    return {
      status: false,
      category: "no_result",
      message: lastError,
      methodUsed: `spotify.${lastMethod}`,
    };
  }

  // 3. TikTok with fallback chain (snaptik -> tiktokio -> ssstik -> savetik)
  if (resolver === "tiktok") {
    const methods: { name: string; fn: ScrapeFn }[] = [
      { name: "snaptik", fn: scrapr.tiktok?.snaptik },
      { name: "tiktokio", fn: scrapr.tiktok?.tiktokio },
      { name: "ssstik", fn: scrapr.tiktok?.ssstik },
      { name: "savetik", fn: scrapr.tiktok?.savetik },
    ].filter((m) => typeof m.fn === "function");

    let lastError = "Gagal memproses URL TikTok.";
    let lastMethod = "snaptik";

    for (const candidate of methods) {
      lastMethod = candidate.name;
      try {
        const singleTimeout = new Promise<{ status: false; message: string }>((_, reject) =>
          setTimeout(() => reject(new Error("TIMEOUT")), 8_000)
        );
        const res = await Promise.race([candidate.fn(url), singleTimeout]);
        if (res && res.status) {
          return { ...res, methodUsed: `tiktok.${candidate.name}` };
        }
        if (res?.message) lastError = res.message;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "";
        if (msg) lastError = msg;
      }
    }

    return {
      status: false,
      category: "no_result",
      message: lastError,
      methodUsed: `tiktok.${lastMethod}`,
    };
  }

  // 4. Instagram fallback chain (direct -> indown -> snapsave)
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

  // 5. Standard platform resolvers
  let scrapeFn: ScrapeFn | null = null;
  let methodName = "default";
  switch (resolver) {
    case "twitter":
      scrapeFn = scrapr.twitter?.direct ?? scrapr.twitter?.tweeload ?? Object.values(scrapr.twitter as ScraprModule)[0];
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
      scrapeFn = scrapr.soundcloud?.klickaud ?? Object.values(scrapr.soundcloud as ScraprModule)[0];
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
  if (Array.isArray(raw)) {
    return raw.map((item) => sanitiseResult(item));
  }
  const safe: Record<string, unknown> = {};
  const blocklist = new Set(["cookie", "token", "auth", "secret", "key", "password", "credential", "sessionid"]);
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (blocklist.has(k.toLowerCase())) continue;
    safe[k] = typeof v === "object" ? sanitiseResult(v) : v;
  }
  return safe;
}

function safeSign(urlStr: string): { token?: string; expiresAt?: number } {
  try {
    const sig = signProxyUrl(urlStr);
    return { token: sig.token, expiresAt: sig.expiresAt };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "CONFIG_ERROR";
    console.error(`[media/resolve] Failed to sign URL: ${msg}`);
    return {};
  }
}

function attachProxySignatures(raw: unknown): unknown {
  if (typeof raw !== "object" || raw === null) return raw;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const res = { ...(raw as Record<string, any>) };

  // 1. If downloads is missing or empty, extract from alternative fields
  if (!res.downloads || (Array.isArray(res.downloads) && res.downloads.length === 0)) {
    const fallbackUrl =
      (typeof res.url === "string" && res.url.startsWith("http") ? res.url : null) ||
      (typeof res.audio === "string" && res.audio.startsWith("http") ? res.audio : null) ||
      (typeof res.audio_url === "string" && res.audio_url.startsWith("http") ? res.audio_url : null) ||
      (typeof res.video === "string" && res.video.startsWith("http") ? res.video : null) ||
      (typeof res.download_url === "string" && res.download_url.startsWith("http") ? res.download_url : null) ||
      (typeof res.download === "string" && res.download.startsWith("http") ? res.download : null);

    if (fallbackUrl && isSafeMediaUrlToSign(fallbackUrl)) {
      const sig = safeSign(fallbackUrl);
      if (sig.token && sig.expiresAt) {
        const isAudio = /audio|mp3|m4a|wav/i.test(fallbackUrl);
        res.downloads = [
          {
            type: isAudio ? "audio" : "video",
            quality: "Direct Source",
            url: fallbackUrl,
            label: isAudio ? "Audio Stream" : "Video Stream",
            proxyToken: sig.token,
            proxyExpiresAt: sig.expiresAt,
          },
        ];
      }
    }
  }

  // 2. Sign all items in downloads
  if (res.downloads) {
    if (Array.isArray(res.downloads)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      res.downloads = res.downloads.map((dl: any) => {
        if (!dl || typeof dl !== "object") return dl;
        const targetUrl = dl.url || dl.link || dl.download;
        if (typeof targetUrl === "string" && isSafeMediaUrlToSign(targetUrl)) {
          const sig = safeSign(targetUrl);
          if (sig.token && sig.expiresAt) {
            return {
              ...dl,
              url: targetUrl,
              proxyToken: sig.token,
              proxyExpiresAt: sig.expiresAt,
            };
          }
        }
        return dl;
      });
    } else if (typeof res.downloads === "object") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const copy: Record<string, any> = {};
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const [k, dl] of Object.entries(res.downloads as Record<string, any>)) {
        if (dl && typeof dl === "object") {
          const targetUrl = dl.url || dl.link || dl.download;
          if (typeof targetUrl === "string" && isSafeMediaUrlToSign(targetUrl)) {
            const sig = safeSign(targetUrl);
            if (sig.token && sig.expiresAt) {
              copy[k] = {
                ...dl,
                url: targetUrl,
                proxyToken: sig.token,
                proxyExpiresAt: sig.expiresAt,
              };
              continue;
            }
          }
        }
        copy[k] = dl;
      }
      res.downloads = copy;
    }
  }

  // 3. Also sign top-level res.url if present and safe
  if (typeof res.url === "string" && isSafeMediaUrlToSign(res.url)) {
    const sig = safeSign(res.url);
    if (sig.token && sig.expiresAt) {
      res.proxyToken = sig.token;
      res.proxyExpiresAt = sig.expiresAt;
    }
  }

  return res;
}

// ── Handlers ──────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  const clientIp = getClientIp(req.headers);

  // 1. Rate Limiting Check (20 requests per minute per IP)
  const rateLimit = checkRateLimit(`${clientIp}:resolve_media`, 20, 60);
  if (!rateLimit.success) {
    return NextResponse.json(
      {
        status: false,
        errorCategory: "rate_limit",
        message: `Terlalu banyak permintaan analisis media. Harap tunggu ${rateLimit.resetSeconds} detik sebelum mencoba lagi.`,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.resetSeconds),
          "X-RateLimit-Limit": String(rateLimit.limit),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  let body: { url?: string; format?: "best" | "mp3" | "mp4" };
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
  let candidate: string;
  try {
    candidate = rawUrl.startsWith("http://") || rawUrl.startsWith("https://") ? rawUrl : "https://" + rawUrl;
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

  try {
    assertSafePort(parsed.port);
  } catch {
    return NextResponse.json(
      { status: false, errorCategory: "validation", message: "Port tujuan tidak diizinkan. Hanya port standar 80/443 yang didukung." },
      { status: 400 }
    );
  }

  // 2. Direct Media URL handling with allowlist check, SSRF validation, and signed token
  const isDirectMedia = /\.(mp3|wav|ogg|m4a|aac|flac|mp4|webm)(\?.*)?$/i.test(parsed.pathname);
  if (isDirectMedia) {
    if (!isAllowedMediaHost(parsed.hostname)) {
      logDiagnostic({ stage: "direct_media_allowlist", category: "validation", host: parsed.hostname });
      return NextResponse.json(
        {
          status: false,
          errorCategory: "validation",
          message: `Domain "${parsed.hostname}" tidak diizinkan untuk unduhan direct media. Hanya platform yang didukung dan sumber media terpercaya (misal archive.org, wikimedia.org, raw.githubusercontent.com) yang dapat diunduh.`,
        },
        { status: 403 }
      );
    }

    try {
      await assertSafeHost(parsed.hostname);
      const isAudio = /\.(mp3|wav|ogg|m4a|aac|flac)(\?.*)?$/i.test(parsed.pathname);
      const parts = parsed.pathname.split("/").filter(Boolean);
      const rawName = decodeURIComponent(parts[parts.length - 1] || "media_file");
      const sig = signProxyUrl(candidate);

      return NextResponse.json({
        status: true,
        platform: "Direct Media URL",
        platformNote: "Tautan berkas media langsung terverifikasi via proxy server aman.",
        result: {
          title: rawName,
          downloads: [
            {
              type: isAudio ? "audio" : "video",
              quality: "Direct Source",
              url: candidate,
              label: isAudio ? "Audio Stream" : "Video Stream",
              proxyToken: sig.token,
              proxyExpiresAt: sig.expiresAt,
            },
          ],
        },
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("SERVER_CONFIG_ERROR")) {
        return NextResponse.json(
          {
            status: false,
            errorCategory: "upstream",
            message: "Layanan penandatanganan proxy belum dikonfigurasi dengan benar di server.",
          },
          { status: 500 }
        );
      }
      if (msg === "SSRF_BLOCKED") {
        return NextResponse.json(
          {
            status: false,
            errorCategory: "ssrf",
            message: "URL mengarah ke alamat jaringan lokal atau privat yang diblokir demi keamanan.",
          },
          { status: 403 }
        );
      }
      return NextResponse.json(
        { status: false, errorCategory: "dns", message: "Host direct media tidak dapat dijangkau di DNS." },
        { status: 404 }
      );
    }
  }

  // 3. Allowlist check for platform URLs
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

  // 4. SSRF & DNS check on allowed host
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
    scraprResult = await callScrapr(resolverKey, rawUrl, parsed.hostname, body.format);
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
    result: attachProxySignatures(sanitiseResult(scraprResult.result)),
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

