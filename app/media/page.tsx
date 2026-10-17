"use client";

import { useState, useRef } from "react";
import {
  Music,
  Video,
  Download,
  Link2,
  AlertTriangle,
  CheckCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Clipboard,
  X,
  ShieldCheck,
} from "lucide-react";
import RetroProgressBar from "../components/RetroProgressBar";

/* ─── Types ─────────────────────────────────────────────────────────────── */

interface DownloadLink {
  type?: string;
  quality?: string;
  url?: string;
  label?: string;
  ext?: string;
  proxyToken?: string;
  proxyExpiresAt?: number;
}

interface AuthorInfo {
  name?: string;
  username?: string;
  avatar?: string;
}

interface ResolveResult {
  title?: string;
  author?: string | AuthorInfo;
  thumbnail?: string;
  duration?: string;
  views?: string | number;
  likes?: string | number;
  description?: string;
  destinationUrl?: string;
  originalUrl?: string;
  hops?: string[];
  downloads?: DownloadLink[] | Record<string, DownloadLink>;
  url?: string;
}

interface ApiResponse {
  status: boolean;
  errorCategory?: "validation" | "dns" | "ssrf" | "timeout" | "upstream" | "no_result";
  platform?: string;
  platformNote?: string;
  result?: ResolveResult;
  message?: string;
}

type FormatPref = "best" | "mp3" | "mp4";
type ConvertStatus = "idle" | "fetching" | "converting" | "done" | "error";

/* ─── Supported platforms ────────────────────────────────────────────────── */

const PLATFORMS = [
  "YouTube", "Spotify", "TikTok", "Instagram", "Twitter / X", "Reddit",
  "Bandcamp", "SoundCloud", "MediaFire", "Pixeldrain",
  "Catbox", "Google Drive", "URL Shortener",
];

/* ─── Helpers ────────────────────────────────────────────────────────────── */

function getAuthorString(author: string | AuthorInfo): string {
  if (typeof author === "string") return author;
  const name = author.name ?? "";
  const handle = author.username
    ? ` (${author.username.startsWith("@") ? author.username : `@${author.username}`})`
    : "";
  return `${name}${handle}`.trim();
}

function normaliseDownloads(raw: DownloadLink[] | Record<string, DownloadLink> | undefined): DownloadLink[] {
  if (!raw) return [];
  return Array.isArray(raw) ? raw : Object.values(raw);
}

/** Heuristic: does a download link look like audio? */
function isAudioLink(dl: DownloadLink): boolean {
  const t = (dl.type ?? dl.ext ?? dl.quality ?? dl.label ?? "").toLowerCase();
  return /mp3|ogg|aac|flac|m4a|wav|audio/.test(t);
}

/** Heuristic: does a download link look like video? */
function isVideoLink(dl: DownloadLink): boolean {
  const t = (dl.type ?? dl.ext ?? dl.quality ?? dl.label ?? "").toLowerCase();
  return /mp4|webm|mkv|mov|avi|video/.test(t);
}

function filterByPref(links: DownloadLink[], pref: FormatPref): DownloadLink[] {
  if (pref === "best" || links.length === 0) return links;
  return links.filter(pref === "mp3" ? isAudioLink : isVideoLink);
}

function isValidHttpUrl(url?: string): boolean {
  if (!url || typeof url !== "string") return false;
  return url.startsWith("http://") || url.startsWith("https://");
}

function safeFilename(title?: string, ext = "bin"): string {
  const base = (title ?? "download")
    .replace(/[^\w\s.-]/g, "")
    .replace(/\s+/g, "_")
    .slice(0, 80);
  return `${base || "download"}.${ext}`;
}

/* ─── Page component ─────────────────────────────────────────────────────── */

