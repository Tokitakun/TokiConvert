"use client";

import { useState, useRef } from "react";
import { Music, Video, Download, Link2, AlertTriangle, CheckCircle, Loader2, ChevronDown, ChevronUp } from "lucide-react";

/* ─── Types ─────────────────────────────────────────────────────────────── */

interface DownloadLink {
  type?: string;
  quality?: string;
  url?: string;
  label?: string;
  ext?: string;
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
  "TikTok", "Instagram", "Twitter / X", "Reddit",
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
  const filtered = links.filter(pref === "mp3" ? isAudioLink : isVideoLink);
  return filtered.length > 0 ? filtered : links; // fallback: show all if no match
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

  // MP3 conversion from direct URL
  const [convertStatus, setConvertStatus] = useState<ConvertStatus>("idle");
  const [convertMsg, setConvertMsg] = useState("");
  const [mp3BlobUrl, setMp3BlobUrl] = useState<string | null>(null);
  const [mp3Filename, setMp3Filename] = useState("audio.mp3");
  const prevBlobRef = useRef<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    setResponse(null);
    resetConvert();

    try {
      const res = await fetch("/api/media/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data: ApiResponse = await res.json();
      setResponse(data);
    } catch {
      setResponse({ status: false, message: "Gagal terhubung ke server. Coba lagi." });
    } finally {
      setLoading(false);
    }
  };

  function resetConvert() {
    if (prevBlobRef.current) {
      URL.revokeObjectURL(prevBlobRef.current);
      prevBlobRef.current = null;
    }
    setMp3BlobUrl(null);
    setConvertStatus("idle");
    setConvertMsg("");
  }

