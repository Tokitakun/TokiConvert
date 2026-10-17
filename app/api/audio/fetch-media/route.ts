/**
 * /api/audio/fetch-media - Secure media fetch proxy for direct audio/video URLs.
 * Features:
 * - Anti-SSRF with Socket DNS Pinning (eliminates TOCTOU / DNS Rebinding)
 * - Open Proxy Prevention via HMAC-SHA256 Signed URLs or trusted platform CDN allowlist
 * - Rate Limiting & Concurrent Stream Protection per client IP
 * - Strict Port & Protocol validation (HTTP/HTTPS, port 80/443 only)
 * - Media type validation (rejects HTML/XML/JSON pages and non-media formats)
 * - 50 MB maximum stream size limit with chunk byte tracking
 * - 15-second request timeout
 * - No sensitive token or credential leakage
 */

import { NextRequest, NextResponse } from "next/server";
import { Readable, Transform } from "node:stream";
import { assertSafeHost, assertSafePort } from "@/app/lib/ssrfGuard";
import { safePinnedHttpFetch } from "@/app/lib/safeHttp";
import { verifyProxyUrl } from "@/app/lib/proxySignature";
import {
  checkRateLimit,
  acquireStreamSlot,
  releaseStreamSlot,
  getClientIp,
} from "@/app/lib/rateLimiter";
import { isAllowedMediaHost } from "@/app/lib/mediaAllowlist";

const MAX_BYTES = 50 * 1024 * 1024; // 50 MB
const TIMEOUT_MS = 15_000;

const ALLOWED_MEDIA_EXTENSIONS = [
  ".mp3",
  ".wav",
  ".ogg",
  ".m4a",
  ".aac",
  ".flac",
  ".mp4",
  ".webm",
  ".opus",
  ".wma",
];



function sanitizeFilename(raw: string): string {
  const cleaned = raw.replace(/[^\w\d_.-]/g, "_").slice(0, 80);
  return cleaned || `media_${Date.now()}`;
}

