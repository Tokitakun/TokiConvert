"use client";

import { useState, useRef, useEffect, DragEvent } from "react";
import {
  Download,
  Trash2,
  Check,
  Sliders,
  FileText,
  FileCode,
  Image as ImageIcon,
  Eye,
  Info,
} from "lucide-react";
import {
  convertTxtToPdf,
  convertImagesToPdf,
  convertDocxToHtml,
  ImageToPdfLayout,
} from "../lib/documentConverter";
import RetroProgressBar from "./RetroProgressBar";
import PixelLoader from "./PixelLoader";

export type DocumentMode = "txt-to-pdf" | "images-to-pdf" | "docx-to-html";

interface DocumentQueueItem {
  id: string;
  file: File;
  name: string;
  sizeFormatted: string;
  status: "queued" | "processing" | "success" | "failed";
  errorMessage?: string;
  convertedBlob?: Blob;
  convertedUrl?: string;
  convertedSize?: string;
  convertedHtml?: string;
  warnings?: string[];
}

export default function DocumentConverterWorkspace() {
  const [mode, setMode] = useState<DocumentMode>("txt-to-pdf");
  const [items, setItems] = useState<DocumentQueueItem[]>([]);
  const [imageLayout, setImageLayout] = useState<ImageToPdfLayout>("a4-portrait");
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const modes: { mode: DocumentMode; title: string; badge: string; desc: string; accept: string }[] = [
    {
      mode: "txt-to-pdf",
      title: "TXT to PDF",
      badge: "Text Document",
      desc: "Konversi file teks polos (.txt) menjadi dokumen PDF dengan format halaman A4 dan pemotongan baris rapi.",
      accept: ".txt,text/plain",
    },
    {
      mode: "images-to-pdf",
      title: "Images to PDF",
      badge: "Photo / Scan",
      desc: "Gabungkan atau konversi gambar PNG dan JPG menjadi dokumen PDF berkualitas tinggi.",
      accept: "image/png,image/jpeg,.png,.jpg,.jpeg",
    },
    {
      mode: "docx-to-html",
      title: "DOCX to HTML",
      badge: "Word Parser",
      desc: "Ekstrak dan konversi dokumen Word (.docx) menjadi HTML bersih dan aman (sanitized) untuk web.",
      accept: ".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    },
  ];

  const currentModeInfo = modes.find((m) => m.mode === mode)!;

  const formatSize = (bytes: number): string => {
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

  const addFiles = (fileList: FileList) => {
    const newItems: DocumentQueueItem[] = [];
    const errors: string[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const ext = `.${file.name.split(".").pop()?.toLowerCase()}`;

      if (file.size === 0) {
        errors.push(`File '${file.name}' kosong (0 byte).`);
        continue;
      }
      if (file.size > 25 * 1024 * 1024) {
        errors.push(`File '${file.name}' melebihi batas 25 MB.`);
        continue;
      }

      // Format validation per mode
      if (mode === "txt-to-pdf" && ext !== ".txt") {
        errors.push(`File '${file.name}' bukan file teks (.txt).`);
        continue;
      }
      if (mode === "images-to-pdf" && !file.type.startsWith("image/") && ext !== ".png" && ext !== ".jpg" && ext !== ".jpeg") {
        errors.push(`File '${file.name}' bukan gambar PNG atau JPG.`);
        continue;
      }
      if (mode === "docx-to-html" && ext !== ".docx") {
        errors.push(`File '${file.name}' bukan berkas Word (.docx).`);
        continue;
      }

      newItems.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        file,
        name: file.name,
        sizeFormatted: formatSize(file.size),
        status: "queued",
      });
    }

    if (errors.length > 0) {
      setErrorMessages((prev) => [...prev, ...errors]);
    }
    if (newItems.length > 0) {
      setItems((prev) => [...prev, ...newItems]);
      setStatusMessage(`${newItems.length} file ditambahkan ke antrean.`);
    }
  };

  const handleModeChange = (newMode: DocumentMode) => {
    if (isProcessing) return;
    setMode(newMode);
    // Clear items when switching modes to avoid invalid state
    items.forEach((it) => {
      if (it.convertedUrl) URL.revokeObjectURL(it.convertedUrl);
    });
    setItems([]);
    setErrorMessages([]);
    setPreviewHtml(null);
    setStatusMessage(`Mode diganti ke ${modes.find((m) => m.mode === newMode)?.title}`);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      addFiles(e.dataTransfer.files);
    }
  };

  const convertAll = async () => {
    if (items.length === 0 || isProcessing) return;
    setIsProcessing(true);
    setStatusMessage(`Memproses konversi dokumen...`);

    if (mode === "images-to-pdf") {
      // Batch mode: combine all images into one PDF
      setItems((prev) => prev.map((it) => ({ ...it, status: "processing" })));
      try {
        const filesToConvert = items.map((it) => it.file);
        const pdfBlob = await convertImagesToPdf(filesToConvert, imageLayout);
        const convertedUrl = URL.createObjectURL(pdfBlob);
        const convertedSize = formatSize(pdfBlob.size);

        setItems((prev) =>
          prev.map((it, idx) =>
            idx === 0
              ? {
                  ...it,
                  status: "success",
                  convertedBlob: pdfBlob,
                  convertedUrl,
                  convertedSize,
                }
              : { ...it, status: "success" }
          )
        );
        setStatusMessage("Dokumen PDF berhasil dibuat dari rangkaian gambar.");
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Gagal membuat PDF dari gambar";
        setItems((prev) => prev.map((it) => ({ ...it, status: "failed", errorMessage: msg })));
      }
    } else {
      // Individual file processing for TXT and DOCX
      for (const item of items) {
        setItems((prev) =>
          prev.map((it) => (it.id === item.id ? { ...it, status: "processing", errorMessage: undefined } : it))
        );

        try {
          if (mode === "txt-to-pdf") {
            const pdfBlob = await convertTxtToPdf(item.file);
            const convertedUrl = URL.createObjectURL(pdfBlob);
            const convertedSize = formatSize(pdfBlob.size);
            setItems((prev) =>
              prev.map((it) =>
                it.id === item.id
                  ? {
                      ...it,
                      status: "success",
                      convertedBlob: pdfBlob,
                      convertedUrl,
                      convertedSize,
                    }
                  : it
              )
            );
          } else if (mode === "docx-to-html") {
            const res = await convertDocxToHtml(item.file);
            const htmlBlob = new Blob([res.html], { type: "text/html;charset=utf-8" });
            const convertedUrl = URL.createObjectURL(htmlBlob);
            const convertedSize = formatSize(htmlBlob.size);
            setItems((prev) =>
              prev.map((it) =>
                it.id === item.id
                  ? {
                      ...it,
                      status: "success",
                      convertedBlob: htmlBlob,
                      convertedUrl,
                      convertedSize,
                      convertedHtml: res.html,
                      warnings: res.warnings,
                    }
                  : it
              )
            );
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Gagal mengonversi dokumen";
          setItems((prev) =>
            prev.map((it) => (it.id === item.id ? { ...it, status: "failed", errorMessage: msg } : it))
          );
        }
      }
      setStatusMessage("Proses konversi dokumen selesai.");
    }

    setIsProcessing(false);
  };

  const handleDownload = (item: DocumentQueueItem) => {
    if (!item.convertedUrl) return;
    const baseName = item.name.replace(/\.[^/.]+$/, "");
    const ext = mode === "docx-to-html" ? "html" : "pdf";
    const downloadName = `${baseName}_converted.${ext}`;
    const a = document.createElement("a");
    a.href = item.convertedUrl;
    a.download = downloadName;
    a.click();
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
    setPreviewHtml(null);
    setStatusMessage("Semua file dihapus dari antrean.");
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
            <span className="text-xs text-[#A34F38] font-mono animate-pulse">
              Memproses...
            </span>
          )}
        </div>
      )}

      {errorMessages.length > 0 && (
        <div className="p-4 rounded-md border border-[#A34F38]/30 bg-[#A34F38]/5 space-y-1">
          {errorMessages.map((msg, i) => (
            <p key={i} className="text-xs sm:text-sm text-[#A34F38] flex items-center gap-1.5" role="alert">
              <span className="font-bold">•</span>
              <span>{msg}</span>
            </p>
          ))}
        </div>
      )}

      {/* Main Workspace */}
      <div className="flex flex-col lg:flex-row gap-6 items-stretch">
        {/* Left Column: Dropzone and Queue */}
        <div className="flex-1 flex flex-col gap-3 min-w-0">
          <div
            role="button"
            tabIndex={0}
            aria-label="Area upload dokumen: drag and drop file ke sini atau klik untuk memilih"
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
            className={`border-2 border-dashed rounded-lg p-6 sm:p-8 flex flex-col items-center justify-center min-h-[200px] transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#A34F38] ${
              isDragging
                ? "border-[#A34F38] bg-[#D4B98A]/25 scale-[1.01]"
                : "border-[#D8CCB9] bg-[#FFFCF6] hover:border-[#A34F38]/70 hover:bg-[#D4B98A]/10"
            }`}
          >
            <div className="w-12 h-12 rounded-full bg-[#D4B98A]/30 border border-[#D8CCB9]/60 flex items-center justify-center mb-3 text-[#344638]">
              {mode === "txt-to-pdf" && <FileText size={22} aria-hidden="true" />}
              {mode === "images-to-pdf" && <ImageIcon size={22} aria-hidden="true" />}
              {mode === "docx-to-html" && <FileCode size={22} aria-hidden="true" />}
            </div>
            <p className="font-serif font-medium text-base text-[#332F29] text-center">
              Drag &amp; drop file ke sini atau pilih file dari perangkatmu.
            </p>
            <p className="text-xs text-[#62584C] mt-1 text-center">
              Mode aktif: <strong className="text-[#332F29]">{currentModeInfo.title}</strong> · Maks. 25 MB per file
            </p>
            <span className="mt-4 inline-flex items-center gap-1.5 bg-[#A34F38] hover:bg-[#8B3F2A] text-white py-2 px-5 rounded-md text-xs sm:text-sm font-medium transition-colors shadow-xs">
              Choose Files
            </span>
            <input
              type="file"
              accept={currentModeInfo.accept}
              multiple={mode === "images-to-pdf"}
              hidden
              ref={fileInputRef}
              onChange={(e) => {
                if (e.target.files) {
                  addFiles(e.target.files);
                  e.target.value = "";
                }
              }}
            />
          </div>

          {/* Queue List */}
          {items.length > 0 ? (
            <div className="flex flex-col gap-2 mt-1">
              <div className="flex items-center justify-between text-xs text-[#62584C] px-1">
                <span className="font-medium text-[#332F29]">
                  Antrean Dokumen: {items.length} file{" "}
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

              <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between p-3 rounded-md border transition-colors ${
                      item.status === "failed"
                        ? "border-[#A34F38]/40 bg-[#A34F38]/5"
                        : item.status === "success"
                        ? "border-[#344638]/30 bg-[#344638]/5"
                        : item.status === "processing"
                        ? "border-[#A34F38]/40 bg-[#D4B98A]/10"
                        : "border-[#D8CCB9] bg-[#FFFCF6]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="w-8 h-8 rounded bg-[#D4B98A]/30 flex items-center justify-center text-[#344638] shrink-0">
                        {mode === "txt-to-pdf" && <FileText size={16} aria-hidden="true" />}
                        {mode === "images-to-pdf" && <ImageIcon size={16} aria-hidden="true" />}
                        {mode === "docx-to-html" && <FileCode size={16} aria-hidden="true" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-xs font-semibold text-[#332F29]" title={item.name}>
                            {item.name}
                          </p>
                          <span className="text-[10px] font-bold uppercase px-1.5 py-0.2 rounded bg-[#344638]/10 text-[#344638] border border-[#344638]/20 shrink-0">
                            → {mode === "docx-to-html" ? "HTML" : "PDF"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-[#62584C] mt-0.5">
                          <span>{item.sizeFormatted}</span>
                          {item.convertedSize && (
                            <>
                              <span>•</span>
                              <span className="text-[#344638] font-medium">Hasil: {item.convertedSize}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      {item.status === "success" && item.convertedHtml && (
                        <button
                          type="button"
                          onClick={() => setPreviewHtml(item.convertedHtml || "")}
                          className="h-7 px-2.5 rounded text-[11px] font-medium border border-[#344638] text-[#344638] hover:bg-[#344638] hover:text-white inline-flex items-center gap-1 transition-colors"
                          title="Pratinjau HTML"
                        >
                          <Eye size={12} aria-hidden="true" />
                          <span>Preview</span>
                        </button>
                      )}

                      {item.status === "success" && item.convertedUrl && (
                        <button
                          type="button"
                          onClick={() => handleDownload(item)}
                          className="h-7 px-2.5 rounded text-[11px] font-medium border border-[#A34F38] text-[#A34F38] hover:bg-[#A34F38] hover:text-white inline-flex items-center gap-1 transition-colors"
                          title="Unduh dokumen hasil konversi"
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

                    {/* Retro Block Progress Bar during conversion */}
                    {item.status === "processing" && (
                      <div className="mt-2.5 w-full">
                        <RetroProgressBar
                          variant="terracotta"
                          totalBlocks={14}
                          label="MEMBUAT DOKUMEN..."
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-3 text-xs text-[#62584C]/70">
              Belum ada dokumen yang dipilih.
            </div>
          )}
        </div>

        {/* Right Column: Settings Panel */}
        <div className="w-full lg:w-[350px] xl:w-[370px] bg-[#FFFEFB] border border-[#D8CCB9] rounded-lg p-5 flex flex-col gap-4 shadow-xs shrink-0">
          <div className="flex items-center justify-between pb-3 border-b border-[#D8CCB9]">
            <h2 className="text-xs uppercase tracking-wider font-semibold text-[#332F29] flex items-center gap-2">
              <Sliders size={14} className="text-[#A34F38]" aria-hidden="true" />
              <span>Document Settings</span>
            </h2>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#F4EBDD] text-[#332F29] border border-[#D8CCB9]">
              {mode === "docx-to-html" ? "HTML" : "PDF"}
            </span>
          </div>

          {/* Mode Selector */}
          <div>
            <label className="block text-xs font-medium text-[#332F29] mb-2">
              Pilihan Konversi Dokumen
            </label>
            <div className="flex flex-col gap-1.5" role="group" aria-label="Kategori konversi dokumen">
              {modes.map((m) => {
                const isSelected = mode === m.mode;
                return (
                  <button
                    key={m.mode}
                    type="button"
                    onClick={() => handleModeChange(m.mode)}
                    className={`p-2.5 rounded-md border text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#A34F38] flex items-center justify-between ${
                      isSelected
                        ? "border-[#A34F38] bg-[#A34F38]/10 text-[#332F29] ring-1 ring-[#A34F38]"
                        : "border-[#D8CCB9] bg-[#FFFEFB] hover:border-[#A34F38]/60 hover:bg-[#D4B98A]/10 text-[#332F29]"
                    }`}
                  >
                    <div>
                      <span className="text-xs font-bold block">{m.title}</span>
                      <span className="text-[10px] text-[#62584C]">{m.badge}</span>
                    </div>
                    {isSelected && <Check size={14} className="text-[#A34F38]" aria-hidden="true" />}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-[#62584C] mt-2 leading-relaxed">
              {currentModeInfo.desc}
            </p>
          </div>

          {/* Image to PDF Page Layout Options */}
          {mode === "images-to-pdf" && (
            <div className="pt-2 border-t border-[#D8CCB9]/60 space-y-1.5">
              <label className="block text-xs font-medium text-[#332F29]">
                Tata Letak Halaman PDF
              </label>
              <div className="grid grid-cols-3 gap-1">
                <button
                  type="button"
                  onClick={() => setImageLayout("a4-portrait")}
                  className={`py-1.5 px-2 rounded text-[11px] font-medium border text-center transition-colors ${
                    imageLayout === "a4-portrait"
                      ? "border-[#A34F38] bg-[#A34F38] text-white"
                      : "border-[#D8CCB9] text-[#62584C] hover:text-[#332F29]"
                  }`}
                >
                  A4 Portrait
                </button>
                <button
                  type="button"
                  onClick={() => setImageLayout("a4-landscape")}
                  className={`py-1.5 px-2 rounded text-[11px] font-medium border text-center transition-colors ${
                    imageLayout === "a4-landscape"
                      ? "border-[#A34F38] bg-[#A34F38] text-white"
                      : "border-[#D8CCB9] text-[#62584C] hover:text-[#332F29]"
                  }`}
                >
                  A4 Landscape
                </button>
                <button
                  type="button"
                  onClick={() => setImageLayout("fit-image")}
                  className={`py-1.5 px-2 rounded text-[11px] font-medium border text-center transition-colors ${
                    imageLayout === "fit-image"
                      ? "border-[#A34F38] bg-[#A34F38] text-white"
                      : "border-[#D8CCB9] text-[#62584C] hover:text-[#332F29]"
                  }`}
                >
                  Fit Image
                </button>
              </div>
            </div>
          )}

          {/* Disclosures & Limitations */}
          <div className="p-3 rounded-md bg-[#F4EBDD]/60 border border-[#D8CCB9] text-xs space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-[#332F29]">
              <Info size={13} className="text-[#344638]" aria-hidden="true" />
              <span>Transparansi Format:</span>
            </div>
            {mode === "txt-to-pdf" && (
              <p className="text-[11px] text-[#62584C] leading-snug">
                Teks polos dikemas ke PDF halaman standar A4 dengan penomoran otomatis dan margin 45pt.
              </p>
            )}
            {mode === "images-to-pdf" && (
              <p className="text-[11px] text-[#62584C] leading-snug">
                Gambar disematkan langsung (embedded) tanpa penurunan kualitas kompresi ulang.
              </p>
            )}
            {mode === "docx-to-html" && (
              <p className="text-[11px] text-[#62584C] leading-snug">
                Mammoth mengekstrak struktur semantik (paragraf, heading, tabel). Header dinamis dan tata letak multi-kolom kompleks disederhanakan demi keamanan dan validitas HTML.
              </p>
            )}
          </div>

          {/* Convert Button */}
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
                  <span>Memproses Dokumen...</span>
                </>
              ) : (
                <>
                  <FileText size={16} aria-hidden="true" />
                  <span>
                    {items.length > 0
                      ? mode === "images-to-pdf"
                        ? `Gabungkan ke PDF (${items.length} Gambar)`
                        : `Convert All (${items.length} File)`
                      : "Convert"}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Live HTML Preview Modal / Section for DOCX to HTML */}
      {previewHtml !== null && (
        <section className="mt-4 pt-4 border-t border-[#D8CCB9] space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-serif font-bold text-[#332F29]">
              Pratinjau HTML (DOCX Sanitized Output)
            </h3>
            <button
              type="button"
              onClick={() => setPreviewHtml(null)}
              className="text-xs text-[#A34F38] hover:underline font-medium"
            >
              Tutup Pratinjau
            </button>
          </div>
          <div
            className="p-4 bg-white border border-[#D8CCB9] rounded-lg max-h-96 overflow-y-auto prose prose-sm max-w-none text-[#332F29]"
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
        </section>
      )}
    </div>
  );
}