  /** Fetch a direct media URL via the proxy then encode to MP3 client-side */
  async function handleFetchAsMP3(mediaUrl: string, title?: string) {
    resetConvert();
    const filename = safeFilename(title, "mp3");
    setMp3Filename(filename);

    try {
      setConvertStatus("fetching");
      setConvertMsg("Mengambil file dari URL…");

      const proxyRes = await fetch("/api/audio/fetch-media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: mediaUrl }),
      });

      if (!proxyRes.ok) {
        const err = await proxyRes.json().catch(() => ({ message: "Gagal mengambil media." }));
        throw new Error(err.message ?? "Gagal mengambil media.");
      }

      const blob = await proxyRes.blob();
      if (blob.size === 0) throw new Error("File media kosong — tidak dapat diproses.");

      setConvertStatus("converting");
      setConvertMsg("Mengonversi ke MP3…");

      // Decode via Web Audio API
      const arrayBuffer = await blob.arrayBuffer();
      const audioCtx = new AudioContext();
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

      // Encode to MP3 via lamejs (dynamic import — browser only)
      const { Mp3Encoder } = await import("@breezystack/lamejs");
      const channels = Math.min(audioBuffer.numberOfChannels, 2) as 1 | 2;
      const sampleRate = audioBuffer.sampleRate;
      const bitrate = 128;
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

      const mp3Blob = new Blob(mp3Chunks as BlobPart[], { type: "audio/mpeg" });
      const blobUrl = URL.createObjectURL(mp3Blob);
      prevBlobRef.current = blobUrl;
      setMp3BlobUrl(blobUrl);
      setConvertStatus("done");
      setConvertMsg("Konversi selesai — siap diunduh.");
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
          <input
            id="media-url-input"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.tiktok.com/@user/video/123…"
            className="flex-1 border border-[#D8CCB9] rounded-lg px-4 py-3 bg-[#FFFCF6] text-sm text-[#332F29] placeholder-[#62584C]/50 focus:outline-none focus:ring-2 focus:ring-[#A34F38] focus:border-[#A34F38] transition-colors"
            required
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="flex items-center justify-center gap-2 bg-[#A34F38] text-white py-3 px-6 rounded-lg text-sm font-medium hover:bg-[#8B3F2A] disabled:bg-[#A34F38]/40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#A34F38] transition-colors whitespace-nowrap"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                Memproses…
              </>
            ) : (
              <>
                <Link2 size={16} aria-hidden="true" />
                Resolve URL
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
                  <div className="space-y-3">
                    {response.result.title && (
                      <div>
                        <p className="text-xs text-[#62584C] uppercase tracking-wide font-semibold mb-0.5">Judul</p>
                        <p className="text-[#332F29] font-medium">{response.result.title}</p>
                      </div>
                    )}
                    {response.result.author && (
                      <div>
                        <p className="text-xs text-[#62584C] uppercase tracking-wide font-semibold mb-0.5">Penulis / Kanal</p>
                        <p className="text-[#332F29]">{getAuthorString(response.result.author)}</p>
                      </div>
                    )}
                    {response.result.duration && (
                      <div>
                        <p className="text-xs text-[#62584C] uppercase tracking-wide font-semibold mb-0.5">Durasi</p>
                        <p className="text-[#332F29]">{response.result.duration}</p>
                      </div>
                    )}
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
                        <div className="grid gap-2">
                          {visibleLinks.map((dl, i) => (
                            <div
                              key={i}
                              className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-3 py-2.5 rounded border border-[#D8CCB9] bg-[#FFFCF6] gap-2"
                            >
                              <div className="flex flex-col min-w-0">
                                <span className="font-medium text-[#332F29] text-sm flex items-center gap-1.5">
                                  {isAudioLink(dl) && <Music size={13} className="text-[#344638]" aria-hidden="true" />}
                                  {isVideoLink(dl) && <Video size={13} className="text-[#344638]" aria-hidden="true" />}
                                  {dl.quality ?? dl.type ?? dl.label ?? `Format ${i + 1}`}
                                </span>
                                {dl.url && (
                                  <span className="text-[#62584C] text-xs truncate max-w-[280px]">{dl.url}</span>
                                )}
                              </div>
                              {dl.url && (
                                <div className="flex gap-2 shrink-0">
                                  <a
                                    href={dl.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    download
                                    className="inline-flex items-center gap-1 text-xs bg-[#344638] text-[#FFFCF6] hover:bg-[#2a3a2c] px-3 py-1.5 rounded font-medium transition-colors"
                                    aria-label={`Download ${dl.quality ?? dl.type ?? "file"}`}
                                  >
                                    <Download size={12} aria-hidden="true" />
                                    Download
                                  </a>
                                  {!isAudioLink(dl) && (
                                    <button
                                      type="button"
                                      onClick={() => handleFetchAsMP3(dl.url!, response.result?.title)}
                                      disabled={convertStatus === "fetching" || convertStatus === "converting"}
                                      className="inline-flex items-center gap-1 text-xs border border-[#A34F38] text-[#A34F38] hover:bg-[#A34F38]/10 px-3 py-1.5 rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                      aria-label="Ambil audio sebagai MP3"
                                    >
                                      <Music size={12} aria-hidden="true" />
                                      MP3
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-[#62584C] mt-2 italic">
                          TokiConvert hanya menampilkan tautan. Pastikan kamu mematuhi syarat penggunaan platform asal.
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

        {/* ── MP3 Conversion Status ────────────────────────────────────────── */}
        {convertStatus !== "idle" && (
          <div
            className={`mb-8 border rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
              convertStatus === "error"
                ? "border-[#A34F38]/40 bg-[#A34F38]/5"
                : convertStatus === "done"
                ? "border-[#344638]/40 bg-[#344638]/5"
                : "border-[#D8CCB9] bg-[#F4EBDD]/40"
            }`}
            role="status"
            aria-live="polite"
          >
            <div className="flex items-center gap-2 text-sm">
              {(convertStatus === "fetching" || convertStatus === "converting") && (
                <Loader2 size={16} className="animate-spin text-[#A34F38] shrink-0" aria-hidden="true" />
              )}
              {convertStatus === "done" && (
                <CheckCircle size={16} className="text-[#344638] shrink-0" aria-hidden="true" />
              )}
              {convertStatus === "error" && (
                <AlertTriangle size={16} className="text-[#A34F38] shrink-0" aria-hidden="true" />
              )}
              <span className={convertStatus === "error" ? "text-[#A34F38]" : "text-[#332F29]"}>
                {convertStatus === "fetching" && "Mengambil file dari URL…"}
                {convertStatus === "converting" && "Mengonversi ke MP3…"}
                {convertStatus === "done" && "Konversi selesai — siap diunduh."}
                {convertStatus === "error" && convertMsg}
              </span>
            </div>
            {convertStatus === "done" && mp3BlobUrl && (
              <a
                href={mp3BlobUrl}
                download={mp3Filename}
                className="inline-flex items-center gap-1.5 text-xs bg-[#344638] text-[#FFFCF6] hover:bg-[#2a3a2c] px-4 py-2 rounded font-medium transition-colors whitespace-nowrap shrink-0"
              >
                <Download size={13} aria-hidden="true" />
                Unduh {mp3Filename}
              </a>
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
