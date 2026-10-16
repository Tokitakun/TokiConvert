"use client";

import JSZip from "jszip";
import { useState, useEffect, DragEvent, ChangeEvent, useRef } from "react";
import { ArrowRightLeft } from "lucide-react";

interface FileInfo {
  file: File;
  size: string;
  url: string;
}

interface ConvertedInfo {
  original: FileInfo;
  url: string;
  mime: string;
  size: string;
}

export default function ConverterWorkspace({ onValidate }: { onValidate: (files: FileList) => { valid: File[]; errors: Map<File, string> } }) {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [converted, setConverted] = useState<ConvertedInfo[]>([]);
  const [outputFormat, setOutputFormat] = useState<string>("image/png");
  const supportedFormats = [
    { mime: "image/png", label: "PNG" },
    { mime: "image/jpeg", label: "JPG" },
    { mime: "image/webp", label: "WEBP" },
    { mime: "image/bmp", label: "BMP" },
    { mime: "image/svg+xml", label: "SVG" },
    { mime: "image/gif", label: "GIF" },
  ];

  const canvasEncodableFormats = ["image/png", "image/jpeg", "image/webp", "image/bmp", "image/svg+xml", "image/gif"];

  const [quality, setQuality] = useState<number>(0.92);
  const [targetWidth, setTargetWidth] = useState<number>(0);
  const [targetHeight, setTargetHeight] = useState<number>(0);

  // Ref for the hidden file input
  const fileInputRef = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  const [isFormatOpen, setIsFormatOpen] = useState<boolean>(false);

  // Click-outside handler for dropdown
  useEffect(() => {
    if (isFormatOpen) {
      const handleClickOutside = (event: MouseEvent) => {
        if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
          setIsFormatOpen(false);
        }
      };
      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          setIsFormatOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isFormatOpen]);

  // Cleanup URLs on unmount
  useEffect(() => {
    return () => {
      files.forEach((f) => URL.revokeObjectURL(f.url));
      converted.forEach((c) => URL.revokeObjectURL(c.url));
    };
  }, [files, converted]);

  const [status, setStatus] = useState<string>("");
  const [isConverting, setIsConverting] = useState<boolean>(false);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
  };

  const formatLabel = (mime: string) => {
    const found = supportedFormats.find((f) => f.mime === mime);
    return found ? found.label : mime.replace("image/", "").toUpperCase();
  };

  const convertFile = async (file: File) => {
    return new Promise<ConvertedInfo | null>((resolve) => {
      const originalUrl = URL.createObjectURL(file);
      // SVG safe handling
      if (file.type === "image/svg+xml") {
        resolve({
          original: { file, size: formatSize(file.size), url: originalUrl },
          url: originalUrl,
          mime: file.type,
          size: formatSize(file.size),
        });
        return;
      }
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement("canvas");
        const width = targetWidth > 0 ? targetWidth : img.width;
        const height = targetHeight > 0 ? targetHeight : img.height;
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          setErrorMessages((prev) => [...prev, `Canvas not supported for ${file.name}`]);
          resolve(null);
          return;
        }
        // JPEG needs white background
        if (outputFormat === "image/jpeg") {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, width, height);
        }
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          async (blob) => {
            if (!blob) {
              setErrorMessages((prev) => [...prev, `Conversion failed for ${file.name}`]);
              resolve(null);
              return;
            }
            // Validate MIME
            if (blob.type !== outputFormat) {
              setErrorMessages((prev) => [...prev, `Requested ${outputFormat} but got ${blob.type} for ${file.name}`]);
            }
            const url = URL.createObjectURL(blob);
            const sizeStr = formatSize(blob.size);
            resolve({
              original: { file, size: formatSize(file.size), url: originalUrl },
              url,
              mime: blob.type,
              size: sizeStr,
            });
          },
          outputFormat,
          outputFormat === "image/jpeg" || outputFormat === "image/webp" || outputFormat === "image/avif" ? quality : undefined,
        );
      };
      img.onerror = () => {
        setErrorMessages((prev) => [...prev, `Failed to load image ${file.name}`]);
        resolve(null);
      };
      // GIF animation note
      if (file.type === "image/gif") {
        setErrorMessages((prev) => [...prev, `GIF animation will be converted to static image for ${file.name}`]);
      }
      img.src = originalUrl;
    });
  };

  const addFiles = async (fileList: FileList) => {
    const { valid, errors } = onValidate(fileList);
    const newErrs: string[] = [];
    errors.forEach((msg: string) => newErrs.push(msg));
    setErrorMessages((prev) => [...prev, ...newErrs]);

    const newFiles: FileInfo[] = valid.map((f: File) => ({
      file: f,
      size: formatSize(f.size),
      url: URL.createObjectURL(f),
    }));
    setFiles((prev) => [...prev, ...newFiles]);

    // Convert each valid file
    const conversions = await Promise.all(valid.map((f) => convertFile(f)));
    const successful = conversions.filter((c): c is ConvertedInfo => c !== null);
    setConverted((prev) => [...prev, ...successful]);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
      e.dataTransfer.clearData();
    }
  };

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const triggerConvert = async () => {
    if (files.length === 0) {
      setStatus("Tidak ada file untuk dikonversi");
      return;
    }
    setIsConverting(true);
    setStatus("Mengonversi...");
    // Run conversion with current settings on all uploaded files
    const conversions = await Promise.all(files.map((f) => convertFile(f.file)));
    const successful = conversions.filter((c): c is ConvertedInfo => c !== null);
    setConverted(successful);
    setIsConverting(false);
    setStatus("Konversi selesai");
  };

  const openFilePicker = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(e.target.files);
      e.target.value = ""; // allow re-select same file
    }
  };


  const removeFile = (index: number) => {
    setFiles((prev) => {
      const removed = prev[index];
      URL.revokeObjectURL(removed.url);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleDownload = (url: string, fileName: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadAll = async () => {
    if (converted.length === 0) {
      setStatus("Tidak ada file yang berhasil dikonversi");
      return;
    }
    setStatus("Membuat ZIP...");
    const zip = new JSZip();
    for (let i = 0; i < converted.length; i++) {
      const c = converted[i];
      const url = c.url;
      const mime = c.mime;
      const ext = mime.split("/")[1] || "bin";
      const baseName = c.original.file.name.replace(/\.[^/.]+$/, "");
      const safeName = `${baseName}_${i}.${ext}`;
      const blob = await fetch(url).then((r) => r.blob());
      zip.file(safeName, blob);
    }
    const zipBlob = await zip.generateAsync({ type: "blob" });
    const zipUrl = URL.createObjectURL(zipBlob);
    const a = document.createElement("a");
    a.href = zipUrl;
    a.download = "konversi.zip";
    a.click();
    URL.revokeObjectURL(zipUrl);
    setStatus("ZIP siap diunduh");
  };

  return (
    <div className="flex flex-col w-full max-w-5xl mx-auto gap-8 p-6 bg-[#FFFEFB] rounded-lg border border-[#D8D0C4]">
      {/* Status & errors */}
      {status && (
        <div className="text-[#625C53] text-sm" role="status">{status}</div>
      )}
      {errorMessages.length > 0 && (
        <div className="space-y-1">
          {errorMessages.map((msg, i) => (
            <div key={i} className="text-[#A9573F] text-sm" role="alert">{msg}</div>
          ))}
        </div>
      )}

      {/* Conversion row: Source | Icon | Target */}
      <div className="flex flex-col lg:flex-row gap-4 items-start">
        {/* Source box */}
        <div className="flex-1 flex flex-col gap-3">
          <div className="border-2 border-dashed border-[#D8D0C4] rounded-lg p-6 flex flex-col items-center justify-center min-h-[200px] bg-[#FFFEFB] hover:bg-[#E9E0D3]/10 focus:outline-none focus:ring-2 focus:ring-[#A9573F] cursor-pointer" onDrop={onDrop} onDragOver={onDragOver} onClick={openFilePicker}>
            <div className="w-10 h-10 rounded-full bg-[#E9E0D3] flex items-center justify-center mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5 text-[#34483D]" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            </div>
            <p className="text-[#34483D] font-medium text-sm">Tarik &amp; lepas gambar atau klik untuk pilih</p>
            <button type="button" className="mt-2 bg-[#A9573F] text-white py-2 px-6 rounded text-sm hover:bg-[#8F4531] focus:outline-none focus:ring-2 focus:ring-[#8F4531]">Browse Files</button>
            <input
              id="file-input"
              type="file"
              accept="image/*"
              multiple
              hidden
              ref={fileInputRef}
              onChange={onFileChange}
            />
          </div>

          {/* Selected file list */}
      
        </div>

        {/* Conversion icon */}
        <div className="hidden lg:flex flex-col items-center justify-center gap-2 min-w-[60px]">
          <ArrowRightLeft size={24} className="text-[#34483D]" />
          <span className="text-xs text-[#625C53]">Konversi</span>
        </div>

        {/* Target format box */}
        <div className="flex-1 flex flex-col gap-3 lg:w-[320px] relative">
          <div ref={triggerRef} onClick={() => setIsFormatOpen(!isFormatOpen)}>
            <div className="border border-[#D8D0C4] rounded-lg p-4 bg-[#FFFEFB] hover:border-[#A9573F] focus-within:border-[#A9573F] focus-within:ring-1 focus-within:ring-[#A9573F] transition-colors cursor-pointer">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-[#E9E0D3] flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5 text-[#34483D]" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 16.5A2.5 2.5 0 0 1 6.5 14H18v5H4z"/><path d="M18.5 7.5a2.5 2.5 0 1 1 0 5H10v-5z"/></svg>
                  </div>
                  <span className="text-[#302E29] font-medium text-sm">Convert ke:</span>
                </div>
                <span className="text-xs text-[#625C53]">{formatLabel(outputFormat)}</span>
              </div>
            </div>
          </div>

          {isFormatOpen && (
            <div ref={popoverRef} className="absolute top-full right-0 mt-2 w-[280px] max-w-[calc(100vw-32px)] z-50 bg-[#FFFEFB] border border-[#D8D0C4] rounded-xl shadow-lg p-3 grid grid-cols-3 gap-2" role="menu">
              {supportedFormats.map((fmt, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="col-span-1 border border-[#D8D0C4] rounded-lg py-2 px-3 text-sm text-[#302E29] hover:bg-[#E9E0D3] focus:outline-none focus:ring-2 focus:ring-[#A9573F] focus:ring-offset-1 transition-colors"
                  onClick={() => {
                    setOutputFormat(fmt.mime);
                    setIsFormatOpen(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setOutputFormat(fmt.mime);
                      setIsFormatOpen(false);
                    }
                  }}
                >
                  {fmt.label}
                </button>
              ))}
            </div>
          )}

          {/* Quality & dimensions (conditionally shown) */}
          {(outputFormat === "image/jpeg" || outputFormat === "image/webp" || outputFormat === "image/avif") && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-[#302E29]">Kualitas (0-1)</label>
                <input type="number" min="0" max="1" step="0.05" value={quality} onChange={(e) => setQuality(parseFloat(e.target.value))} className="w-full border border-[#D8D0C4] rounded px-2 py-1.5 bg-[#FFFEFB] text-sm text-[#302E29] focus:ring-1 focus:ring-[#A9573F] outline-none" />
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-[#302E29]">Lebar (px)</label>
              <input type="number" min="0" value={targetWidth} onChange={(e) => setTargetWidth(parseInt(e.target.value) || 0)} className="w-full border border-[#D8D0C4] rounded px-2 py-1.5 bg-[#FFFEFB] text-sm text-[#302E29] focus:ring-1 focus:ring-[#A9573F] outline-none" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-[#302E29]">Tinggi (px)</label>
              <input type="number" min="0" value={targetHeight} onChange={(e) => setTargetHeight(parseInt(e.target.value) || 0)} className="w-full border border-[#D8D0C4] rounded px-2 py-1.5 bg-[#FFFEFB] text-sm text-[#302E29] focus:ring-1 focus:ring-[#A9573F] outline-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Convert button */}
      <div className="flex justify-center">
        <button onClick={triggerConvert} disabled={files.length === 0 || isConverting} className="flex items-center gap-2 bg-[#A9573F] text-white py-3 px-8 rounded-lg text-sm font-medium hover:bg-[#8F4531] disabled:bg-[#A9573F]/40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#A9573F] transition-colors">
          {isConverting ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4 animate-spin" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 2 5.373 2 12h4zm8 10a8 8 0 008-8h-8A8 8 0 000 8h4a8 8 0 008 8z"/></svg>
              Memproses...
            </>
          ) : (
            <>
              <ArrowRightLeft size={18} />
              Convert
            </>
          )}
        </button>
      </div>

      {/* Results as vertical list */}
      {converted.length > 0 && (
        <section className="mt-6 w-full">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-[#302E29]">Hasil konversi</h2>
            <button onClick={handleDownloadAll} className="flex items-center gap-1 bg-[#A9573F] text-white text-xs py-1 px-3 rounded hover:bg-[#8F4531] focus:outline-none focus:ring-2 focus:ring-[#A9573F]">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Download all (.zip)
            </button>
          </div>
          <div className="divide-y divide-[#D8D0C4] border border-[#D8D0C4] rounded-lg bg-[#FFFEFB]">
            {converted.map((c, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3 group hover:bg-[#E9E0D3]/20">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-[#E9E0D3] flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5 text-[#34483D]" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 16.5A2.5 2.5 0 0 1 6.5 14H18v5H4z"/><path d="M18.5 7.5a2.5 2.5 0 1 1 0 5H10v-5z"/></svg>
                  </div>
                  <div>
                    <div className="text-[#302E29] text-sm font-medium truncate max-w-[180px]" title={c.original.file.name}>{c.original.file.name}</div>
                    <div className="text-[#625C53] text-xs">{formatLabel(c.mime)} · {c.size}</div>
                  </div>
                </div>
                <a href={c.url} download={`${c.original.file.name.replace(/\.[^/.]+$/, "")}_converted.${c.mime.split("/")[1]}`} className="text-[#A9573F] text-sm hover:text-[#8F4531] underline" onClick={(e) => handleDownload(c.url, `${c.original.file.name.replace(/\.[^/.]+$/, "")}_converted.${c.mime.split("/")[1]}`)}>
                  Download
                </a>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
