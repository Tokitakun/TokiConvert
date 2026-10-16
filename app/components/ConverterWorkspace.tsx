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
    { mime: "image/png", label: "PNG", supported: true },
    { mime: "image/jpeg", label: "JPG", supported: true },
    { mime: "image/webp", label: "WEBP", supported: true },
    { mime: "image/bmp", label: "BMP", supported: true },
    { mime: "image/svg+xml", label: "SVG", supported: false, note: "Input saja" },
    { mime: "image/gif", label: "GIF", supported: false, note: "Input saja" },
  ];

  // Helper to generate a valid Windows 24-bit uncompressed BMP Blob from ImageData
  const imageDataToBmpBlob = (imageData: ImageData): Blob => {
    const width = imageData.width;
    const height = imageData.height;
    const rowSize = Math.floor((24 * width + 31) / 32) * 4;
    const pixelArraySize = rowSize * height;
    const fileSize = 54 + pixelArraySize;
    const buffer = new ArrayBuffer(fileSize);
    const view = new DataView(buffer);

    // BITMAPFILEHEADER (14 bytes)
    view.setUint16(0, 0x424D, false); // "BM"
    view.setUint32(2, fileSize, true);
    view.setUint16(6, 0, true);
    view.setUint16(8, 0, true);
    view.setUint32(10, 54, true);

    // BITMAPINFOHEADER (40 bytes)
    view.setUint32(14, 40, true);
    view.setInt32(18, width, true);
    view.setInt32(22, height, true); // bottom-up
    view.setUint16(26, 1, true); // planes
    view.setUint16(28, 24, true); // 24-bit BGR
    view.setUint32(30, 0, true); // BI_RGB (uncompressed)
    view.setUint32(34, pixelArraySize, true);
    view.setInt32(38, 2835, true); // ~72 DPI
    view.setInt32(42, 2835, true);
    view.setUint32(46, 0, true);
    view.setUint32(50, 0, true);

    const data = imageData.data;
    let offset = 54;
    for (let y = height - 1; y >= 0; y--) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        view.setUint8(offset++, data[i + 2]); // B
        view.setUint8(offset++, data[i + 1]); // G
        view.setUint8(offset++, data[i]);     // R
      }
      for (let p = 0; p < rowSize - width * 3; p++) {
        view.setUint8(offset++, 0); // padding
      }
    }

    return new Blob([buffer], { type: "image/bmp" });
  };

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
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement("canvas");
        const naturalW = img.naturalWidth || img.width || 800;
        const naturalH = img.naturalHeight || img.height || 600;
        const width = targetWidth > 0 ? targetWidth : naturalW;
        const height = targetHeight > 0 ? targetHeight : naturalH;
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          setErrorMessages((prev) => [...prev, `Canvas tidak didukung untuk ${file.name}`]);
          resolve(null);
          return;
        }

        // Fill white background for formats without alpha channel (JPEG and BMP)
        if (outputFormat === "image/jpeg" || outputFormat === "image/bmp") {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, width, height);
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Custom BMP encoding
        if (outputFormat === "image/bmp") {
          try {
            const imageData = ctx.getImageData(0, 0, width, height);
            const bmpBlob = imageDataToBmpBlob(imageData);
            const url = URL.createObjectURL(bmpBlob);
            resolve({
              original: { file, size: formatSize(file.size), url: originalUrl },
              url,
              mime: "image/bmp",
              size: formatSize(bmpBlob.size),
            });
          } catch {
            setErrorMessages((prev) => [...prev, `Gagal meng-encode BMP untuk ${file.name}`]);
            resolve(null);
          }
          return;
        }

        canvas.toBlob(
          async (blob) => {
            if (!blob) {
              setErrorMessages((prev) => [...prev, `Konversi gagal untuk ${file.name}`]);
              resolve(null);
              return;
            }
            // Check MIME compatibility
            if (blob.type !== outputFormat) {
              setErrorMessages((prev) => [
                ...prev,
                `Format ${outputFormat} tidak didukung native oleh browser (menghasilkan ${blob.type})`,
              ]);
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
          outputFormat === "image/jpeg" || outputFormat === "image/webp" ? quality : undefined,
        );
      };
      img.onerror = () => {
        setErrorMessages((prev) => [...prev, `Gagal membaca gambar: ${file.name}`]);
        resolve(null);
      };
      // GIF note
      if (file.type === "image/gif") {
        setErrorMessages((prev) => [
          ...prev,
          `Catatan GIF: Hanya frame pertama dari '${file.name}' yang diproses oleh Canvas.`,
        ]);
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
    <div className="flex flex-col w-full max-w-5xl mx-auto gap-8 p-6 bg-[#FFFCF6] rounded-lg border border-[#D8CCB9] shadow-xs">
      {/* Status & errors */}
      {status && (
        <div className="text-[#62584C] text-sm" role="status">{status}</div>
      )}
      {errorMessages.length > 0 && (
        <div className="space-y-1">
          {errorMessages.map((msg, i) => (
            <div key={i} className="text-[#A34F38] text-sm" role="alert">{msg}</div>
          ))}
        </div>
      )}

      {/* Conversion row: Source | Icon | Target */}
      <div className="flex flex-col lg:flex-row gap-4 items-start">
        {/* Source box */}
        <div className="flex-1 flex flex-col gap-3">
          <div className="border-2 border-dashed border-[#D8CCB9] rounded-lg p-6 flex flex-col items-center justify-center min-h-[200px] bg-[#FFFCF6] hover:bg-[#D4B98A]/10 focus:outline-none focus:ring-2 focus:ring-[#A34F38] cursor-pointer" onDrop={onDrop} onDragOver={onDragOver} onClick={openFilePicker}>
            <div className="w-10 h-10 rounded-full bg-[#D4B98A]/30 flex items-center justify-center mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5 text-[#344638]" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            </div>
            <p className="text-[#344638] font-medium text-sm">Tarik &amp; lepas gambar atau klik untuk pilih</p>
            <button type="button" className="mt-2 bg-[#A34F38] text-white py-2 px-6 rounded text-sm hover:bg-[#8B3F2A] focus:outline-none focus:ring-2 focus:ring-[#8B3F2A] transition-colors">Browse Files</button>
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
          {files.length > 0 && (
            <div className="flex flex-col gap-2 mt-1">
              <div className="flex items-center justify-between text-xs text-[#62584C]">
                <span>{files.length} file dipilih (maks. 10, total maks. 15 MB/file)</span>
                <button
                  type="button"
                  onClick={() => {
                    files.forEach((f) => URL.revokeObjectURL(f.url));
                    setFiles([]);
                    setConverted([]);
                  }}
                  className="text-[#A34F38] hover:underline"
                >
                  Hapus semua
                </button>
              </div>
              <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
                {files.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between px-3 py-1.5 rounded border border-[#D8CCB9] bg-[#FFFCF6] text-xs"
                  >
                    <span className="truncate max-w-[200px] text-[#332F29] font-medium" title={item.file.name}>
                      {item.file.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[#62584C]">{item.size}</span>
                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
                        className="text-[#A34F38] hover:text-[#8B3F2A] font-bold px-1 text-sm leading-none"
                        title="Hapus file"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Conversion icon */}
        <div className="hidden lg:flex flex-col items-center justify-center gap-2 min-w-[60px]">
          <ArrowRightLeft size={24} className="text-[#344638]" />
          <span className="text-xs text-[#62584C]">Konversi</span>
        </div>

        {/* Target format box */}
        <div className="flex-1 flex flex-col gap-3 lg:w-[320px] relative">
          <div ref={triggerRef} onClick={() => setIsFormatOpen(!isFormatOpen)}>
            <div className="border border-[#D8CCB9] rounded-lg p-4 bg-[#FFFCF6] hover:border-[#A34F38] focus-within:border-[#A34F38] focus-within:ring-1 focus-within:ring-[#A34F38] transition-colors cursor-pointer">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-[#D4B98A]/30 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5 text-[#344638]" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 16.5A2.5 2.5 0 0 1 6.5 14H18v5H4z"/><path d="M18.5 7.5a2.5 2.5 0 1 1 0 5H10v-5z"/></svg>
                  </div>
                  <span className="text-[#332F29] font-medium text-sm">Convert ke:</span>
                </div>
                <span className="text-xs text-[#62584C] font-semibold">{formatLabel(outputFormat)}</span>
              </div>
            </div>
          </div>

          {isFormatOpen && (
            <div ref={popoverRef} className="absolute top-full right-0 mt-2 w-[280px] max-w-[calc(100vw-32px)] z-50 bg-[#FFFCF6] border border-[#D8CCB9] rounded-lg shadow-md p-3 grid grid-cols-2 gap-2" role="menu">
              {supportedFormats.map((fmt, idx) => (
                <button
                  key={idx}
                  type="button"
                  disabled={!fmt.supported}
                  title={!fmt.supported ? "Format ini hanya didukung sebagai input (vektor / animasi). Canvas browser tidak dapat meng-encode format ini." : undefined}
                  className={`border rounded py-2 px-3 text-left transition-colors flex flex-col justify-between ${
                    fmt.supported
                      ? outputFormat === fmt.mime
                        ? "border-[#A34F38] bg-[#A34F38]/10 text-[#332F29] font-medium"
                        : "border-[#D8CCB9] text-[#332F29] hover:bg-[#D4B98A]/20"
                      : "border-[#D8CCB9]/50 text-[#62584C]/50 bg-[#F4EBDD]/40 cursor-not-allowed"
                  }`}
                  onClick={() => {
                    if (fmt.supported) {
                      setOutputFormat(fmt.mime);
                      setIsFormatOpen(false);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (fmt.supported && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault();
                      setOutputFormat(fmt.mime);
                      setIsFormatOpen(false);
                    }
                  }}
                >
                  <span className="text-sm font-semibold">{fmt.label}</span>
                  {!fmt.supported && (
                    <span className="text-[10px] text-[#A34F38]">Input saja</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Quality & dimensions (conditionally shown) */}
          {(outputFormat === "image/jpeg" || outputFormat === "image/webp" || outputFormat === "image/avif") && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-[#332F29]">Kualitas (0-1)</label>
                <input type="number" min="0" max="1" step="0.05" value={quality} onChange={(e) => setQuality(parseFloat(e.target.value))} className="w-full border border-[#D8CCB9] rounded px-2 py-1.5 bg-[#FFFCF6] text-sm text-[#332F29] focus:ring-1 focus:ring-[#A34F38] outline-none" />
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-[#332F29]">Lebar (px)</label>
              <input type="number" min="0" value={targetWidth} onChange={(e) => setTargetWidth(parseInt(e.target.value) || 0)} className="w-full border border-[#D8CCB9] rounded px-2 py-1.5 bg-[#FFFCF6] text-sm text-[#332F29] focus:ring-1 focus:ring-[#A34F38] outline-none" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-[#332F29]">Tinggi (px)</label>
              <input type="number" min="0" value={targetHeight} onChange={(e) => setTargetHeight(parseInt(e.target.value) || 0)} className="w-full border border-[#D8CCB9] rounded px-2 py-1.5 bg-[#FFFCF6] text-sm text-[#332F29] focus:ring-1 focus:ring-[#A34F38] outline-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Convert button */}
      <div className="flex justify-center">
        <button onClick={triggerConvert} disabled={files.length === 0 || isConverting} className="flex items-center gap-2 bg-[#A34F38] text-white py-3 px-8 rounded-lg text-sm font-medium hover:bg-[#8B3F2A] disabled:bg-[#A34F38]/40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#A34F38] transition-colors">
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
            <h2 className="text-lg font-serif font-bold text-[#332F29]">Hasil konversi</h2>
            <button onClick={handleDownloadAll} className="flex items-center gap-1 bg-[#A34F38] text-white text-xs py-1.5 px-3 rounded hover:bg-[#8B3F2A] focus:outline-none focus:ring-2 focus:ring-[#A34F38]">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Download all (.zip)
            </button>
          </div>
          <div className="divide-y divide-[#D8CCB9] border border-[#D8CCB9] rounded-lg bg-[#FFFCF6]">
            {converted.map((c, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3 group hover:bg-[#D4B98A]/10">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-[#D4B98A]/30 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5 text-[#344638]" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 16.5A2.5 2.5 0 0 1 6.5 14H18v5H4z"/><path d="M18.5 7.5a2.5 2.5 0 1 1 0 5H10v-5z"/></svg>
                  </div>
                  <div>
                    <div className="text-[#332F29] text-sm font-medium truncate max-w-[180px]" title={c.original.file.name}>{c.original.file.name}</div>
                    <div className="text-[#62584C] text-xs">{formatLabel(c.mime)} · {c.size}</div>
                  </div>
                </div>
                <a href={c.url} download={`${c.original.file.name.replace(/\.[^/.]+$/, "")}_converted.${c.mime.split("/")[1]}`} className="text-[#A34F38] text-sm hover:text-[#8B3F2A] underline font-medium" onClick={(e) => handleDownload(c.url, `${c.original.file.name.replace(/\.[^/.]+$/, "")}_converted.${c.mime.split("/")[1]}`)}>
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
