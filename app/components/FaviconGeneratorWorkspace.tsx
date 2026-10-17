"use client";

import { useState, useRef, ChangeEvent, DragEvent, useEffect } from "react";
import Image from "next/image";
import {
  Upload,
  Check,
  AlertCircle,
  Copy,
  Sliders,
  Sparkles,
  Sun,
  Moon,
  Trash2,
  FileCode,
  Layers,
  Archive,
} from "lucide-react";
import RetroProgressBar from "./RetroProgressBar";
import PixelLoader from "./PixelLoader";
import {
  generateFaviconPack,
  FaviconOptions,
  GenerationResult,
} from "../lib/faviconGenerator";

export default function FaviconGeneratorWorkspace() {
  const [file, setFile] = useState<File | null>(null);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Settings
  const [bgChoice, setBgChoice] = useState<"transparent" | "white" | "custom">("transparent");
  const [customColor, setCustomColor] = useState<string>("#344638");
  const [paddingPercent, setPaddingPercent] = useState<number>(5);
  const [appName, setAppName] = useState<string>("My Application");
  const [shortName, setShortName] = useState<string>("App");
  const [includeSvg, setIncludeSvg] = useState<boolean>(true);

  // Preview tab theme (light/dark)
  const [previewTheme, setPreviewTheme] = useState<"light" | "dark">("light");

  // Processing state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [progressStatus, setProgressStatus] = useState<string>("");
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [copiedHtml, setCopiedHtml] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Bersihkan object URL preview saat file berganti
  useEffect(() => {
    return () => {
      if (previewSrc) {
        URL.revokeObjectURL(previewSrc);
      }
    };
  }, [previewSrc]);

  const validateAndSetFile = (selectedFile: File) => {
    setErrorMessage(null);
    setResult(null);

    const validTypes = [
      "image/png",
      "image/svg+xml",
      "image/jpeg",
      "image/jpg",
      "image/webp",
      "image/x-icon",
      "image/vnd.microsoft.icon",
    ];

    const isSvgExt = selectedFile.name.toLowerCase().endsWith(".svg");
    const isIcoExt = selectedFile.name.toLowerCase().endsWith(".ico");

    if (!validTypes.includes(selectedFile.type) && !isSvgExt && !isIcoExt) {
      setErrorMessage("Format berkas tidak didukung. Harap unggah berkas PNG, SVG, JPG, atau WebP.");
      return;
    }

    if (selectedFile.size > 20 * 1024 * 1024) {
      setErrorMessage("Ukuran berkas melebihi batas 20 MB. Harap pilih gambar yang lebih kecil.");
      return;
    }

    // Default nama aplikasi dari nama file tanpa ekstensi
    const baseName = selectedFile.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
    const formattedName = baseName.charAt(0).toUpperCase() + baseName.slice(1);
    setAppName(formattedName);
    setShortName(formattedName.slice(0, 12));

    const newUrl = URL.createObjectURL(selectedFile);
    setFile(selectedFile);
    setPreviewSrc(newUrl);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleReset = () => {
    if (previewSrc) {
      URL.revokeObjectURL(previewSrc);
    }
    setFile(null);
    setPreviewSrc(null);
    setResult(null);
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleGenerate = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProgressPercent(0);
    setProgressStatus("Menyiapkan prosesor...");
    setErrorMessage(null);

    const effectiveBg =
      bgChoice === "transparent" ? "transparent" : bgChoice === "white" ? "#ffffff" : customColor;

    const options: FaviconOptions = {
      appName: appName.trim() || "My Application",
      shortName: shortName.trim() || "App",
      backgroundColor: effectiveBg,
      paddingPercent,
      includeSvgIfAvailable: includeSvg,
    };

    try {
      const genResult = await generateFaviconPack(file, options, (pct, msg) => {
        setProgressPercent(pct);
        setProgressStatus(msg);
      });
      setResult(genResult);
    } catch (err: unknown) {
      const errText = err instanceof Error ? err.message : "Terjadi kesalahan saat memproses favicon pack";
      setErrorMessage(errText);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadZip = () => {
    if (!result) return;
    const downloadUrl = URL.createObjectURL(result.zipBlob);
    const link = document.createElement("a");
    const safeZipName = (appName || "favicon").toLowerCase().replace(/[^a-z0-9]/g, "-");
    link.href = downloadUrl;
    link.download = `${safeZipName}-favicon-pack.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(downloadUrl);
  };

  const handleCopyHtml = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.htmlSnippet);
    setCopiedHtml(true);
    setTimeout(() => setCopiedHtml(false), 2500);
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(2)} MB`;
  };

  return (
    <div className="w-full space-y-6">
      {/* Upload & Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Kolom Kiri: Dropzone & Live Preview Mockup (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {!file ? (
            /* Upload Dropzone */
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 bg-[#FFFCF6] flex flex-col items-center justify-center min-h-[340px] shadow-xs ${isDragging
                ? "border-[#A34F38] bg-[#F4EBDD]/60 scale-[0.99]"
                : "border-[#D8CCB9] hover:border-[#A34F38]/60 hover:bg-[#F4EBDD]/25"
                }`}
              role="button"
              tabIndex={0}
              aria-label="Upload logo untuk membuat favicon pack"
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  fileInputRef.current?.click();
                }
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/svg+xml,image/jpeg,image/webp,image/x-icon"
                className="hidden"
                onChange={handleFileChange}
              />
              <div className="w-14 h-14 rounded-full bg-[#F4EBDD] border border-[#D8CCB9] flex items-center justify-center text-[#A34F38] mb-4 shadow-2xs group-hover:scale-110 transition-transform">
                <Upload size={24} aria-hidden="true" />
              </div>
              <h2 className="text-base sm:text-lg font-serif font-bold text-[#332F29]">
                Pilih atau Tarik Logo ke Sini
              </h2>
              <p className="text-xs sm:text-sm text-[#62584C] mt-1.5 max-w-sm">
                Unggah satu gambar logo (PNG, SVG, JPG, WebP). Kami akan merender seluruh variasi favicon secara instan di peramban Anda.
              </p>
              <div className="inline-flex items-center gap-2 mt-4 px-3 py-1 rounded-md bg-[#F4EBDD]/70 border border-[#D8CCB9] text-[11px] font-mono text-[#62584C]">
                <span>Resolusi ideal: 512×512 px ke atas</span>
                <span className="text-[#A34F38]">·</span>
                <span>Maks 20 MB</span>
              </div>
            </div>
          ) : (
            /* File Preview & Mockup Stage */
            <div className="border border-[#D8CCB9] bg-[#FFFCF6] rounded-xl p-5 space-y-4 shadow-xs">
              {/* Header preview & Reset button */}
              <div className="flex items-center justify-between border-b border-[#D8CCB9]/70 pb-3">
                <div className="flex items-center gap-2.5 truncate pr-2">
                  <div className="w-8 h-8 rounded bg-[#F4EBDD] border border-[#D8CCB9] flex items-center justify-center text-[#344638] shrink-0 font-mono text-xs font-bold">
                    {file.name.split(".").pop()?.toUpperCase()}
                  </div>
                  <div className="truncate">
                    <p className="text-xs sm:text-sm font-semibold text-[#332F29] truncate">{file.name}</p>
                    <p className="text-[11px] font-mono text-[#62584C]">{formatBytes(file.size)}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs text-[#A34F38] hover:bg-[#A34F38]/10 hover:underline transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-[#A34F38]"
                >
                  <Trash2 size={13} aria-hidden="true" />
                  <span>Ganti Logo</span>
                </button>
              </div>

              {/* Dual Environment Preview Controls */}
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="font-serif font-bold text-[#332F29] flex items-center gap-1.5">
                  <Sparkles size={14} className="text-[#344638]" aria-hidden="true" />
                  Pratinjau Multi-Lingkungan
                </span>

                <div className="inline-flex items-center border border-[#D8CCB9] rounded-lg p-0.5 bg-[#F4EBDD]/50">
                  <button
                    type="button"
                    onClick={() => setPreviewTheme("light")}
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-colors ${previewTheme === "light"
                      ? "bg-[#FFFCF6] text-[#332F29] shadow-2xs font-semibold"
                      : "text-[#62584C] hover:text-[#332F29]"
                      }`}
                  >
                    <Sun size={12} aria-hidden="true" />
                    <span>Terang</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewTheme("dark")}
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-colors ${previewTheme === "dark"
                      ? "bg-[#2A2621] text-[#FFFCF6] shadow-2xs font-semibold"
                      : "text-[#62584C] hover:text-[#332F29]"
                      }`}
                  >
                    <Moon size={12} aria-hidden="true" />
                    <span>Gelap</span>
                  </button>
                </div>
              </div>

              {/* Realistic Mockup Stage */}
              <div
                className={`border border-[#D8CCB9] rounded-lg p-4 sm:p-6 transition-colors duration-200 ${previewTheme === "light" ? "bg-[#F4EBDD]/40" : "bg-[#1E1B18] text-[#FFFCF6]"
                  }`}
              >
                {/* Mockup 1: Browser Tab Simulation */}
                <div className="space-y-1.5">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-[#62584C]">
                    Simulasi Tab Peramban (16px / 32px)
                  </p>
                  <div
                    className={`border border-[#D8CCB9]/70 rounded-t-lg p-2 flex items-center gap-2 max-w-xs text-xs ${previewTheme === "light" ? "bg-[#FFFCF6] text-[#332F29]" : "bg-[#2A2621] text-[#FFFCF6]"
                      }`}
                  >
                    {/* Mini icon on tab */}
                    <div
                      className="w-4 h-4 rounded-xs shrink-0 flex items-center justify-center overflow-hidden border border-[#D8CCB9]/40"
                      style={{
                        backgroundColor:
                          bgChoice === "transparent"
                            ? "transparent"
                            : bgChoice === "white"
                              ? "#ffffff"
                              : customColor,
                        padding: `${paddingPercent}%`,
                      }}
                    >
                      {previewSrc && (
                        <Image
                          src={previewSrc}
                          alt="Tab icon preview"
                          width={16}
                          height={16}
                          unoptimized
                          className="w-full h-full object-contain"
                        />
                      )}
                    </div>
                    <span className="truncate font-medium text-[11px]">{appName || "My Application"}</span>
                  </div>
                </div>

                {/* Mockup 2: Large Icon Preview (Apple Touch / Android Chrome) */}
                <div className="mt-5 pt-4 border-t border-[#D8CCB9]/40 grid grid-cols-2 gap-4">
                  {/* Square with rounded corner preview */}
                  <div className="flex flex-col items-center justify-center p-3 text-center space-y-2">
                    <p className="text-[10px] font-mono text-[#62584C]">Homescreen (180px)</p>
                    <div
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl shadow-sm border border-[#D8CCB9]/60 flex items-center justify-center overflow-hidden transition-all"
                      style={{
                        backgroundColor:
                          bgChoice === "transparent"
                            ? "transparent"
                            : bgChoice === "white"
                              ? "#ffffff"
                              : customColor,
                        padding: `${paddingPercent}%`,
                      }}
                    >
                      {previewSrc && (
                        <Image
                          src={previewSrc}
                          alt="Mobile icon preview"
                          width={80}
                          height={80}
                          unoptimized
                          className="w-full h-full object-contain"
                        />
                      )}
                    </div>
                  </div>

                  {/* Circular preview */}
                  <div className="flex flex-col items-center justify-center p-3 text-center space-y-2">
                    <p className="text-[10px] font-mono text-[#62584C]">Android Adaptive (Circle)</p>
                    <div
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-full shadow-sm border border-[#D8CCB9]/60 flex items-center justify-center overflow-hidden transition-all"
                      style={{
                        backgroundColor:
                          bgChoice === "transparent"
                            ? "transparent"
                            : bgChoice === "white"
                              ? "#ffffff"
                              : customColor,
                        padding: `${paddingPercent}%`,
                      }}
                    >
                      {previewSrc && (
                        <Image
                          src={previewSrc}
                          alt="Circle icon preview"
                          width={80}
                          height={80}
                          unoptimized
                          className="w-full h-full object-contain"
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Pesan Kesalahan */}
          {errorMessage && (
            <div
              role="alert"
              className="p-3.5 bg-[#A34F38]/10 border border-[#A34F38]/30 rounded-lg flex items-start gap-2 text-xs text-[#A34F38]"
            >
              <AlertCircle size={16} className="shrink-0 mt-0.5" aria-hidden="true" />
              <p className="leading-relaxed font-medium">{errorMessage}</p>
            </div>
          )}
        </div>

        {/* Kolom Kanan: Pengaturan & Tombol Generate (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="border border-[#D8CCB9] bg-[#FFFCF6] rounded-xl p-5 space-y-4 shadow-xs">
            <div className="flex items-center gap-2 border-b border-[#D8CCB9]/70 pb-3">
              <Sliders size={18} className="text-[#344638]" aria-hidden="true" />
              <h3 className="text-sm font-serif font-bold text-[#332F29]">
                Pengaturan Paket Favicon
              </h3>
            </div>

            {/* Pilihan Background Color */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-[#332F29]">
                Latar Belakang Ikon
              </label>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setBgChoice("transparent")}
                  className={`px-3 py-2 rounded-lg border text-center transition-all ${bgChoice === "transparent"
                    ? "border-[#A34F38] bg-[#A34F38]/10 font-bold text-[#A34F38]"
                    : "border-[#D8CCB9] bg-[#FFFCF6] text-[#62584C] hover:border-[#A34F38]/40"
                    }`}
                >
                  Transparan
                </button>
                <button
                  type="button"
                  onClick={() => setBgChoice("white")}
                  className={`px-3 py-2 rounded-lg border text-center transition-all ${bgChoice === "white"
                    ? "border-[#A34F38] bg-[#A34F38]/10 font-bold text-[#A34F38]"
                    : "border-[#D8CCB9] bg-[#FFFCF6] text-[#62584C] hover:border-[#A34F38]/40"
                    }`}
                >
                  Putih (#FFF)
                </button>
                <button
                  type="button"
                  onClick={() => setBgChoice("custom")}
                  className={`px-3 py-2 rounded-lg border text-center transition-all flex items-center justify-center gap-1.5 ${bgChoice === "custom"
                    ? "border-[#A34F38] bg-[#A34F38]/10 font-bold text-[#A34F38]"
                    : "border-[#D8CCB9] bg-[#FFFCF6] text-[#62584C] hover:border-[#A34F38]/40"
                    }`}
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-black/20 shrink-0"
                    style={{ backgroundColor: customColor }}
                  />
                  <span>Warna</span>
                </button>
              </div>

              {bgChoice === "custom" && (
                <div className="pt-2 flex items-center gap-2">
                  <input
                    type="color"
                    value={customColor}
                    onChange={(e) => setCustomColor(e.target.value)}
                    className="w-9 h-8 p-0.5 rounded border border-[#D8CCB9] cursor-pointer bg-white"
                    aria-label="Pilih warna latar belakang kustom"
                  />
                  <input
                    type="text"
                    value={customColor}
                    onChange={(e) => setCustomColor(e.target.value)}
                    placeholder="#RRGGBB"
                    className="flex-1 px-3 py-1.5 text-xs font-mono border border-[#D8CCB9] rounded-lg bg-[#FFFCF6] text-[#332F29] focus:outline-none focus:ring-1 focus:ring-[#A34F38]"
                  />
                </div>
              )}
            </div>

            {/* Slider Padding */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs">
                <label htmlFor="padding-slider" className="font-medium text-[#332F29]">
                  Padding Logo (Inner Margin)
                </label>
                <span className="font-mono text-[11px] text-[#A34F38] font-bold">
                  {paddingPercent}%
                </span>
              </div>
              <input
                id="padding-slider"
                type="range"
                min="0"
                max="25"
                step="1"
                value={paddingPercent}
                onChange={(e) => setPaddingPercent(Number(e.target.value))}
                className="w-full accent-[#A34F38] cursor-pointer"
              />
              <p className="text-[11px] text-[#62584C] leading-snug">
                Rekomendasi 5–10% agar logo tidak terpotong pada ikon Android &amp; iOS.
              </p>
            </div>

            {/* Nama Aplikasi untuk site.webmanifest */}
            <div className="space-y-2 pt-1 border-t border-[#D8CCB9]/50">
              <div>
                <label htmlFor="app-name-input" className="block text-xs font-medium text-[#332F29]">
                  Nama Aplikasi (Manifest Name)
                </label>
                <input
                  id="app-name-input"
                  type="text"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  placeholder="Contoh: TokiConvert"
                  className="w-full mt-1 px-3 py-1.5 text-xs border border-[#D8CCB9] rounded-lg bg-[#FFFCF6] text-[#332F29] focus:outline-none focus:ring-1 focus:ring-[#A34F38]"
                />
              </div>

              <div>
                <label htmlFor="short-name-input" className="block text-xs font-medium text-[#332F29]">
                  Nama Singkat (Short Name)
                </label>
                <input
                  id="short-name-input"
                  type="text"
                  value={shortName}
                  onChange={(e) => setShortName(e.target.value)}
                  placeholder="Contoh: Toki"
                  maxLength={12}
                  className="w-full mt-1 px-3 py-1.5 text-xs border border-[#D8CCB9] rounded-lg bg-[#FFFCF6] text-[#332F29] focus:outline-none focus:ring-1 focus:ring-[#A34F38]"
                />
              </div>
            </div>

            {/* Checkbox SVG bila input berkas SVG */}
            {file && (file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg")) && (
              <div className="pt-2 border-t border-[#D8CCB9]/50">
                <label className="flex items-center gap-2 text-xs text-[#332F29] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeSvg}
                    onChange={(e) => setIncludeSvg(e.target.checked)}
                    className="accent-[#A34F38] rounded"
                  />
                  <span>Sertakan <code className="font-mono text-[#A34F38]">favicon.svg</code> asli dalam ZIP</span>
                </label>
              </div>
            )}

            {/* Tombol Utama: Generate Favicon Pack */}
            <div className="pt-2">
              <button
                type="button"
                disabled={!file || isProcessing}
                onClick={handleGenerate}
                className="w-full py-3 px-4 rounded-lg bg-[#A34F38] hover:bg-[#8B3F2A] disabled:opacity-50 disabled:cursor-not-allowed text-[#FFFCF6] font-medium text-sm transition-all shadow-2xs flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#A34F38]"
              >
                {isProcessing ? (
                  <>
                    <PixelLoader size={16} color="#FFFCF6" />
                    <span>Merender Favicon Pack...</span>
                  </>
                ) : (
                  <>
                    <Layers size={16} aria-hidden="true" />
                    <span>Generate Favicon Pack</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar Vintage saat memproses */}
      {isProcessing && (
        <div className="border border-[#D8CCB9] bg-[#FFFCF6] rounded-xl p-5 shadow-xs animate-in fade-in-50 duration-200">
          <RetroProgressBar value={progressPercent} label={progressStatus} />
        </div>
      )}

      {/* Hasil Pembuatan & Tombol Download ZIP */}
      {result && !isProcessing && (
        <div className="border border-[#D8CCB9] bg-[#FFFCF6] rounded-xl p-6 sm:p-8 space-y-6 shadow-xs animate-in fade-in-50 duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#D8CCB9]/70 pb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#344638]/15 text-[#344638] text-xs font-semibold">
                <Check size={13} aria-hidden="true" />
                <span>Paket Favicon Berhasil Dibuat</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#332F29] mt-1">
                Favicon Pack Siap Diunduh
              </h3>
              <p className="text-xs text-[#62584C]">
                Total {result.files.length} berkas terkompresi dalam arsip ZIP ({formatBytes(result.zipSize)}).
              </p>
            </div>

            <button
              type="button"
              onClick={handleDownloadZip}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-[#344638] hover:bg-[#28362b] text-[#FFFCF6] font-medium text-sm transition-all shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-[#344638] shrink-0"
            >
              <Archive size={17} aria-hidden="true" />
              <span>Download ZIP ({formatBytes(result.zipSize)})</span>
            </button>
          </div>

          {/* Rincian Berkas yang Dihasilkan */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#A34F38]">
              Daftar Berkas di Dalam Paket ZIP:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {result.files.map((item, idx) => (
                <div
                  key={idx}
                  className="border border-[#D8CCB9] bg-[#F4EBDD]/40 rounded-lg p-2.5 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2 truncate pr-2">
                    {item.previewUrl ? (
                      <div className="w-7 h-7 rounded bg-[#FFFCF6] border border-[#D8CCB9] flex items-center justify-center overflow-hidden shrink-0">
                        <Image
                          src={item.previewUrl}
                          alt={item.name}
                          width={24}
                          height={24}
                          unoptimized
                          className="w-full h-full object-contain"
                        />
                      </div>
                    ) : (
                      <div className="w-7 h-7 rounded bg-[#FFFCF6] border border-[#D8CCB9] flex items-center justify-center text-[#62584C] shrink-0">
                        <FileCode size={14} aria-hidden="true" />
                      </div>
                    )}
                    <div className="truncate">
                      <p className="font-mono font-semibold text-[#332F29] truncate">{item.name}</p>
                      <p className="text-[10px] text-[#62584C]">{item.dimensions}</p>
                    </div>
                  </div>
                  <span className="font-mono text-[11px] text-[#62584C] shrink-0">
                    {formatBytes(item.sizeBytes)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Cuplikan Kode HTML untuk &lt;head&gt; */}
          <div className="space-y-2 pt-2 border-t border-[#D8CCB9]/60">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-serif font-bold text-[#332F29] flex items-center gap-1.5">
                <FileCode size={15} className="text-[#344638]" aria-hidden="true" />
                <span>Salin Tag HTML untuk Bagian &lt;head&gt;</span>
              </h4>
              <button
                type="button"
                onClick={handleCopyHtml}
                className="inline-flex items-center gap-1 text-xs text-[#A34F38] hover:text-[#8B3F2A] hover:underline font-medium focus:outline-none focus-visible:ring-1 focus-visible:ring-[#A34F38]"
              >
                {copiedHtml ? (
                  <>
                    <Check size={13} className="text-[#344638]" aria-hidden="true" />
                    <span className="text-[#344638]">Tersalin ke Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy size={13} aria-hidden="true" />
                    <span>Salin Kode HTML</span>
                  </>
                )}
              </button>
            </div>

            <pre className="p-3 bg-[#F4EBDD]/50 border border-[#D8CCB9] rounded-lg text-[11px] font-mono text-[#332F29] overflow-x-auto whitespace-pre-wrap leading-relaxed select-all">
              {result.htmlSnippet}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