export async function POST(req: NextRequest): Promise<Response> {
  const clientIp = getClientIp(req.headers);

  // 1. Rate Limiting Check (30 requests per minute per IP)
  const rateLimit = checkRateLimit(`${clientIp}:fetch_media`, 30, 60);
  if (!rateLimit.success) {
    return NextResponse.json(
      {
        status: false,
        message: `Terlalu banyak permintaan. Harap tunggu ${rateLimit.resetSeconds} detik sebelum mencoba lagi.`,
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

  // 2. Parse payload
  let body: { url?: string; token?: string; expiresAt?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { status: false, message: "Payload JSON tidak valid." },
      { status: 400 }
    );
  }

  const rawUrl = (body.url || "").trim();
  if (!rawUrl) {
    return NextResponse.json(
      { status: false, message: "URL media tidak boleh kosong." },
      { status: 400 }
    );
  }

  let parsed: URL;
  try {
    const candidate =
      rawUrl.startsWith("http://") || rawUrl.startsWith("https://")
        ? rawUrl
        : `https://${rawUrl}`;
    parsed = new URL(candidate);
    if (!parsed.hostname.includes(".")) {
      throw new Error("INVALID_HOST");
    }
  } catch {
    return NextResponse.json(
      { status: false, message: "Format URL tidak valid." },
      { status: 400 }
    );
  }

  // 3. Protocol & Port Validation
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return NextResponse.json(
      { status: false, message: "Hanya protokol HTTP/HTTPS yang didukung." },
      { status: 400 }
    );
  }

  try {
    assertSafePort(parsed.port);
  } catch {
    return NextResponse.json(
      { status: false, message: "Port tujuan tidak diizinkan. Hanya port standar 80/443 yang didukung." },
      { status: 400 }
    );
  }

  // 4. Open Proxy Prevention: Strictly require valid HMAC signature AND verified media host
  const isSigned = verifyProxyUrl(rawUrl, body.token, body.expiresAt);
  const isAllowedHost = isAllowedMediaHost(parsed.hostname);

  if (!isSigned || !isAllowedHost) {
    return NextResponse.json(
      {
        status: false,
        message:
          "Akses ditolak: Proxy hanya melayani berkas media yang diverifikasi oleh sistem (Open Proxy Prevention).",
      },
      { status: 403 }
    );
  }

  // 5. Initial SSRF guard
  try {
    await assertSafeHost(parsed.hostname);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    if (msg === "SSRF_BLOCKED") {
      return NextResponse.json(
        {
          status: false,
          message:
            "Akses ditolak: Alamat tujuan mengarah ke jaringan lokal atau privat (SSRF Guard).",
        },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { status: false, message: "Domain tujuan tidak dapat dijangkau atau tidak valid di DNS." },
      { status: 404 }
    );
  }

  // 6. Concurrent active download limit (max 3 streams per client IP)
  const slotAcquired = acquireStreamSlot(clientIp, 3);
  if (!slotAcquired) {
    return NextResponse.json(
      {
        status: false,
        message: "Batas unduhan bersamaan tercapai (maks 3 unduhan). Harap tunggu hingga unduhan selesai.",
      },
      { status: 429 }
    );
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let slotReleased = false;
  const releaseSlotOnce = () => {
    if (!slotReleased) {
      slotReleased = true;
      releaseStreamSlot(clientIp);
      clearTimeout(timeoutId);
    }
  };

  try {
    let finalTargetUrl = parsed;
    let reportedType = "";
    let reportedLength = 0;

    // Pre-flight check via HEAD using pinned safe fetch
    try {
      const headOutcome = await safePinnedHttpFetch(parsed, {
        method: "HEAD",
        headers: {
          "User-Agent": "TokiConvert/1.0 (Media Processor; +https://tokiconvert.app)",
        },
        signal: controller.signal,
        timeoutMs: TIMEOUT_MS,
      });

      finalTargetUrl = headOutcome.finalUrl;
      const headStatus = headOutcome.statusCode;
      const headHeaders = headOutcome.headers;
      headOutcome.body.resume(); // consume/close HEAD stream

      if (headStatus >= 200 && headStatus < 300) {
        reportedType = String(headHeaders["content-type"] || "").toLowerCase();
        reportedLength = parseInt(String(headHeaders["content-length"] || "0"), 10);

        if (
          reportedType.includes("text/html") ||
          reportedType.includes("application/xhtml") ||
          reportedType.includes("application/json") ||
          reportedType.includes("text/xml")
        ) {
          releaseSlotOnce();
          return NextResponse.json(
            {
              status: false,
              message: "URL ini mengarah ke halaman web atau data teks, bukan file media langsung.",
            },
            { status: 400 }
          );
        }

        if (reportedLength > MAX_BYTES) {
          releaseSlotOnce();
          return NextResponse.json(
            {
              status: false,
              message: `Ukuran file melebihi batas 50 MB (${(reportedLength / (1024 * 1024)).toFixed(1)} MB).`,
            },
            { status: 413 }
          );
        }
      }
    } catch (headErr: unknown) {
      const msg = headErr instanceof Error ? headErr.message : "";
      if (
        msg === "SSRF_BLOCKED" ||
        msg === "TOO_MANY_REDIRECTS" ||
        msg === "INVALID_PROTOCOL" ||
        msg === "REDIRECT_NO_LOCATION" ||
        msg === "INVALID_PORT"
      ) {
        releaseSlotOnce();
        if (msg === "SSRF_BLOCKED") {
          return NextResponse.json(
            {
              status: false,
              message:
                "Akses ditolak: Alamat tujuan mengarah ke jaringan lokal atau privat (SSRF Guard).",
            },
            { status: 403 }
          );
        }
        return NextResponse.json(
          { status: false, message: "URL tidak valid atau memiliki pengalihan (redirect) berlebih." },
          { status: 400 }
        );
      }
      // Fallback to GET on non-security HEAD errors (e.g. 405 Method Not Allowed)
    }

    // Fetch the media stream with GET using pinned safe fetch
    const getOutcome = await safePinnedHttpFetch(finalTargetUrl, {
      method: "GET",
      headers: {
        "User-Agent": "TokiConvert/1.0 (Media Processor; +https://tokiconvert.app)",
      },
      signal: controller.signal,
      timeoutMs: TIMEOUT_MS,
    });

    if (getOutcome.statusCode < 200 || getOutcome.statusCode >= 300) {
      getOutcome.body.resume();
      releaseSlotOnce();
      return NextResponse.json(
        {
          status: false,
          message: `Server asal menolak permintaan dengan status ${getOutcome.statusCode} (${getOutcome.statusMessage}).`,
        },
        { status: 502 }
      );
    }

    const contentType = String(
      getOutcome.headers["content-type"] || reportedType || "application/octet-stream"
    ).toLowerCase();

    // Check again for HTML in GET response
    if (contentType.includes("text/html") || contentType.includes("application/xhtml")) {
      getOutcome.body.resume();
      releaseSlotOnce();
      return NextResponse.json(
        {
          status: false,
          message:
            "URL mengarah ke halaman web (HTML). Masukkan direct link file audio/video (misal .mp3, .wav, .m4a, .mp4).",
        },
        { status: 400 }
      );
    }

    const pathExt = `.${parsed.pathname.split(".").pop()?.toLowerCase()}`;
    const isMediaMime =
      contentType.startsWith("audio/") ||
      contentType.startsWith("video/") ||
      contentType.includes("application/ogg");
    const isMediaExt = ALLOWED_MEDIA_EXTENSIONS.includes(pathExt);

    if (!isMediaMime && !isMediaExt) {
      getOutcome.body.resume();
      releaseSlotOnce();
      return NextResponse.json(
        {
          status: false,
          message: `Format media '${contentType}' tidak didukung. Harap masukkan tautan file audio/video langsung.`,
        },
        { status: 415 }
      );
    }

    const contentLength = parseInt(String(getOutcome.headers["content-length"] || "0"), 10);
    if (contentLength > MAX_BYTES) {
      getOutcome.body.resume();
      releaseSlotOnce();
      return NextResponse.json(
        {
          status: false,
          message: `Ukuran file melebihi batas 50 MB (${(contentLength / (1024 * 1024)).toFixed(1)} MB).`,
        },
        { status: 413 }
      );
    }

    // Determine filename
    let filename = "";
    const disposition = String(getOutcome.headers["content-disposition"] || "");
    if (disposition && disposition.includes("filename=")) {
      const match = disposition.match(/filename=["']?([^"';]+)["']?/);
      if (match && match[1]) filename = match[1];
    }
    if (!filename) {
      const parts = parsed.pathname.split("/").filter(Boolean);
      filename = parts[parts.length - 1] || "remote_media";
    }
    filename = sanitizeFilename(filename);

    // Enforce byte limit via Transform stream
    let bytesReceived = 0;
    const limiterStream = new Transform({
      transform(chunk, _encoding, callback) {
        bytesReceived += chunk.length;
        if (bytesReceived > MAX_BYTES) {
          releaseSlotOnce();
          callback(new Error("PAYLOAD_TOO_LARGE"));
          return;
        }
        callback(null, chunk);
      },
      final(callback) {
        releaseSlotOnce();
        callback();
      },
    });

    const webStream = Readable.toWeb(getOutcome.body.pipe(limiterStream)) as unknown as BodyInit;

    return new Response(webStream, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "X-Media-Filename": filename,
        "X-Media-Size": String(contentLength || bytesReceived),
        "Cache-Control": "no-store",
      },
    });
  } catch (err: unknown) {
    releaseSlotOnce();
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("SSRF_BLOCKED")) {
      return NextResponse.json(
        {
          status: false,
          message: "Akses ditolak: Alamat tujuan mengarah ke jaringan lokal atau privat (SSRF Guard).",
        },
        { status: 403 }
      );
    }
    if (msg.includes("aborted") || msg.includes("ABORTED") || msg.includes("TIMEOUT")) {
      return NextResponse.json(
        { status: false, message: "Waktu permintaan unduhan media habis (timeout 15 detik)." },
        { status: 504 }
      );
    }
    if (msg === "PAYLOAD_TOO_LARGE") {
      return NextResponse.json(
        { status: false, message: "Unduhan dibatalkan karena ukuran media melebihi batas 50 MB." },
        { status: 413 }
      );
    }
    return NextResponse.json(
      { status: false, message: "Gagal mengunduh berkas media dari server asal." },
      { status: 502 }
    );
  }
}
