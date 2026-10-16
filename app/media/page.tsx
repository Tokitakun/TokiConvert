"use client";

import { useState } from "react";

/* ─── Types ─────────────────────────────────────────────────────────────── */

interface Download {
  type?: string;
  quality?: string;
  url?: string;
  label?: string;
}

interface ResolveResult {
  title?: string;
  author?: string;
  thumbnail?: string;
  duration?: string;
  views?: string | number;
  likes?: string | number;
  description?: string;
  destinationUrl?: string;
  originalUrl?: string;
  hops?: string[];
  downloads?: Download[];
  url?: string;
}

interface ApiResponse {
  status: boolean;
  platform?: string;
  platformNote?: string;
  result?: ResolveResult;
  message?: string;
}

/* ─── Supported platforms list ──────────────────────────────────────────── */

const PLATFORMS = [
  "TikTok",
  "Instagram",
  "Twitter / X",
  "Reddit",
  "Bandcamp",
  "SoundCloud",
  "MediaFire",
  "Pixeldrain",
  "Catbox",
  "Google Drive",
  "URL Shortener",
];

/* ─── Page component ─────────────────────────────────────────────────────── */

export default function MediaPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<ApiResponse | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    setResponse(null);

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

  return (
    <div className="flex flex-col items-center w-full px-4 sm:px-6 py-8 sm:py-12">
      <section className="w-full max-w-3xl">
        {/* Header */}
        <div className="text-center mb-10 space-y-2">
          <p className="text-xs font-semibold tracking-wider uppercase text-[#A34F38]">
            MEDIA URL TOOLS · FITUR TERPISAH DARI IMAGE CONVERTER
          </p>
          <h1 className="text-4xl sm:text-5xl font-serif font-bold text-[#332F29] tracking-tight">
            Media URL Tools
          </h1>
          <p className="text-sm sm:text-base text-[#62584C] max-w-lg mx-auto">
            Resolve dan ekstrak metadata dari URL media publik. Berjalan di server — file Anda tidak pernah diunggah ke TokiConvert.
          </p>
        </div>

        {/* Disclaimer */}
        <div className="mb-8 border border-[#D8CCB9] rounded-lg p-4 bg-[#F4EBDD] text-sm text-[#62584C] space-y-1">
          <p className="font-semibold text-[#332F29]">⚠️ Catatan Penting</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>Fitur ini <strong>hanya mendukung konten publik</strong>. Konten di balik login, paywall, atau restricted tidak dapat diakses.</li>
            <li>TokiConvert tidak menyimpan, mengunduh, atau mendistribusikan media pihak ketiga.</li>
            <li>Ketersediaan platform bergantung pada layanan scraper eksternal dan dapat berubah sewaktu-waktu.</li>
            <li>Penggunaan bertanggung jawab adalah kewajiban pengguna — patuhi ToS platform asal.</li>
          </ul>
        </div>

        {/* URL Input Form */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-col sm:flex-row gap-3 mb-8"
        >
          <input
            id="media-url-input"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.tiktok.com/@user/video/123..."
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
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 2 5.373 2 12h4z" fill="currentColor" />
                </svg>
                Memproses...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                Resolve URL
              </>
            )}
          </button>
        </form>

        {/* Result area */}
        {response && (
          <div
            className={`border rounded-lg p-6 ${
              response.status
                ? "border-[#344638]/40 bg-[#FFFCF6]"
                : "border-[#A34F38]/40 bg-[#A34F38]/5"
            }`}
            role="region"
            aria-label="Hasil resolusi URL"
          >
            {!response.status ? (
              <div className="flex items-start gap-3">
                <span className="text-xl mt-0.5">⚠️</span>
                <div>
                  <p className="font-semibold text-[#332F29] mb-1">Gagal resolve URL</p>
                  <p className="text-sm text-[#62584C]">{response.message}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Platform badge */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#344638]/10 text-[#344638] border border-[#344638]/20">
                    {response.platform}
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
                        <p className="text-[#332F29]">{response.result.author}</p>
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

                    {/* Download links */}
                    {response.result.downloads && response.result.downloads.length > 0 && (
                      <div>
                        <p className="text-xs text-[#62584C] uppercase tracking-wide font-semibold mb-2">Tautan Tersedia</p>
                        <div className="grid gap-2">
                          {response.result.downloads.map((dl, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-between px-3 py-2 rounded border border-[#D8CCB9] bg-[#FFFCF6] text-sm"
                            >
                              <div className="flex flex-col">
                                <span className="font-medium text-[#332F29]">
                                  {dl.quality ?? dl.type ?? `Tautan ${i + 1}`}
                                </span>
                                {dl.url && (
                                  <span className="text-[#62584C] text-xs truncate max-w-[300px]">{dl.url}</span>
                                )}
                              </div>
                              {dl.url && (
                                <a
                                  href={dl.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="ml-3 text-xs text-[#A34F38] hover:text-[#8B3F2A] underline font-medium whitespace-nowrap"
                                >
                                  Buka tautan
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-[#62584C] mt-2 italic">
                          TokiConvert hanya menampilkan tautan. Pastikan Anda mematuhi syarat penggunaan platform asal.
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

        {/* Supported platforms */}
        <div className="mt-12 border-t border-[#D8CCB9] pt-8">
          <h2 className="text-lg font-serif font-bold text-[#332F29] mb-4">Platform yang Didukung</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {PLATFORMS.map((p) => (
              <div
                key={p}
                className="flex items-center gap-2 px-3 py-2 rounded border border-[#D8CCB9] bg-[#FFFCF6] text-sm text-[#62584C]"
              >
                <span className="w-2 h-2 rounded-full bg-[#344638]/60 flex-shrink-0" />
                {p}
              </div>
            ))}
          </div>
          <p className="text-xs text-[#62584C] mt-4">
            Ketersediaan platform bergantung pada layanan scraper eksternal. Resolver dapat tidak bekerja jika platform mengubah endpoint atau API internal mereka.
          </p>
        </div>
      </section>
    </div>
  );
}
