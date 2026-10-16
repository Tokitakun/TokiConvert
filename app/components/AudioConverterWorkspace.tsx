"use client";

import { useState, useRef, useEffect, ChangeEvent, DragEvent } from "react";
import {
  Download,
  Trash2,
  Check,
  AlertCircle,
  Clock,
  Sliders,
  Play,
  Volume2,
  Music,
  ShieldCheck,
  Link as LinkIcon,
  Upload,
  Globe,
} from "lucide-react";
import {
  probeAudioMetadata,
  convertAudio,
  SupportedAudioTarget,
} from "../lib/audioConverter";
import RetroProgressBar from "./RetroProgressBar";
import TerminalStatus from "./TerminalStatus";
import PixelLoader from "./PixelLoader";

export interface AudioFileItem {
  id: string;
  file?: File;
  blob?: Blob;
  sourceType: "file" | "url";
  sourceUrl?: string;
  name: string;
  sizeFormatted: string;
  durationFormatted: string;
  targetFormat: SupportedAudioTarget;
  status: "queued" | "fetching" | "processing" | "success" | "failed";
  progress: number;
  stageText?: string;
  errorMessage?: string;
  convertedBlob?: Blob;
  convertedUrl?: string;
  convertedSize?: string;
}

export default function AudioConverterWorkspace() {
  const [activeTab, setActiveTab] = useState<"file" | "url">("file");
  const [items, setItems] = useState<AudioFileItem[]>([]);
  const [targetFormat, setTargetFormat] = useState<SupportedAudioTarget>("mp3");
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessages, setErrorMessages] = useState<string[]>([]);

  // URL Mode states
  const [inputUrl, setInputUrl] = useState("");
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);
  const [urlStatusLog, setUrlStatusLog] = useState<string[]>([]);
  const [currentUrlAction, setCurrentUrlAction] = useState<string | undefined>();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const supportedTargets: {
    format: SupportedAudioTarget;
    label: string;
    badge: string;
    note: string;
  }[] = [
    {
      format: "mp3",
      label: "MP3",
      badge: "Universal Audio",
      note: "Kompresi audio 128 kbps kompatibel dengan semua pemutar musik & perangkat.",
    },
    {
      format: "wav",
      label: "WAV",
      badge: "Lossless PCM",
      note: "16-bit PCM uncompressed audio murni tanpa penurunan kualitas.",
    },
  ];

  const formatSize = (bytes: number): string => {
    if (!bytes || isNaN(bytes)) return "--";
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
  };

  useEffect(() => {
    return () => {
      items.forEach((item) => {
        if (item.convertedUrl) URL.revokeObjectURL(item.convertedUrl);
      });
    };
  }, [items]);

  // ── File upload handling ───────────────────────────────────────────────────

  const addFiles = async (fileList: FileList) => {
    const validExts = [".mp3", ".wav", ".ogg", ".m4a", ".aac", ".flac", ".webm", ".mp4"];
    const newItems: AudioFileItem[] = [];
    const errors: string[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const ext = `.${file.name.split(".").pop()?.toLowerCase()}`;

      if (file.size === 0) {
        errors.push(`File '${file.name}' kosong (0 byte).`);
        continue;
      }
      if (file.size > 50 * 1024 * 1024) {
        errors.push(`File '${file.name}' melebihi batas 50 MB.`);
        continue;
      }
      if (!validExts.includes(ext) && !file.type.startsWith("audio/") && !file.type.startsWith("video/")) {
        errors.push(`Format file '${file.name}' tidak didukung untuk audio converter.`);
        continue;
      }

      // Probe audio duration
      const probe = await probeAudioMetadata(file);

      newItems.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        file,
        sourceType: "file",
        name: file.name,
        sizeFormatted: formatSize(file.size),
        durationFormatted: probe.durationFormatted,
        targetFormat,
        status: "queued",
        progress: 0,
      });
    }

    if (errors.length > 0) {
      setErrorMessages((prev) => [...prev, ...errors]);
    }
    if (newItems.length > 0) {
      setItems((prev) => [...prev, ...newItems]);
      setStatusMessage(`${newItems.length} file audio ditambahkan ke antrean.`);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(e.target.files);
      e.target.value = "";
    }
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      addFiles(e.dataTransfer.files);
    }
  };

  // ── URL to Audio Stream Handling ──────────────────────────────────────────

  const handleFetchUrl = async () => {
    const trimmed = inputUrl.trim();
    if (!trimmed) {
      setErrorMessages(["Masukkan tautan URL media terlebih dahulu."]);
      return;
    }

    const fetchMediaStream = async (targetUrl: string, fallbackName?: string, originalInputUrl?: string) => {
      const res = await fetch("/api/audio/fetch-media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: targetUrl }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || `Gagal mengambil media (Status HTTP ${res.status}).`);
      }

      const filename = res.headers.get("X-Media-Filename") || fallbackName || `url_audio_${Date.now()}.mp3`;
      const blob = await res.blob();

      if (blob.size === 0) {
        throw new Error("Berkas media yang diterima kosong (0 byte).");
      }

      setUrlStatusLog((prev) => [
        ...prev,
        `BERKAS DITERIMA: ${filename} (${formatSize(blob.size)})`,
        "MEMBACA DURASI AUDIO...",
      ]);
      setCurrentUrlAction("MEMERIKSA METADATA AUDIO...");

      const probe = await probeAudioMetadata(blob);

      const newItem: AudioFileItem = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        blob,
        sourceType: "url",
        sourceUrl: originalInputUrl || targetUrl,
        name: filename,
        sizeFormatted: formatSize(blob.size),
        durationFormatted: probe.durationFormatted,
        targetFormat,
        status: "queued",
        progress: 0,
      };

      setItems((prev) => [...prev, newItem]);
      setStatusMessage(`Tautan media '${filename}' berhasil diambil dan siap dikonversi.`);
      setInputUrl("");
      setUrlStatusLog((prev) => [...prev, "BERKAS BERHASIL DITAMBAHKAN KE ANTREAN [OK]"]);
      setCurrentUrlAction(undefined);
    };

    setErrorMessages([]);
    setIsFetchingUrl(true);
    setUrlStatusLog([`MEMERIKSA URL: ${trimmed.slice(0, 60)}...`]);
    setCurrentUrlAction("VALIDASI KEAMANAN & PROTOKOL...");

    try {
      // 1. Direct or platform detection
      const isKnownDirectMedia = /\.(mp3|wav|ogg|m4a|aac|flac|mp4|webm)(\?.*)?$/i.test(trimmed);

      if (!isKnownDirectMedia) {
        // Try platform check via /api/media/resolve first if it matches known social platforms
        const isPlatform = /(tiktok\.com|instagram\.com|twitter\.com|x\.com|reddit\.com|bandcamp\.com|soundcloud\.com|mediafire\.com|pixeldrain\.com|catbox\.moe|drive\.google\.com)/i.test(trimmed);

        if (isPlatform) {
          setUrlStatusLog((prev) => [...prev, "MENGHUBUNGI RESOLVER PLATFORM RESMI..."]);
          setCurrentUrlAction("RESOLVE METADATA PLATFORM...");

          const res = await fetch("/api/media/resolve", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: trimmed }),
          });

          const data = await res.json();
          if (!res.ok || !data.status) {
            throw new Error(data.message || "Gagal memperoleh stream audio dari platform ini.");
          }

          // Search for audio/video URL in result
          let streamUrl = "";
          if (typeof data.result === "string" && data.result.startsWith("http")) {
            streamUrl = data.result;
          } else if (data.result && typeof data.result === "object") {
            const r = data.result;
            streamUrl =
              r.audio ||
              r.audio_url ||
              r.mp3 ||
              r.video ||
              r.url ||
              r.download_url ||
              (Array.isArray(r.urls) ? r.urls[0] : "");
          }

          if (!streamUrl) {
            throw new Error(
              "Platform berhasil diakses tetapi tidak ditemukan stream audio langsung yang dapat diproses."
            );
          }

          setUrlStatusLog((prev) => [
            ...prev,
            `STREAM AUDIO DITEMUKAN (${data.platform || "Platform"}).`,
            "MENGUNDUH STREAM SECARA AMAN VIA PROXY...",
          ]);
          setCurrentUrlAction("STREAMING MEDIA SECARA AMAN...");

          // Now fetch stream through our secure proxy
          await fetchMediaStream(streamUrl, `audio_${Date.now()}.mp3`, trimmed);
          return;
        }
      }

      // 2. Direct media URL fetch via /api/audio/fetch-media
      setUrlStatusLog((prev) => [...prev, "SSRF GUARD: VALIDASI ALAMAT IP & HOST..."]);
      setCurrentUrlAction("MENGUNDUH BERKAS MEDIA DARI SERVER ASAL...");

      await fetchMediaStream(trimmed, undefined, trimmed);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal memproses URL media.";
      setErrorMessages([msg]);
      setUrlStatusLog((prev) => [...prev, `ERROR: ${msg}`]);
      setCurrentUrlAction(undefined);
    } finally {
      setIsFetchingUrl(false);
    }
  };

  // ── Conversion Execution ───────────────────────────────────────────────────

  const convertItem = async (item: AudioFileItem) => {
    setItems((prev) =>
      prev.map((it) =>
        it.id === item.id
          ? { ...it, status: "processing", progress: 15, stageText: "Membaca data audio...", errorMessage: undefined }
          : it
      )
    );

    try {
      const mediaSource = item.file || item.blob;
      if (!mediaSource) {
        throw new Error("Sumber data audio tidak ditemukan.");
      }

      setItems((prev) =>
        prev.map((it) =>
          it.id === item.id ? { ...it, progress: 30, stageText: `Encoding ke ${item.targetFormat.toUpperCase()}...` } : it
        )
      );

      const outputBlob = await convertAudio(mediaSource, item.targetFormat, (progress) => {
        setItems((prev) =>
          prev.map((it) =>
            it.id === item.id
              ? {
                  ...it,
                  progress,
                  stageText: `Encoding frame audio... (${progress}%)`,
                }
              : it
          )
        );
      });

      const convertedUrl = URL.createObjectURL(outputBlob);
      const convertedSize = formatSize(outputBlob.size);

      setItems((prev) =>
        prev.map((it) =>
          it.id === item.id
            ? {
                ...it,
                status: "success",
                progress: 100,
                stageText: "Selesai",
                convertedBlob: outputBlob,
                convertedUrl,
                convertedSize,
              }
            : it
        )
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gagal mengonversi audio";
      setItems((prev) =>
        prev.map((it) =>
          it.id === item.id ? { ...it, status: "failed", errorMessage: msg, stageText: "Gagal" } : it
        )
      );
    }
  };

  const convertAll = async () => {
    const pending = items.filter((it) => it.status === "queued" || it.status === "failed");
    if (pending.length === 0 || isProcessing) return;

    setIsProcessing(true);
    setStatusMessage(`Memproses konversi ${pending.length} file audio...`);

    for (const item of pending) {
      await convertItem(item);
    }

    setIsProcessing(false);
    setStatusMessage("Proses konversi audio selesai.");
  };

  const removeItem = (id: string) => {
    if (isProcessing) return;
    setItems((prev) => {
      const target = prev.find((it) => it.id === id);
      if (target?.convertedUrl) URL.revokeObjectURL(target.convertedUrl);
      return prev.filter((it) => it.id !== id);
    });
  };

  const clearAll = () => {
    if (isProcessing) return;
    items.forEach((it) => {
      if (it.convertedUrl) URL.revokeObjectURL(it.convertedUrl);
    });
    setItems([]);
    setErrorMessages([]);
    setStatusMessage("Semua file audio dihapus dari antrean.");
  };

  const handleDownloadSingle = (item: AudioFileItem) => {
    if (!item.convertedUrl) return;
    const baseName = item.name.replace(/\.[^/.]+$/, "");
    const downloadName = `${baseName}_converted.${item.targetFormat}`;
    const a = document.createElement("a");
    a.href = item.convertedUrl;
    a.download = downloadName;
    a.click();
  };

  const successCount = items.filter((it) => it.status === "success").length;
  const failedCount = items.filter((it) => it.status === "failed").length;

  return (
    <div className="flex flex-col w-full max-w-5xl mx-auto gap-6 p-4 sm:p-7 bg-[#FFFCF6] rounded-lg border border-[#D8CCB9] shadow-xs">
      {/* Notifications */}
      {statusMessage && (
        <div
          className="px-4 py-2.5 rounded-md border border-[#D4B98A]/70 bg-[#F4EBDD]/60 text-xs sm:text-sm font-medium text-[#344638] flex items-center justify-between"
          role="status"
        >
          <span>{statusMessage}</span>
          {isProcessing && (
            <span className="text-xs text-[#A34F38] font-mono flex items-center gap-1.5">
              <PixelLoader size={12} color="#A34F38" />
              <span>Memproses...</span>
            </span>
          )}
        </div>
      )}

      {errorMessages.length > 0 && (
        <div className="p-4 rounded-md border border-[#A34F38]/30 bg-[#A34F38]/5 space-y-1">
          {errorMessages.map((msg, i) => (
            <p
              key={i}
              className="text-xs sm:text-sm text-[#A34F38] flex items-center gap-1.5"
              role="alert"
            >
              <AlertCircle size={14} className="shrink-0" />
              <span>{msg}</span>
            </p>
          ))}
        </div>
      )}

      {/* Main Workspace */}
      <div className="flex flex-col lg:flex-row gap-6 items-stretch">
        {/* Left Column: Source Tabs & Audio Queue */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          {/* Source Mode Tabs */}
          <div className="flex items-center gap-1 border-b border-[#D8CCB9] pb-1">
            <button
              type="button"
              onClick={() => setActiveTab("file")}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-t-md transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#A34F38] ${
                activeTab === "file"
                  ? "bg-[#FFFEFB] border-t-2 border-[#A34F38] text-[#332F29] border-x border-[#D8CCB9] shadow-xs"
                  : "text-[#62584C] hover:text-[#332F29] hover:bg-[#F4EBDD]/40"
              }`}
            >
              <Upload size={14} aria-hidden="true" />
              <span>Upload File</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("url")}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-t-md transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#A34F38] ${
                activeTab === "url"
                  ? "bg-[#FFFEFB] border-t-2 border-[#A34F38] text-[#332F29] border-x border-[#D8CCB9] shadow-xs"
                  : "text-[#62584C] hover:text-[#332F29] hover:bg-[#F4EBDD]/40"
              }`}
            >
              <LinkIcon size={14} aria-hidden="true" />
              <span>Convert from URL</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#344638]/10 text-[#344638] font-bold">
                SSRF Guard
              </span>
            </button>
          </div>

          {/* TAB 1: FILE UPLOAD DROPZONE */}
          {activeTab === "file" && (
            <div
              role="button"
              tabIndex={0}
              aria-label="Area upload audio: seret file ke sini atau klik untuk memilih"
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              onDrop={onDrop}
              onDragOver={(e) => e.preventDefault()}
              onDragEnter={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setIsDragging(false);
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-6 sm:p-8 flex flex-col items-center justify-center min-h-[190px] transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#A34F38] ${
                isDragging
                  ? "border-[#A34F38] bg-[#D4B98A]/25 scale-[1.01]"
                  : "border-[#D8CCB9] bg-[#FFFCF6] hover:border-[#A34F38]/70 hover:bg-[#D4B98A]/10"
              }`}
            >
              <div className="w-12 h-12 rounded-full bg-[#D4B98A]/30 border border-[#D8CCB9]/60 flex items-center justify-center mb-3 text-[#344638]">
                <Music size={22} aria-hidden="true" />
              </div>
              <p className="font-serif font-medium text-base text-[#332F29] text-center">
                Drag &amp; drop audio/video ke sini atau pilih file dari perangkatmu.
              </p>
              <p className="text-xs text-[#62584C] mt-1 text-center">
                Mendukung MP3, WAV, OGG, M4A, FLAC, WebM, MP4 · Maks. 50 MB per file
              </p>
              <span className="mt-4 inline-flex items-center gap-1.5 bg-[#A34F38] hover:bg-[#8B3F2A] text-white py-2 px-5 rounded-md text-xs sm:text-sm font-medium transition-colors shadow-xs">
                Choose Files
              </span>
              <input
                type="file"
                accept="audio/*,video/*,.mp3,.wav,.ogg,.m4a,.aac,.flac,.webm,.mp4"
                multiple
                hidden
                ref={fileInputRef}
                onChange={handleFileChange}
              />
            </div>
          )}

          {/* TAB 2: CONVERT FROM URL */}
          {activeTab === "url" && (
            <div className="flex flex-col gap-3 p-4 sm:p-5 border border-[#D8CCB9] rounded-lg bg-[#FFFEFB]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#332F29] flex items-center gap-1.5">
                  <Globe size={14} className="text-[#A34F38]" />
                  <span>Ambil Media via URL</span>
                </span>
                <span className="text-[10px] text-[#62584C] font-mono">
                  Maks. 50 MB · Timeout 15s
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="url"
                  placeholder="https://example.com/audio.mp3 atau tautan platform resmi..."
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !isFetchingUrl) {
                      e.preventDefault();
                      handleFetchUrl();
                    }
                  }}
                  className="flex-1 px-3.5 py-2.5 rounded-md border border-[#D8CCB9] bg-[#FFFCF6] text-xs sm:text-sm text-[#332F29] placeholder-[#62584C]/60 focus:outline-none focus:ring-2 focus:ring-[#A34F38]"
                />
                <button
                  type="button"
                  onClick={handleFetchUrl}
                  disabled={!inputUrl.trim() || isFetchingUrl}
                  className="px-5 py-2.5 bg-[#344638] hover:bg-[#253328] text-white text-xs sm:text-sm font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 transition-colors shadow-xs shrink-0"
                >
                  {isFetchingUrl ? (
                    <>
                      <PixelLoader size={14} color="#FFFCF6" />
                      <span>Mengambil...</span>
                    </>
                  ) : (
                    <>
                      <LinkIcon size={14} />
                      <span>Fetch Media</span>
                    </>
                  )}
                </button>
              </div>

              {/* Ethical Watermark & Ownership Notice */}
              <div className="p-2.5 rounded bg-[#F4EBDD]/60 border border-[#D8CCB9]/70 text-[11px] text-[#62584C] flex items-start gap-2">
                <ShieldCheck size={14} className="text-[#344638] shrink-0 mt-0.5" />
                <p className="leading-snug">
                  <strong>Privasi &amp; Hak Cipta:</strong> Fitur ini memproses berkas media yang sah atau berlisensi publik. TokiConvert tidak mendukung penghapusan watermark, bypassing DRM, atau penyalahgunaan hak cipta kreator.
                </p>
              </div>

              {/* Live Terminal Log for URL Fetch */}
              {(isFetchingUrl || urlStatusLog.length > 0) && (
                <TerminalStatus
                  logs={urlStatusLog}
                  currentAction={currentUrlAction}
                  className="mt-1"
                />
              )}
            </div>
          )}

          {/* Audio Queue Items */}
          {items.length > 0 ? (
            <div className="flex flex-col gap-2 mt-1">
              <div className="flex items-center justify-between text-xs text-[#62584C] px-1">
                <span className="font-medium text-[#332F29]">
                  Antrean Audio: {items.length} file{" "}
                  <span className="text-[#62584C] font-normal">
                    ({successCount} selesai{failedCount > 0 ? `, ${failedCount} gagal` : ""})
                  </span>
                </span>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={clearAll}
                  className="text-[#62584C] hover:text-[#A34F38] hover:underline font-medium transition-colors disabled:opacity-50"
                >
                  Clear All
                </button>
              </div>

              <div className="max-h-80 overflow-y-auto space-y-2.5 pr-1">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className={`flex flex-col p-3 rounded-md border transition-colors ${
                      item.status === "failed"
                        ? "border-[#A34F38]/40 bg-[#A34F38]/5"
                        : item.status === "success"
                        ? "border-[#344638]/30 bg-[#344638]/5"
                        : item.status === "processing"
                        ? "border-[#A34F38]/40 bg-[#D4B98A]/10"
                        : "border-[#D8CCB9] bg-[#FFFCF6]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="w-8 h-8 rounded bg-[#D4B98A]/30 flex items-center justify-center text-[#344638] shrink-0">
                          {item.sourceType === "url" ? (
                            <Globe size={16} aria-hidden="true" />
                          ) : (
                            <Volume2 size={16} aria-hidden="true" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p
                              className="truncate text-xs font-semibold text-[#332F29]"
                              title={item.name}
                            >
                              {item.name}
                            </p>
                            <span className="text-[10px] font-bold uppercase px-1.5 py-0.2 rounded bg-[#344638]/10 text-[#344638] border border-[#344638]/20 shrink-0">
                              → {item.targetFormat.toUpperCase()}
                            </span>
                            {item.sourceType === "url" && (
                              <span className="text-[9px] px-1 py-0.2 rounded bg-[#D4B98A]/30 text-[#62584C] border border-[#D8CCB9] shrink-0 font-mono">
                                URL
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2.5 text-[11px] text-[#62584C] mt-0.5">
                            <span>{item.sizeFormatted}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1 font-mono">
                              <Clock size={10} aria-hidden="true" />
                              {item.durationFormatted}
                            </span>
                            {item.convertedSize && (
                              <>
                                <span>•</span>
                                <span className="font-semibold text-[#344638]">
                                  Hasil: {item.convertedSize}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {item.status === "success" && item.convertedUrl && (
                          <button
                            type="button"
                            onClick={() => handleDownloadSingle(item)}
                            className="h-7 px-2.5 rounded text-[11px] font-medium border border-[#344638] text-[#344638] hover:bg-[#344638] hover:text-white inline-flex items-center gap-1 transition-colors"
                            title="Unduh hasil konversi audio"
                          >
                            <Download size={12} aria-hidden="true" />
                            <span>Download</span>
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => removeItem(item.id)}
                          className="p-1 rounded text-[#62584C] hover:text-[#A34F38] hover:bg-[#A34F38]/10 transition-colors disabled:opacity-40"
                          title="Hapus dari antrean"
                          aria-label={`Hapus ${item.name}`}
                        >
                          <Trash2 size={14} aria-hidden="true" />
                        </button>
                      </div>
                    </div>

                    {/* Retro Block Progress Bar during conversion */}
                    {item.status === "processing" && (
                      <div className="mt-2.5 space-y-1">
                        <RetroProgressBar
                          value={item.progress}
                          totalBlocks={14}
                          variant="terracotta"
                          label={item.stageText || "Mengonversi audio..."}
                        />
                      </div>
                    )}

                    {/* Converted Audio Player Preview */}
                    {item.status === "success" && item.convertedUrl && (
                      <div className="mt-2.5 pt-2 border-t border-[#D8CCB9]/40">
                        <p className="text-[10px] uppercase font-semibold text-[#62584C] mb-1">
                          Pratinjau Pemutar Audio:
                        </p>
                        <audio
                          controls
                          src={item.convertedUrl}
                          className="w-full h-8 accent-[#A34F38]"
                          preload="metadata"
                        >
                          Browser kamu tidak mendukung pemutar audio HTML5.
                        </audio>
                      </div>
                    )}

                    {item.status === "failed" && (
                      <div className="mt-1 text-[11px] text-[#A34F38] flex items-center gap-1 font-medium">
                        <AlertCircle size={11} aria-hidden="true" />
                        <span>{item.errorMessage || "Konversi gagal"}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-xs text-[#62584C]/70 border border-dashed border-[#D8CCB9] rounded-lg">
              Belum ada file atau URL audio yang ditambahkan ke antrean.
            </div>
          )}
        </div>

        {/* Right Column: Audio Settings Panel */}
        <div className="w-full lg:w-[350px] xl:w-[370px] bg-[#FFFEFB] border border-[#D8CCB9] rounded-lg p-5 flex flex-col gap-4 shadow-xs shrink-0">
          <div className="flex items-center justify-between pb-3 border-b border-[#D8CCB9]">
            <h2 className="text-xs uppercase tracking-wider font-semibold text-[#332F29] flex items-center gap-2">
              <Sliders size={14} className="text-[#A34F38]" aria-hidden="true" />
              <span>Audio Settings</span>
            </h2>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#F4EBDD] text-[#332F29] border border-[#D8CCB9]">
              {targetFormat.toUpperCase()}
            </span>
          </div>

          {/* Target Format */}
          <div>
            <label className="block text-xs font-medium text-[#332F29] mb-2">
              Output Format
            </label>
            <div
              className="grid grid-cols-2 gap-2"
              role="group"
              aria-label="Format audio tujuan"
            >
              {supportedTargets.map((t) => {
                const isSelected = targetFormat === t.format;
                return (
                  <button
                    key={t.format}
                    type="button"
                    onClick={() => {
                      setTargetFormat(t.format);
                      setItems((prev) =>
                        prev.map((it) =>
                          it.status === "queued" ? { ...it, targetFormat: t.format } : it
                        )
                      );
                    }}
                    className={`p-3 rounded-md border text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#A34F38] flex flex-col items-start ${
                      isSelected
                        ? "border-[#A34F38] bg-[#A34F38]/10 text-[#332F29] ring-1 ring-[#A34F38]"
                        : "border-[#D8CCB9] bg-[#FFFEFB] hover:border-[#A34F38]/60 hover:bg-[#D4B98A]/10 text-[#332F29]"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-bold">{t.label}</span>
                      {isSelected && (
                        <Check size={12} className="text-[#A34F38]" aria-hidden="true" />
                      )}
                    </div>
                    <span className="text-[10px] text-[#62584C] mt-0.5">{t.badge}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-[#62584C] mt-2 leading-relaxed">
              {supportedTargets.find((t) => t.format === targetFormat)?.note}
            </p>
          </div>

          {/* Architecture & SSRF Privacy Disclosures */}
          <div className="p-3.5 rounded-md bg-[#F4EBDD]/60 border border-[#D8CCB9] text-xs space-y-2">
            <div className="flex items-center gap-1.5 font-semibold text-[#332F29]">
              <ShieldCheck size={14} className="text-[#344638]" aria-hidden="true" />
              <span>Privasi &amp; Perlindungan SSRF:</span>
            </div>
            <p className="text-[11px] text-[#62584C] leading-relaxed">
              Konversi audio diproses sepenuhnya di browser via{" "}
              <strong className="text-[#344638]">Web Audio API</strong> dan encoder{" "}
              <strong className="text-[#A34F38]">LAME MP3</strong>. Pengambilan tautan dilindungi
              oleh verifikasi DNS dan pemblokiran IP privat/internal.
            </p>
            <div className="pt-1.5 border-t border-[#D8CCB9]/40 flex items-center justify-between text-[10px] text-[#62584C]">
              <span>Kebutuhan Jaringan:</span>
              <span className="font-semibold text-[#344638]">0 Byte (Offline Encode)</span>
            </div>
          </div>

          {/* Primary Action Button */}
          <div className="pt-2 mt-auto">
            <button
              type="button"
              onClick={convertAll}
              disabled={items.length === 0 || isProcessing}
              className="w-full h-12 flex items-center justify-center gap-2 bg-[#A34F38] text-white px-5 rounded-md text-sm font-medium hover:bg-[#8B3F2A] active:scale-[0.99] disabled:bg-[#A34F38]/40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#A34F38] transition-all shadow-xs"
            >
              {isProcessing ? (
                <>
                  <PixelLoader size={16} color="#FFFFFF" />
                  <span>Memproses Audio...</span>
                </>
              ) : (
                <>
                  <Play size={16} aria-hidden="true" />
                  <span>
                    {items.length > 0 ? `Convert All (${items.length} File)` : "Convert"}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