export default function MediaPage() {
  const [url, setUrl] = useState("");
  const [formatPref, setFormatPref] = useState<FormatPref>("best");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [showPlatforms, setShowPlatforms] = useState(false);

  // MP3 conversion / proxy download from direct URL
  const [convertStatus, setConvertStatus] = useState<ConvertStatus>("idle");
  const [convertMsg, setConvertMsg] = useState("");
  const [downloadProgressPct, setDownloadProgressPct] = useState<number | undefined>(undefined);
  const [mp3BlobUrl, setMp3BlobUrl] = useState<string | null>(null);
  const [mp3Filename, setMp3Filename] = useState("audio.mp3");
  const prevBlobRef = useRef<string | null>(null);

  const handlePaste = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        const text = await navigator.clipboard.readText();
        if (text && text.trim()) {
          setUrl(text.trim());
        }
      }
    } catch {
      // Browser permission denied or not supported; ignore gracefully
    }
  };

  const handleClear = () => {
    setUrl("");
    setResponse(null);
    resetConvert();
  };

  const resolveWithFormat = async (targetUrl: string, pref: FormatPref) => {
    const trimmed = targetUrl.trim();
    if (!trimmed) return;
    setLoading(true);
    setResponse(null);
    resetConvert();

    try {
      const res = await fetch("/api/media/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed, format: pref }),
      });
      const data: ApiResponse = await res.json();
      setResponse(data);
    } catch {
      setResponse({ status: false, message: "Gagal terhubung ke server. Coba lagi." });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await resolveWithFormat(url, formatPref);
  };

  function resetConvert() {
    if (prevBlobRef.current) {
      URL.revokeObjectURL(prevBlobRef.current);
      prevBlobRef.current = null;
    }
    setMp3BlobUrl(null);
    setConvertStatus("idle");
    setConvertMsg("");
    setDownloadProgressPct(undefined);
  }

  /** Safe proxy download for cross-origin URLs */
  async function handleDownloadViaProxy(dl: DownloadLink, title?: string) {
    if (!dl.url) return;
    resetConvert();
    try {
      setConvertStatus("fetching");
      setConvertMsg("Menghubungi proxy aman…");

      const proxyRes = await fetch("/api/audio/fetch-media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: dl.url,
          token: dl.proxyToken,
          expiresAt: dl.proxyExpiresAt,
        }),
      });

      if (!proxyRes.ok) {
        const err = await proxyRes.json().catch(() => ({ message: "Gagal mengunduh media." }));
        throw new Error(err.message ?? "Gagal mengunduh media.");
      }

      const contentLength = parseInt(
        proxyRes.headers.get("x-media-size") || proxyRes.headers.get("content-length") || "0",
        10
      );

      const filename =
        proxyRes.headers.get("x-media-filename") || safeFilename(title, "bin");

      const reader = proxyRes.body?.getReader();
      if (!reader) throw new Error("Stream response body tidak dapat dibaca.");

      const chunks: Uint8Array[] = [];
      let bytesReceived = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          chunks.push(value);
          bytesReceived += value.length;
          if (contentLength > 0) {
            const pct = Math.min(100, Math.round((bytesReceived / contentLength) * 100));
            const mbRec = (bytesReceived / 1024 / 1024).toFixed(1);
            const mbTot = (contentLength / 1024 / 1024).toFixed(1);
            setDownloadProgressPct(pct);
            setConvertMsg(`Mengunduh berkas: ${pct}% (${mbRec} / ${mbTot} MB)…`);
          } else {
            const mb = (bytesReceived / 1024 / 1024).toFixed(2);
            setDownloadProgressPct(undefined);
            setConvertMsg(`Mengunduh berkas: ${mb} MB diterima…`);
          }
        }
      }

      if (bytesReceived === 0) throw new Error("Berkas media kosong.");

      setDownloadProgressPct(100);

      const blob = new Blob(chunks as BlobPart[], {
        type: proxyRes.headers.get("content-type") || "application/octet-stream",
      });

      const blobUrl = URL.createObjectURL(blob);
      prevBlobRef.current = blobUrl;
      setMp3BlobUrl(blobUrl);
      setMp3Filename(filename);
      setConvertStatus("done");
      setConvertMsg(`Berkas "${filename}" berhasil diunduh via proxy.`);

      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal mengunduh berkas.";
      setConvertStatus("error");
      setConvertMsg(msg);
    }
  }

  /** Fetch a media URL via proxy then encode to pure MPEG Layer III MP3 client-side */
  async function handleFetchAsMP3(dl: DownloadLink, title?: string) {
    if (!dl.url) return;
    resetConvert();
    const filename = safeFilename(title, "mp3");
    setMp3Filename(filename);

    try {
      setConvertStatus("fetching");
      setConvertMsg("Mengambil stream media dari server…");

      const proxyRes = await fetch("/api/audio/fetch-media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: dl.url,
          token: dl.proxyToken,
          expiresAt: dl.proxyExpiresAt,
        }),
      });

      if (!proxyRes.ok) {
        const err = await proxyRes.json().catch(() => ({ message: "Gagal mengambil media." }));
        throw new Error(err.message ?? "Gagal mengambil media.");
      }

      const contentLength = parseInt(
        proxyRes.headers.get("x-media-size") || proxyRes.headers.get("content-length") || "0",
        10
      );

      const reader = proxyRes.body?.getReader();
      if (!reader) throw new Error("Body tidak dapat dibaca.");

      const chunks: Uint8Array[] = [];
      let bytesReceived = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          chunks.push(value);
          bytesReceived += value.length;
          if (contentLength > 0) {
            const pct = Math.min(100, Math.round((bytesReceived / contentLength) * 100));
            const mbRec = (bytesReceived / 1024 / 1024).toFixed(1);
            const mbTot = (contentLength / 1024 / 1024).toFixed(1);
            setDownloadProgressPct(pct);
            setConvertMsg(`Mengunduh stream: ${pct}% (${mbRec} / ${mbTot} MB)…`);
          } else {
            const mb = (bytesReceived / 1024 / 1024).toFixed(2);
            setDownloadProgressPct(undefined);
            setConvertMsg(`Mengunduh stream: ${mb} MB diterima…`);
          }
        }
      }

      if (bytesReceived === 0) throw new Error("File media kosong — tidak dapat diproses.");

      setDownloadProgressPct(undefined);
      setConvertStatus("converting");
      setConvertMsg("Mendekode audio & mengenkode ke MPEG Layer III (lamejs)…");

      const blob = new Blob(chunks as BlobPart[]);
      const arrayBuffer = await blob.arrayBuffer();
      const audioCtx = new AudioContext();
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

      // Encode to MP3 via lamejs
      const { Mp3Encoder } = await import("@breezystack/lamejs");
      const channels = Math.min(audioBuffer.numberOfChannels, 2) as 1 | 2;
      const sampleRate = audioBuffer.sampleRate;
      const bitrate = 192;
      const encoder = new Mp3Encoder(channels, sampleRate, bitrate);

      const samples = audioBuffer.length;
      const blockSize = 1152;
      const mp3Chunks: Uint8Array[] = [];

      const leftPCM = audioBuffer.getChannelData(0);
      const rightPCM = channels === 2 ? audioBuffer.getChannelData(1) : leftPCM;

      for (let i = 0; i < samples; i += blockSize) {
        const leftSlice = leftPCM.slice(i, i + blockSize);
        const rightSlice = rightPCM.slice(i, i + blockSize);
        const left16 = new Int16Array(leftSlice.length);
        const right16 = new Int16Array(rightSlice.length);
        for (let j = 0; j < leftSlice.length; j++) {
          left16[j] = Math.max(-32768, Math.min(32767, leftSlice[j] * 32767));
          right16[j] = Math.max(-32768, Math.min(32767, rightSlice[j] * 32767));
        }
        const chunk = channels === 2
          ? encoder.encodeBuffer(left16, right16)
          : encoder.encodeBuffer(left16);
        if (chunk.length > 0) mp3Chunks.push(new Uint8Array(chunk));
      }

      const flushed = encoder.flush();
      if (flushed.length > 0) mp3Chunks.push(new Uint8Array(flushed));
      audioCtx.close();

      if (mp3Chunks.length === 0) {
        throw new Error("Gagal mengenkode ke format MPEG Layer III.");
      }

      const mp3Blob = new Blob(mp3Chunks as BlobPart[], { type: "audio/mpeg" });
      const blobUrl = URL.createObjectURL(mp3Blob);
      prevBlobRef.current = blobUrl;
      setMp3BlobUrl(blobUrl);
      setDownloadProgressPct(100);
      setConvertStatus("done");
      setConvertMsg("Konversi ke MPEG Layer III MP3 selesai — siap diunduh.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Konversi gagal.";
      setConvertStatus("error");
      setConvertMsg(msg);
    }
  }

  // Derived
  const allLinks = normaliseDownloads(response?.result?.downloads);
  const visibleLinks = filterByPref(allLinks, formatPref);

  return (
    <div className="flex flex-col items-center w-full px-4 sm:px-6 py-8 sm:py-12">
      <section className="w-full max-w-3xl">

        {/* ── Header ───────────────────────────────────────────────────────── */}
        <div className="text-center mb-10 space-y-2">
          <p className="text-xs font-semibold tracking-wider uppercase text-[#A34F38]">
            MEDIA URL TOOLS · METADATA &amp; DOWNLOAD
          </p>
          <h1 className="text-4xl sm:text-5xl font-serif font-bold text-[#332F29] tracking-tight">
            Media Downloader
          </h1>
          <p className="text-sm sm:text-base text-[#62584C] max-w-lg mx-auto">
            Resolve metadata dan ambil tautan unduhan dari URL media publik. Pilih format output sebelum resolve.
          </p>
        </div>

        {/* ── Disclaimer ───────────────────────────────────────────────────── */}
        <div className="mb-8 border border-[#D8CCB9] rounded-lg p-4 bg-[#F4EBDD] text-sm text-[#62584C] space-y-1">
          <p className="font-semibold text-[#332F29] flex items-center gap-1.5">
            <AlertTriangle size={15} className="text-[#A34F38]" aria-hidden="true" />
            Catatan Penting
          </p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>Fitur ini <strong>hanya mendukung konten publik</strong>. Konten di balik login atau paywall tidak dapat diakses.</li>
            <li>TokiConvert tidak menyimpan, mengunduh, atau mendistribusikan media pihak ketiga.</li>
            <li>Ketersediaan platform bergantung pada layanan scraper eksternal dan dapat berubah sewaktu-waktu.</li>
            <li>Penggunaan bertanggung jawab adalah kewajiban pengguna — patuhi ToS platform asal.</li>
          </ul>
        </div>

        {/* ── Format Preference ────────────────────────────────────────────── */}
        <div className="mb-5 flex flex-col sm:flex-row sm:items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#62584C] shrink-0">
            Format Output
          </span>
          <div
            role="radiogroup"
            aria-label="Format output yang diinginkan"
            className="flex gap-2 flex-wrap"
          >
            {(["best", "mp3", "mp4"] as FormatPref[]).map((pref) => (
              <label
                key={pref}
                className={`flex items-center gap-1.5 cursor-pointer px-3 py-1.5 rounded border text-xs font-medium transition-colors ${
                  formatPref === pref
                    ? "border-[#A34F38] bg-[#A34F38] text-white"
                    : "border-[#D8CCB9] bg-[#FFFCF6] text-[#62584C] hover:border-[#A34F38]/60 hover:text-[#332F29]"
                }`}
              >
                <input
                  type="radio"
                  name="format-pref"
                  value={pref}
                  checked={formatPref === pref}
                  onChange={() => setFormatPref(pref)}
                  className="sr-only"
                />
                {pref === "mp3" && <Music size={12} aria-hidden="true" />}
                {pref === "mp4" && <Video size={12} aria-hidden="true" />}
                {pref === "best" && <Link2 size={12} aria-hidden="true" />}
                {pref === "best" ? "Semua Format" : pref.toUpperCase()}
              </label>
            ))}
          </div>
          <span className="text-xs text-[#62584C] italic">
            {formatPref === "mp3" && "Hanya tautan audio yang akan ditampilkan (jika tersedia)."}
            {formatPref === "mp4" && "Hanya tautan video yang akan ditampilkan (jika tersedia)."}
            {formatPref === "best" && "Semua tautan hasil resolve ditampilkan."}
          </span>
        </div>

        {/* ── URL Input Form ───────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <label htmlFor="media-url-input" className="sr-only">
              URL Media Publik
            </label>
            <input
              id="media-url-input"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Tempel tautan TikTok, YouTube, Spotify, SoundCloud, dll…"
              className="w-full border border-[#D8CCB9] rounded-lg pl-4 pr-20 py-3 bg-[#FFFCF6] text-sm text-[#332F29] placeholder-[#62584C]/50 focus:outline-none focus:ring-2 focus:ring-[#A34F38] focus:border-[#A34F38] transition-colors"
              required
              disabled={loading}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {url ? (
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={loading}
                  className="p-1.5 text-[#62584C] hover:text-[#A34F38] rounded hover:bg-[#D4B98A]/20 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-[#A34F38]"
                  title="Bersihkan input URL"
                  aria-label="Bersihkan input URL"
                >
                  <X size={16} aria-hidden="true" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handlePaste}
                  disabled={loading}
                  className="px-2 py-1 text-xs text-[#62584C] hover:text-[#332F29] rounded hover:bg-[#D4B98A]/20 inline-flex items-center gap-1 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-[#A34F38]"
                  title="Tempel tautan dari clipboard"
                  aria-label="Tempel tautan dari clipboard"
                >
                  <Clipboard size={13} aria-hidden="true" />
                  <span className="hidden xs:inline text-[11px]">Paste</span>
                </button>
              )}
            </div>
          </div>
          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="min-h-[46px] flex items-center justify-center gap-2 bg-[#A34F38] text-white py-3 px-6 rounded-lg text-sm font-medium hover:bg-[#8B3F2A] active:scale-[0.99] disabled:bg-[#A34F38]/40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#A34F38] transition-all whitespace-nowrap shadow-xs"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                <span>Memproses…</span>
              </>
            ) : (
              <>
                <Link2 size={16} aria-hidden="true" />
                <span>Resolve URL</span>
              </>
            )}
          </button>
        </form>

        {/* ── Result area ─────────────────────────────────────────────────── */}
        {response && (
          <div
            className={`border rounded-lg p-6 mb-8 ${
              response.status
                ? "border-[#344638]/40 bg-[#FFFCF6]"
                : "border-[#A34F38]/40 bg-[#A34F38]/5"
            }`}
            role="region"
            aria-label="Hasil resolusi URL"
          >
            {/* Error state */}
            {!response.status ? (
              <div className="flex items-start gap-3">
                <AlertTriangle size={20} className="text-[#A34F38] mt-0.5 shrink-0" aria-hidden="true" />
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-[#332F29]">
                      {response.errorCategory === "validation" && "Format URL Tidak Valid"}
                      {response.errorCategory === "dns" && "Host Tidak Dapat Dijangkau"}
                      {response.errorCategory === "ssrf" && "Akses Jaringan Ditolak"}
                      {response.errorCategory === "timeout" && "Waktu Permintaan Habis"}
                      {response.errorCategory === "no_result" && "Resolver Tidak Memperoleh Hasil"}
                      {response.errorCategory === "upstream" && "Layanan Upstream Tidak Tersedia"}
                      {!response.errorCategory && "Gagal Resolve URL"}
                    </p>
                    {response.errorCategory && (
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded border border-[#A34F38]/30 text-[#A34F38] bg-[#A34F38]/10">
                        {response.errorCategory}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-[#62584C]">{response.message}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Platform badge */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#344638]/10 text-[#344638] border border-[#344638]/20">
                    {response.platform ?? "Unknown Platform"}
                  </span>
                  {response.platformNote && (
                    <span className="text-xs text-[#62584C] italic">{response.platformNote}</span>
                  )}
                </div>

                {/* Metadata */}
                {response.result && (
                  <div className="space-y-4">
                    {/* Media Card Header with Thumbnail */}
                    <div className="flex flex-col sm:flex-row gap-4 items-start">
                      {response.result.thumbnail && (
                        <div className="w-full sm:w-44 h-28 rounded-lg overflow-hidden border border-[#D8CCB9] bg-[#F4EBDD] flex-shrink-0 relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={response.result.thumbnail}
                            alt={response.result.title || "Thumbnail"}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="space-y-2 flex-1 min-w-0">
                        {response.result.title && (
                          <div>
                            <p className="text-xs text-[#62584C] uppercase tracking-wide font-semibold mb-0.5">Judul</p>
                            <p className="text-[#332F29] font-medium leading-snug">{response.result.title}</p>
                          </div>
                        )}
                        <div className="flex flex-wrap gap-4 text-xs text-[#62584C]">
                          {response.result.author && (
                            <div>
                              <span className="font-semibold uppercase tracking-wide">Kanal/Kreator: </span>
                              <span className="text-[#332F29] font-medium">{getAuthorString(response.result.author)}</span>
                            </div>
                          )}
                          {response.result.duration && (
                            <div>
                              <span className="font-semibold uppercase tracking-wide">Durasi: </span>
                              <span className="text-[#332F29] font-medium">{response.result.duration}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {response.result.destinationUrl && response.result.destinationUrl !== url && (
                      <div>
                        <p className="text-xs text-[#62584C] uppercase tracking-wide font-semibold mb-0.5">URL Tujuan</p>
                        <a
                          href={response.result.destinationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#A34F38] text-sm underline break-all"
                        >
                          {response.result.destinationUrl}
                        </a>
                      </div>
                    )}

                    {/* ── Empty state for format filter ── */}
                    {allLinks.length > 0 && visibleLinks.length === 0 && (
                      <div className="border border-[#D8CCB9] bg-[#F4EBDD]/50 rounded-lg p-5 text-center space-y-2.5">
                        <p className="text-sm font-semibold text-[#332F29]">
                          Format {formatPref.toUpperCase()} belum tersedia pada hasil unduhan saat ini.
                        </p>
                        <p className="text-xs text-[#62584C] max-w-md mx-auto">
                          Hasil sebelumnya di-resolve untuk preferensi format lain. Klik tombol di bawah untuk meminta stream {formatPref.toUpperCase()} secara langsung dari resolver.
                        </p>
                        <button
                          type="button"
                          onClick={() => resolveWithFormat(url, formatPref)}
                          disabled={loading}
                          className="inline-flex items-center gap-1.5 text-xs bg-[#A34F38] text-white hover:bg-[#8B3F2A] px-4 py-2 rounded font-medium transition-colors disabled:opacity-50"
                        >
                          <Download size={13} aria-hidden="true" />
                          Ambil Format {formatPref.toUpperCase()}
                        </button>
                      </div>
                    )}

                    {/* ── Download links ─────────────────────────────────── */}
                    {visibleLinks.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs text-[#62584C] uppercase tracking-wide font-semibold">
                            Tautan Unduhan
                            {formatPref !== "best" && allLinks.length !== visibleLinks.length && (
                              <span className="ml-1 text-[#A34F38] normal-case">
                                ({visibleLinks.length}/{allLinks.length} ditampilkan)
                              </span>
                            )}
                          </p>
                          {formatPref !== "best" && allLinks.length !== visibleLinks.length && (
                            <button
                              type="button"
                              onClick={() => setFormatPref("best")}
                              className="text-xs text-[#A34F38] hover:underline"
                            >
                              Tampilkan semua
                            </button>
                          )}
                        </div>
                        <div className="grid gap-2.5">
                          {visibleLinks.map((dl, i) => (
                            <div
                              key={i}
                              className="flex flex-col md:flex-row md:items-center md:justify-between p-3 rounded-lg border border-[#D8CCB9] bg-[#FFFCF6] gap-3 shadow-2xs"
                            >
                              <div className="flex flex-col min-w-0">
                                <span className="font-medium text-[#332F29] text-sm flex items-center gap-1.5">
                                  {isAudioLink(dl) && <Music size={14} className="text-[#344638]" aria-hidden="true" />}
                                  {isVideoLink(dl) && <Video size={14} className="text-[#344638]" aria-hidden="true" />}
                                  <span>
                                    {isAudioLink(dl) ? `Audio (${dl.quality ?? "Direct Stream"})` : isVideoLink(dl) ? `Video (${dl.quality ?? "Direct Stream"})` : (dl.quality ?? dl.type ?? `Format ${i + 1}`)}
                                  </span>
                                </span>
                                {dl.url && (
                                  <span className="text-[#62584C] text-xs truncate max-w-[280px] sm:max-w-[400px] mt-0.5">{dl.url}</span>
                                )}
                              </div>
                              {isValidHttpUrl(dl.url) && (
                                <div className="flex flex-wrap gap-2 shrink-0 items-center">
                                  {/* 1. Primary recommended action: Safe download via signed proxy */}
                                  <button
                                    type="button"
                                    onClick={() => handleDownloadViaProxy(dl, response?.result?.title)}
                                    disabled={convertStatus === "fetching" || convertStatus === "converting"}
                                    className="h-8 inline-flex items-center gap-1.5 text-xs bg-[#344638] text-[#FFFCF6] hover:bg-[#253328] px-3 rounded-md font-medium transition-colors shadow-2xs disabled:opacity-50"
                                    title="Unduh melalui proxy terverifikasi TokiConvert (menghindari CORS dan memaksakan dialog simpan berkas)"
                                    aria-label="Download berkas via proxy terverifikasi"
                                  >
                                    <ShieldCheck size={13} aria-hidden="true" />
                                    <span>Download via Proxy</span>
                                  </button>

                                  {/* 2. Direct Link */}
                                  <a
                                    href={dl.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    download
                                    className="h-8 inline-flex items-center gap-1.5 text-xs border border-[#D8CCB9] text-[#332F29] hover:bg-[#D4B98A]/20 px-3 rounded-md font-medium transition-colors"
                                    aria-label={`Buka tautan langsung ${dl.quality ?? dl.type ?? "berkas"}`}
                                  >
                                    <Download size={13} aria-hidden="true" />
                                    <span>Tautan Langsung</span>
                                  </a>

                                  {/* 3. Pure MP3 extraction via Web Audio client-side */}
                                  <button
                                    type="button"
                                    onClick={() => handleFetchAsMP3(dl, response?.result?.title)}
                                    disabled={convertStatus === "fetching" || convertStatus === "converting"}
                                    className="h-8 inline-flex items-center gap-1.5 text-xs border border-[#A34F38] text-[#A34F38] hover:bg-[#A34F38]/10 px-3 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Ekstrak audio atau konversi ke MPEG Layer III (MP3 murni) di peramban via lamejs"
                                    aria-label="Ekstrak ke MP3 Murni di peramban"
                                  >
                                    <Music size={13} aria-hidden="true" />
                                    <span>Ekstrak MP3 Murni</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-[#62584C] mt-2 italic">
                          Tip: Pilih opsi format &quot;MP3&quot; di atas sebelum resolve untuk langsung mendapatkan direct audio stream lebih cepat tanpa perlu re-encode.
                        </p>
                      </div>
                    )}

                    {/* Direct URL for unshortener */}
                    {!response.result.downloads && response.result.url && (
                      <div>
                        <p className="text-xs text-[#62584C] uppercase tracking-wide font-semibold mb-1">URL Final</p>
                        <a
                          href={response.result.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#A34F38] text-sm underline break-all"
                        >
                          {response.result.url}
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Media Download & Conversion Progress Status ─────────────────────── */}
        {convertStatus !== "idle" && (
          <div
            className={`mb-8 border rounded-lg p-5 flex flex-col gap-3 shadow-xs ${
              convertStatus === "error"
                ? "border-[#A34F38]/40 bg-[#A34F38]/5"
                : convertStatus === "done"
                ? "border-[#344638]/40 bg-[#344638]/5"
                : "border-[#D8CCB9] bg-[#FFFCF6]"
            }`}
            role="status"
            aria-live="polite"
          >
            {(convertStatus === "fetching" || convertStatus === "converting") && (
              <div className="w-full space-y-2">
                <RetroProgressBar
                  value={downloadProgressPct}
                  totalBlocks={16}
                  variant={convertStatus === "converting" ? "gold" : "terracotta"}
                  label={
                    convertStatus === "converting"
                      ? "MENGENKODE KE MPEG LAYER III (MP3)"
                      : "MENGAMBIL STREAM MEDIA VIA PROXY"
                  }
                />
                <p className="text-xs text-[#62584C] font-mono">
                  {convertMsg || "Menghubungkan ke upstream…"}
                </p>
              </div>
            )}

            {convertStatus === "done" && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm text-[#344638]">
                  <CheckCircle size={18} className="text-[#344638] shrink-0" aria-hidden="true" />
                  <span className="font-medium text-[#332F29]">
                    {convertMsg || "Proses unduhan selesai."}
                  </span>
                </div>
                {mp3BlobUrl && (
                  <a
                    href={mp3BlobUrl}
                    download={mp3Filename}
                    className="h-9 inline-flex items-center justify-center gap-2 text-xs bg-[#344638] text-[#FFFCF6] hover:bg-[#253328] px-4 rounded-md font-medium transition-colors whitespace-nowrap shrink-0 shadow-xs"
                  >
                    <Download size={14} aria-hidden="true" />
                    <span>Simpan {mp3Filename}</span>
                  </a>
                )}
              </div>
            )}

            {convertStatus === "error" && (
              <div className="flex items-start gap-2.5 text-sm">
                <AlertTriangle size={18} className="text-[#A34F38] mt-0.5 shrink-0" aria-hidden="true" />
                <div className="space-y-0.5">
                  <p className="font-semibold text-[#A34F38]">Terjadi Kendala Pengunduhan</p>
                  <p className="text-xs text-[#62584C]">{convertMsg}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Supported platforms ──────────────────────────────────────────── */}
        <div className="border-t border-[#D8CCB9] pt-6">
          <button
            type="button"
            onClick={() => setShowPlatforms((v) => !v)}
            className="flex items-center justify-between w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#A34F38] rounded"
            aria-expanded={showPlatforms}
            aria-controls="platform-list"
          >
            <h2 className="text-base font-serif font-bold text-[#332F29]">Platform yang Didukung</h2>
            {showPlatforms
              ? <ChevronUp size={18} className="text-[#62584C]" aria-hidden="true" />
              : <ChevronDown size={18} className="text-[#62584C]" aria-hidden="true" />
            }
          </button>
          {showPlatforms && (
            <div id="platform-list" className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PLATFORMS.map((p) => (
                <div
                  key={p}
                  className="flex items-center gap-2 px-3 py-2 rounded border border-[#D8CCB9] bg-[#FFFCF6] text-sm text-[#62584C]"
                >
                  <span className="w-2 h-2 rounded-full bg-[#344638]/60 flex-shrink-0" />
                  {p}
                </div>
              ))}
              <p className="col-span-full text-xs text-[#62584C] mt-2">
                Ketersediaan platform bergantung pada layanan scraper eksternal. Resolver dapat tidak bekerja jika platform mengubah endpoint atau API internal mereka.
              </p>
            </div>
          )}
        </div>

      </section>
    </div>
  );
}
