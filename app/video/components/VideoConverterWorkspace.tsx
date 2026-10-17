"use client";

import { useState, useRef, useCallback } from "react";
import { useVideoProcessor } from "../hooks/useVideoProcessor";
import RetroProgressBar from "../../components/RetroProgressBar";
import { Upload, Trash2, Download, AlertCircle, CheckCircle, Loader2 } from "lucide-react";

const SUPPORTED_INPUTS = [".mp4", ".webm", ".mov", ".avi", ".mkv"];
const SUPPORTED_OUTPUTS = ["mp4", "webm"];
const MAX_SIZE_MB = 50;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

export default function VideoConverterWorkspace() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [outputFormat, setOutputFormat] = useState<string>(SUPPORTED_OUTPUTS[0]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    status,
    progress,
    error,
    resultUrl,
    processVideo,
    reset,
  } = useVideoProcessor();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!SUPPORTED_INPUTS.includes(ext)) {
      alert("Format file tidak didukung. Gunakan MP4, WebM, MOV, AVI, atau MKV.");
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      alert(`Ukuran file melebihi ${MAX_SIZE_MB} MB.`);
      return;
    }
    setSelectedFile(file);
  };

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!SUPPORTED_INPUTS.includes(ext)) {
      alert("Format file tidak didukung.");
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      alert(`File melebihi ${MAX_SIZE_MB} MB.`);
      return;
    }
    setSelectedFile(file);
  }, []);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const startConversion = async () => {
    if (!selectedFile) return;
    try {
      await processVideo(selectedFile, outputFormat);
    } catch (err) {
      console.error("Konversi gagal:", err);
    }
  };

  const handleDownload = () => {
    if (!resultUrl) return;
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = `converted.${outputFormat}`;
    a.click();
  };

  const clearFile = () => {
    if (selectedFile) setSelectedFile(null);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    reset();
  };

  // Status UI
  const getStatusText = () => {
    switch (status) {
      case "loading": return "Memuat engine FFmpeg...";
      case "processing": return `Mengonversi video... (${progress}%)`;
      case "done": return "Konversi selesai.";
      case "error": return `Error: ${error}`;
      default: return "Pilih file video untuk mengonversi.";
    }
  };

  const isIdle = status === "idle";
  const isActive = status === "loading" || status === "processing";

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto p-6 space-y-6 bg-[#FFFCF6] rounded-lg border border-[#D8CCB9] shadow-xs">
      {/* Header */}
      <header className="text-center space-y-2">
        <p className="text-xs font-semibold tracking-wider uppercase text-[#A34F38]">
          VIDEO CONVERTER · CLIENT-SIDE (WASM)
        </p>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#332F29] tracking-tight">
          Konversi Video</h1>
        <p className="text-sm text-[#62584C] max-w-lg mx-auto">
          Pilih file video lokal (MP4, WebM, MOV, AVI, MKV) &mdash; pemrosesan di browser, tidak pernah meninggalkan perangkat.
        </p>
      </header>

      {/* File Drop Zone */}
      <section
        onDrop={onDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`w-full border-2 border-dashed rounded-lg p-8 sm:p-12 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#A34F38] ${isDragging ? "border-[#A34F38] bg-[#D4B98A]/25" : "border-[#D8CCB9] bg-[#FFFCF6] hover:border-[#A34F38]/70 hover:bg-[#D4B98A]/10"}`}
        role="button"
        tabIndex={0}
        aria-label="Area upload video"
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept={".mp4,.webm,.mov,.avi,.mkv"}
          hidden
        />
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[#D4B98A]/30 border border-[#D8CCB9]/60 flex items-center justify-center text-[#344638]">
            <Upload size={28} aria-hidden="true" />
          </div>
          <p className="font-serif text-base text-[#332F29] text-center">
            Drag & drop file video atau klik untuk memilih.<br />
            <span className="text-xs text-[#62584C]">Mendukung: MP4, WebM, MOV, AVI, MKV &mdash; Maks {MAX_SIZE_MB} MB</span>
          </p>
          {selectedFile && (
            <div className="mt-2 text-sm text-[#332F29] font-medium">
              Dipilih: {selectedFile.name} &mdash; {formatSize(selectedFile.size)}
            </div>
          )}
        </div>
      </section>

      {/* Output Format Selector */}
      <section className="w-full space-y-3">
        <label className="block text-xs font-semibold uppercase tracking-wider text-[#332F29]">Format Output</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {SUPPORTED_OUTPUTS.map((fmt) => (
            <button
              key={fmt}
              type="button"
              onClick={() => setOutputFormat(fmt)}
              className={`p-3 rounded-lg border text-sm font-medium transition-colors ${outputFormat === fmt ? "border-[#A34F38] bg-[#A34F38]/10 text-[#332F29] ring-2 ring-[#A34F38]" : "border-[#D8CCB9] bg-[#FFFCF6] hover:border-[#A34F38]/60 hover:text-[#332F29]"}`}
            >
              .{fmt.toUpperCase()}
            </button>
          ))}
        </div>
      </section>

      {/* Controls */}
      <section className="w-full flex flex-col sm:flex-row gap-4 justify-between">
        <button
          onClick={clearFile}
          disabled={isActive}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-lg border border-[#D8CCB9] bg-[#FFFCF6] text-sm font-medium hover:bg-[#D4B98A]/20 transition-colors disabled:opacity-50"
        >
          <Trash2 size={16} />
          Hapus
        </button>

        <button
          onClick={startConversion}
          disabled={!selectedFile || isActive || isIdle === false}
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-[#A34F38] text-white text-sm font-medium hover:bg-[#8B3F2A] active:scale-[0.99] disabled:bg-[#A34F38]/40 disabled:cursor-not-allowed transition-all shadow-xs"
        >
          {status === "loading" && <Loader2 size={16} className="animate-spin" />}
          {status === "processing" && <Loader2 size={16} className="animate-spin" />}
          {status === "idle" && <Upload size={16} />}
          {status === "done" && <CheckCircle size={16} />}
          <span>
            {status === "idle" && "Mulai Konversi"}
            {status === "loading" && "Memuat Engine..."}
            {status === "processing" && `Mengonversi (${progress}%)`}
            {status === "done" && "Selesai"}
            {status === "error" && "Coba Lagi"}
          </span>
        </button>

        {resultUrl && (
          <button
            onClick={handleDownload}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-lg border border-[#344638] bg-[#344638] text-white text-sm font-medium hover:bg-[#253328] transition-colors"
          >
            <Download size={16} />
            Unduh Hasil
          </button>
        )}
      </section>

      {/* Status Message */}
      {(status !== "idle" || error) && (
        <section className="w-full mt-2">
          <div
            className={`rounded-md p-4 border text-sm flex items-start gap-3 ${status === "error" ? "border-[#A34F38]/40 bg-[#A34F38]/5 text-[#A34F38]" : status === "done" ? "border-[#344638]/40 bg-[#344638]/5 text-[#344638]" : status === "loading" || status === "processing" ? "border-[#D8CCB9] bg-[#FFFCF6]" : ""}`}
          >
            {status === "loading" && <Loader2 size={18} className="shrink-0 animate-spin" />}
            {status === "processing" && <Loader2 size={18} className="shrink-0" />}
            {status === "done" && <CheckCircle size={18} className="shrink-0" />}
            {status === "error" && <AlertCircle size={18} className="shrink-0" />}
            <div className="min-w-0">{getStatusText()}</div>
          </div>
          {status === "error" && error && (
            <div className="mt-2 text-xs text-[#A34F38] font-mono bg-[#A34F38]/5 p-2 rounded border border-[#A34F38]/20">
              {error}
            </div>
          )}
        </section>
      )}

      {/* Progress bar saat processing */}
      {status === "processing" && (
        <RetroProgressBar
          value={progress}
          totalBlocks={16}
          variant="terracotta"
          label={`Mengonversi ke video/${outputFormat} (${progress}%)`}
          showPercentage={true}
        />
      )}
    </div>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(2)} MB`;
}