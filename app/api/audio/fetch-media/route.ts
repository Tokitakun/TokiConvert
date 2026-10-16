/**
 * /api/audio/fetch-media - Secure media fetch proxy for direct audio/video URLs.
 * Features:
 * - Strict SSRF guard (rejects private, loopback, link-local, and cloud metadata IPs)
 * - Media type validation (rejects HTML pages and non-media formats)
 * - 50 MB maximum stream size limit with chunk byte tracking
 * - 15-second request timeout
 * - No sensitive token or credential leakage in diagnostics
 */

import { NextRequest, NextResponse } from "next/server";
import { assertSafeHost } from "@/app/lib/ssrfGuard";

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
  let body: { url?: string };
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

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return NextResponse.json(
      { status: false, message: "Hanya protokol HTTP/HTTPS yang didukung." },
      { status: 400 }
    );
  }

  // SSRF guard
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

  // Pre-flight check via HEAD request
  let reportedLength = 0;
  let reportedType = "";
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    let headRes: Response | null = null;
    try {
      headRes = await fetch(parsed.toString(), {
        method: "HEAD",
        signal: controller.signal,
        headers: {
          "User-Agent": "TokiConvert/1.0 (Media Processor; +https://tokiconvert.app)",
        },
      });
    } catch {
      // Some servers reject HEAD requests; fallback directly to GET
    }

    if (headRes && headRes.ok) {
      reportedType = (headRes.headers.get("content-type") || "").toLowerCase();
      reportedLength = parseInt(headRes.headers.get("content-length") || "0", 10);

      // Reject HTML web pages
      if (reportedType.includes("text/html") || reportedType.includes("application/xhtml")) {
        clearTimeout(timeoutId);
        return NextResponse.json(
          {
            status: false,
            message:
              "URL ini mengarah ke halaman web (HTML), bukan file media langsung. Harap masukkan tautan file media audio/video langsung atau gunakan resolver platform.",
          },
          { status: 400 }
        );
      }

      if (reportedLength > MAX_BYTES) {
        clearTimeout(timeoutId);
        return NextResponse.json(
          {
            status: false,
            message: `Ukuran file melebihi batas 50 MB (${(reportedLength / (1024 * 1024)).toFixed(1)} MB).`,
          },
          { status: 413 }
        );
      }
    }

    // Fetch the media stream with GET
    const getRes = await fetch(parsed.toString(), {
      method: "GET",
      signal: controller.signal,
      headers: {
        "User-Agent": "TokiConvert/1.0 (Media Processor; +https://tokiconvert.app)",
      },
    });

    clearTimeout(timeoutId);

    if (!getRes.ok) {
      return NextResponse.json(
        {
          status: false,
          message: `Server asal menolak permintaan dengan status ${getRes.status} (${getRes.statusText}).`,
        },
        { status: 502 }
      );
    }

    const contentType = (
      getRes.headers.get("content-type") ||
      reportedType ||
      "application/octet-stream"
    ).toLowerCase();

    // Check again for HTML in GET response
    if (contentType.includes("text/html") || contentType.includes("application/xhtml")) {
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
      return NextResponse.json(
        {
          status: false,
          message: `Format media '${contentType}' tidak didukung. Harap masukkan tautan file audio/video langsung.`,
        },
        { status: 415 }
      );
    }

    const contentLength = parseInt(getRes.headers.get("content-length") || "0", 10);
    if (contentLength > MAX_BYTES) {
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
    const disposition = getRes.headers.get("content-disposition");
    if (disposition && disposition.includes("filename=")) {
      const match = disposition.match(/filename=["']?([^"';]+)["']?/);
      if (match && match[1]) filename = match[1];
    }
    if (!filename) {
      const parts = parsed.pathname.split("/").filter(Boolean);
      filename = parts[parts.length - 1] || "remote_media";
    }
    filename = sanitizeFilename(filename);

    // Stream with byte counter to prevent memory flooding
    if (!getRes.body) {
      return NextResponse.json(
        { status: false, message: "Response body kosong dari server asal." },
        { status: 502 }
      );
    }

    let bytesReceived = 0;
    const transformStream = new TransformStream({
      transform(chunk, controller) {
        bytesReceived += chunk.length;
        if (bytesReceived > MAX_BYTES) {
          controller.error(new Error("PAYLOAD_TOO_LARGE"));
          return;
        }
        controller.enqueue(chunk);
      },
    });

    const responseStream = getRes.body.pipeThrough(transformStream);

    return new Response(responseStream, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "X-Media-Filename": filename,
        "X-Media-Size": String(contentLength || bytesReceived),
        "Cache-Control": "no-store",
      },
    });
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("aborted") || msg.includes("TIMEOUT")) {
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
