"use client";

import JSZip from "jszip";
import { useState, useEffect, DragEvent, ChangeEvent, useRef } from "react";
import {
  ArrowRightLeft,
  Upload,
  Download,
  Trash2,
  FileImage,
  Check,
  ChevronDown,
  Archive,
} from "lucide-react";

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
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const supportedFormats = [
    { mime: "image/png", label: "PNG", supported: true, note: "Lossless" },
    { mime: "image/jpeg", label: "JPG", supported: true, note: "Kompresi" },
    { mime: "image/webp", label: "WEBP", supported: true, note: "Efisien" },
    { mime: "image/bmp", label: "BMP", supported: true, note: "24-bit" },
    { mime: "image/svg+xml", label: "SVG", supported: true, note: "Raster container" },
    { mime: "image/gif", label: "GIF", supported: true, note: "Statis (frame 1)" },
  ];

  const mimeToExt = (mime: string): string => {
    switch (mime) {
      case "image/png": return "png";
      case "image/jpeg": return "jpg";
      case "image/webp": return "webp";
      case "image/bmp": return "bmp";
      case "image/svg+xml": return "svg";
      case "image/gif": return "gif";
      default: return mime.split("/")[1] || "png";
    }
  };

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

  // Helper to generate a valid GIF89a Blob from ImageData with LZW compression & transparency
  const imageDataToGifBlob = (imageData: ImageData): Blob => {
    const width = imageData.width;
    const height = imageData.height;
    const data = imageData.data;

    const palette: number[] = [];
    const colorMap = new Map<number | string, number>();
    const indexedPixels = new Uint8Array(width * height);
    let transparentIndex = -1;
    let hasTransparent = false;

    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 128) {
        hasTransparent = true;
        break;
      }
    }

    if (hasTransparent) {
      transparentIndex = 0;
      palette.push(0, 0, 0);
      colorMap.set("trans", 0);
    }

    for (let p = 0; p < width * height; p++) {
      const i = p * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];

      if (a < 128) {
        indexedPixels[p] = transparentIndex;
        continue;
      }

      const key = ((r & 0xf8) << 7) | ((g & 0xf8) << 2) | (b >> 3);
      let idx = colorMap.get(key);
      if (idx === undefined) {
        if (palette.length / 3 < 256) {
          idx = palette.length / 3;
          colorMap.set(key, idx);
          palette.push(r & 0xf8, g & 0xf8, b & 0xf8);
        } else {
          let bestDist = Infinity;
          let bestIdx = hasTransparent ? 1 : 0;
          const start = hasTransparent ? 1 : 0;
          for (let c = start; c < palette.length / 3; c++) {
            const pr = palette[c * 3];
            const pg = palette[c * 3 + 1];
            const pb = palette[c * 3 + 2];
            const dist = (r - pr) * (r - pr) + (g - pg) * (g - pg) + (b - pb) * (b - pb);
            if (dist < bestDist) {
              bestDist = dist;
              bestIdx = c;
            }
          }
          idx = bestIdx;
        }
      }
      indexedPixels[p] = idx;
    }

    const colorCount = palette.length / 3;
    let colorDepth = 1;
    while (1 << colorDepth < colorCount) colorDepth++;
    if (colorDepth < 1) colorDepth = 1;
    const paddedSize = 1 << colorDepth;
    while (palette.length / 3 < paddedSize) {
      palette.push(0, 0, 0);
    }

    const initCodeSize = Math.max(colorDepth, 2);
    const clearCode = 1 << initCodeSize;
    const eoiCode = clearCode + 1;

    const bytes: number[] = [];
    const writeByte = (b: number) => bytes.push(b & 0xff);
    const writeWord = (w: number) => bytes.push(w & 0xff, (w >> 8) & 0xff);
    const writeString = (s: string) => {
      for (let i = 0; i < s.length; i++) bytes.push(s.charCodeAt(i));
    };

    writeString("GIF89a");
    writeWord(width);
    writeWord(height);
    const gctFlag = 0x80;
    const colorRes = 0x70;
    const gctSize = (colorDepth - 1) & 0x07;
    writeByte(gctFlag | colorRes | gctSize);
    writeByte(hasTransparent ? transparentIndex : 0);
    writeByte(0);

    for (let i = 0; i < palette.length; i++) writeByte(palette[i]);

    if (hasTransparent) {
      writeByte(0x21);
      writeByte(0xf9);
      writeByte(4);
      writeByte(0x01);
      writeWord(0);
      writeByte(transparentIndex);
      writeByte(0);
    }

    writeByte(0x2c);
    writeWord(0);
    writeWord(0);
    writeWord(width);
    writeWord(height);
    writeByte(0);

    writeByte(initCodeSize);

    let curBit = 0;
    let curByte = 0;
    const packet: number[] = [];

    const flushPacket = () => {
      if (packet.length > 0) {
        writeByte(packet.length);
        for (let i = 0; i < packet.length; i++) writeByte(packet[i]);
        packet.length = 0;
      }
    };

    const writeBits = (val: number, numBits: number) => {
      curByte |= val << curBit;
      curBit += numBits;
      while (curBit >= 8) {
        packet.push(curByte & 0xff);
        if (packet.length === 254) flushPacket();
        curByte >>= 8;
        curBit -= 8;
      }
    };

    const endBits = () => {
      if (curBit > 0) {
        packet.push(curByte & 0xff);
        if (packet.length === 254) flushPacket();
      }
      flushPacket();
    };

    let codeSize = initCodeSize + 1;
    let nextCode = eoiCode + 1;
    const maxTableSize = 4096;
    const codeTable = new Map<number, number>();

    const resetTable = () => {
      codeTable.clear();
      codeSize = initCodeSize + 1;
      nextCode = eoiCode + 1;
    };

    writeBits(clearCode, codeSize);
    resetTable();

    let prefix = indexedPixels[0];
    for (let i = 1; i < indexedPixels.length; i++) {
      const k = indexedPixels[i];
      const key = (prefix << 8) | k;
      if (codeTable.has(key)) {
        prefix = codeTable.get(key)!;
      } else {
        writeBits(prefix, codeSize);
        if (nextCode < maxTableSize) {
          codeTable.set(key, nextCode++);
          if (nextCode > 1 << codeSize && codeSize < 12) {
            codeSize++;
          }
        } else {
          writeBits(clearCode, codeSize);
          resetTable();
        }
        prefix = k;
      }
    }
    writeBits(prefix, codeSize);
    writeBits(eoiCode, codeSize);
    endBits();

    writeByte(0);
    writeByte(0x3b);

    return new Blob([new Uint8Array(bytes)], { type: "image/gif" });
  };

  // Helper to generate a valid SVG document Blob wrapping raster data
  const createSvgBlob = (width: number, height: number, dataUrl: string): Blob => {
    const svgXml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
      `  <image width="${width}" height="${height}" href="${dataUrl}" xlink:href="${dataUrl}"/>`,
      "</svg>",
    ].join("\n");
    return new Blob([svgXml], { type: "image/svg+xml" });
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
    return new Promise<ConvertedInfo | null>(async (resolve) => {
      // 0-byte validation
      if (file.size === 0) {
        setErrorMessages((prev) => [...prev, `Berkas kosong (0 byte): ${file.name}`]);
        resolve(null);
        return;
      }

      // Safe SVG input check
      const isSvgInput = file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg");
      if (isSvgInput) {
        try {
          const text = await file.text();
          if (!text.includes("<svg") || text.includes("<parsererror")) {
            setErrorMessages((prev) => [...prev, `Berkas SVG tidak valid atau rusak: ${file.name}`]);
            resolve(null);
            return;
          }
        } catch {
          setErrorMessages((prev) => [...prev, `Gagal membaca berkas SVG: ${file.name}`]);
          resolve(null);
          return;
        }
      }

      // Input GIF notification
      const isGifInput = file.type === "image/gif" || file.name.toLowerCase().endsWith(".gif");
      if (isGifInput) {
        setErrorMessages((prev) => [
          ...prev,
          `Catatan GIF: Hanya frame pertama dari '${file.name}' yang diproses (animasi multi-frame belum didukung).`,
        ]);
      }

      const originalUrl = URL.createObjectURL(file);
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement("canvas");
        let naturalW = img.naturalWidth || img.width;
        let naturalH = img.naturalHeight || img.height;
        if (!naturalW || !naturalH) {
          naturalW = 800;
          naturalH = 600;
        }
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

        // 1. Custom BMP encoding (24-bit uncompressed)
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

        // 2. Custom GIF encoding (GIF89a with LZW and transparency support)
        if (outputFormat === "image/gif") {
          try {
            const imageData = ctx.getImageData(0, 0, width, height);
            const gifBlob = imageDataToGifBlob(imageData);
            const url = URL.createObjectURL(gifBlob);
            resolve({
              original: { file, size: formatSize(file.size), url: originalUrl },
              url,
              mime: "image/gif",
              size: formatSize(gifBlob.size),
            });
          } catch {
            setErrorMessages((prev) => [...prev, `Gagal meng-encode GIF untuk ${file.name}`]);
            resolve(null);
          }
          return;
        }

        // 3. Custom SVG document (Valid SVG container wrapping raster data)
        if (outputFormat === "image/svg+xml") {
          try {
            const dataUrl = canvas.toDataURL("image/png");
            const svgBlob = createSvgBlob(width, height, dataUrl);
            const url = URL.createObjectURL(svgBlob);
            resolve({
              original: { file, size: formatSize(file.size), url: originalUrl },
              url,
              mime: "image/svg+xml",
              size: formatSize(svgBlob.size),
            });
          } catch {
            setErrorMessages((prev) => [...prev, `Gagal membuat SVG untuk ${file.name}`]);
            resolve(null);
          }
          return;
        }

        // 4. Native Canvas Blob for PNG, JPEG, WEBP
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

  const onDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
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
      const ext = mimeToExt(mime);
      const baseName = c.original.file.name.replace(/\.[^/.]+$/, "");
      const safeName = `${baseName}_${i + 1}.${ext}`;
      const blob = await fetch(url).then((r) => r.blob());
      zip.file(safeName, blob);
    }
    const zipBlob = await zip.generateAsync({ type: "blob" });
    const zipUrl = URL.createObjectURL(zipBlob);
    const a = document.createElement("a");
    a.href = zipUrl;
    a.download = "konversi.zip";
    a.click();
    setTimeout(() => URL.revokeObjectURL(zipUrl), 1000);
    setStatus("ZIP siap diunduh");
  };

  return (
    <div className="flex flex-col w-full max-w-5xl mx-auto gap-8 p-6 sm:p-8 bg-[#FFFCF6] rounded-lg border border-[#D8CCB9] shadow-xs">
      {/* Status & Error notifications */}
      {status && (
        <div
          className="px-4 py-2.5 rounded-md border border-[#D4B98A]/70 bg-[#F4EBDD]/60 text-xs sm:text-sm font-medium text-[#344638]"
          role="status"
        >
          {status}
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

      {/* Main conversion workspace */}
      <div className="flex flex-col lg:flex-row gap-6 items-stretch">
        {/* Source upload box */}
        <div className="flex-1 flex flex-col gap-3">
          <div
            role="button"
            tabIndex={0}
            aria-label="Area unggah gambar: seret berkas ke sini atau tekan Enter untuk memilih"
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                openFilePicker();
              }
            }}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragEnter={onDragEnter}
            onDragLeave={onDragLeave}
            onClick={openFilePicker}
            className={`border-2 border-dashed rounded-lg p-6 sm:p-8 flex flex-col items-center justify-center min-h-[220px] transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#A34F38] ${
              isDragging
                ? "border-[#A34F38] bg-[#D4B98A]/25 scale-[1.01]"
                : "border-[#D8CCB9] bg-[#FFFCF6] hover:border-[#A34F38]/70 hover:bg-[#D4B98A]/10"
            }`}
          >
            <div className="w-12 h-12 rounded-full bg-[#D4B98A]/30 border border-[#D8CCB9]/60 flex items-center justify-center mb-3 text-[#344638]">
              <Upload size={22} aria-hidden="true" />
            </div>
            <p className="font-serif font-medium text-base text-[#332F29] text-center">
              Tarik &amp; lepas gambar atau klik untuk memilih
            </p>
            <p className="text-xs text-[#62584C] mt-1 text-center">
              Mendukung PNG, JPG, WEBP, BMP, SVG, GIF · Maks. 10 berkas (15 MB/berkas)
            </p>
            <span className="mt-4 inline-flex items-center gap-1.5 bg-[#A34F38] hover:bg-[#8B3F2A] text-white py-2 px-5 rounded-md text-xs sm:text-sm font-medium transition-colors shadow-xs">
              Pilih Berkas
            </span>
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

          {/* Selected files list */}
          {files.length > 0 && (
            <div className="flex flex-col gap-2 mt-1">
              <div className="flex items-center justify-between text-xs text-[#62584C] px-1">
                <span className="font-medium text-[#332F29]">
                  {files.length} berkas dipilih <span className="text-[#62584C] font-normal">(maks. 10)</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    files.forEach((f) => URL.revokeObjectURL(f.url));
                    setFiles([]);
                    setConverted([]);
                  }}
                  className="text-[#A34F38] hover:text-[#8B3F2A] hover:underline font-medium transition-colors"
                >
                  Hapus semua
                </button>
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                {files.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-md border border-[#D8CCB9] bg-[#FFFCF6] hover:bg-[#D4B98A]/10 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Mini Thumbnail */}
                      <img
                        src={item.url}
                        alt=""
                        className="w-8 h-8 rounded object-cover border border-[#D8CCB9] bg-[#F4EBDD]/50 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium text-[#332F29] max-w-[140px] sm:max-w-[220px]" title={item.file.name}>
                          {item.file.name}
                        </p>
                        <span className="text-[11px] text-[#62584C]">{item.size}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      className="p-1 rounded text-[#62584C] hover:text-[#A34F38] hover:bg-[#A34F38]/10 transition-colors"
                      title={`Hapus ${item.file.name}`}
                      aria-label={`Hapus berkas ${item.file.name}`}
                    >
                      <Trash2 size={14} aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Center conversion icon indicator */}
        <div className="hidden lg:flex flex-col items-center justify-center gap-1.5 self-center my-auto px-2">
          <div className="w-10 h-10 rounded-full border border-[#D8CCB9] bg-[#F4EBDD] flex items-center justify-center text-[#344638] shadow-xs">
            <ArrowRightLeft size={18} aria-hidden="true" />
          </div>
          <span className="text-[11px] uppercase tracking-wider font-semibold text-[#62584C]">Konversi</span>
        </div>

        {/* Target format box & controls */}
        <div className="flex-1 flex flex-col gap-4 w-full lg:max-w-[340px] relative">
          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-[#62584C] mb-1.5">
              Format Keluaran
            </label>
            <div
              ref={triggerRef}
              role="button"
              tabIndex={0}
              aria-haspopup="menu"
              aria-expanded={isFormatOpen}
              onClick={() => setIsFormatOpen(!isFormatOpen)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setIsFormatOpen(!isFormatOpen);
                }
              }}
              className="h-12 border border-[#D8CCB9] rounded-lg px-3.5 bg-[#FFFCF6] hover:border-[#A34F38] focus:outline-none focus:ring-2 focus:ring-[#A34F38] transition-colors cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded bg-[#D4B98A]/30 text-[#344638] flex items-center justify-center">
                  <FileImage size={16} aria-hidden="true" />
                </div>
                <span className="text-sm font-semibold text-[#332F29]">
                  {formatLabel(outputFormat)}
                </span>
              </div>
              <ChevronDown
                size={16}
                className={`text-[#62584C] transition-transform duration-200 ${isFormatOpen ? "rotate-180" : ""}`}
                aria-hidden="true"
              />
            </div>

            {/* Popover */}
            {isFormatOpen && (
              <div
                ref={popoverRef}
                className="absolute top-full left-0 sm:left-auto sm:right-0 mt-2 w-full sm:w-[280px] z-50 bg-[#FFFCF6] border border-[#D8CCB9] rounded-lg shadow-md p-2.5 grid grid-cols-2 gap-2"
                role="menu"
              >
                {supportedFormats.map((fmt, idx) => {
                  const isSelected = outputFormat === fmt.mime;
                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={!fmt.supported}
                      title={!fmt.supported ? "Hanya didukung sebagai input. Canvas browser tidak dapat meng-encode format ini." : undefined}
                      className={`border rounded-md py-2 px-2.5 text-left transition-colors flex items-center justify-between ${
                        fmt.supported
                          ? isSelected
                            ? "border-[#A34F38] bg-[#A34F38]/10 text-[#332F29] font-semibold"
                            : "border-[#D8CCB9] text-[#332F29] hover:bg-[#D4B98A]/20"
                          : "border-[#D8CCB9]/50 text-[#62584C]/50 bg-[#F4EBDD]/40 cursor-not-allowed"
                      }`}
                      onClick={() => {
                        if (fmt.supported) {
                          setOutputFormat(fmt.mime);
                          setIsFormatOpen(false);
                        }
                      }}
                    >
                      <span className="text-xs sm:text-sm">{fmt.label}</span>
                      {isSelected && <Check size={14} className="text-[#A34F38]" aria-hidden="true" />}
                      {!fmt.supported && <span className="text-[10px] text-[#A34F38]">Input saja</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pengaturan Kualitas & Dimensi */}
          <div className="space-y-3 pt-1 border-t border-[#D8CCB9]/60">
            {(outputFormat === "image/jpeg" || outputFormat === "image/webp") && (
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-[#332F29]">Kualitas Kompresi</label>
                  <span className="text-xs font-semibold text-[#A34F38]">{Math.round(quality * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.05"
                  value={quality}
                  onChange={(e) => setQuality(parseFloat(e.target.value))}
                  className="w-full accent-[#A34F38] cursor-pointer"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-2.5">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-medium text-[#62584C]">Lebar (px)</label>
                <input
                  type="number"
                  min="0"
                  placeholder="Otomatis"
                  value={targetWidth || ""}
                  onChange={(e) => setTargetWidth(parseInt(e.target.value) || 0)}
                  className="h-9 w-full border border-[#D8CCB9] rounded-md px-2.5 bg-[#FFFCF6] text-xs text-[#332F29] placeholder-[#62584C]/50 focus:border-[#A34F38] focus:ring-1 focus:ring-[#A34F38] outline-none"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-medium text-[#62584C]">Tinggi (px)</label>
                <input
                  type="number"
                  min="0"
                  placeholder="Otomatis"
                  value={targetHeight || ""}
                  onChange={(e) => setTargetHeight(parseInt(e.target.value) || 0)}
                  className="h-9 w-full border border-[#D8CCB9] rounded-md px-2.5 bg-[#FFFCF6] text-xs text-[#332F29] placeholder-[#62584C]/50 focus:border-[#A34F38] focus:ring-1 focus:ring-[#A34F38] outline-none"
                />
              </div>
            </div>

            {/* Catatan format jujur untuk SVG & GIF */}
            {outputFormat === "image/svg+xml" && (
              <p className="text-[11px] text-[#62584C] bg-[#F4EBDD]/70 p-2.5 rounded-md border border-[#D4B98A]/50 leading-relaxed">
                <strong className="text-[#344638]">Catatan SVG:</strong> Berkas SVG membungkus gambar raster (embedded raster), bukan vektor hasil tracing.
              </p>
            )}
            {outputFormat === "image/gif" && (
              <p className="text-[11px] text-[#62584C] bg-[#F4EBDD]/70 p-2.5 rounded-md border border-[#D4B98A]/50 leading-relaxed">
                <strong className="text-[#344638]">Catatan GIF:</strong> Output menghasilkan GIF statis (frame tunggal, kuantisasi 256 warna). Animasi multi-frame tidak didukung.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Convert action button */}
      <div className="flex justify-center pt-2">
        <button
          type="button"
          onClick={triggerConvert}
          disabled={files.length === 0 || isConverting}
          className="h-12 flex items-center justify-center gap-2 bg-[#A34F38] text-white px-8 rounded-lg text-sm font-medium hover:bg-[#8B3F2A] active:scale-[0.99] disabled:bg-[#A34F38]/40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#A34F38] transition-all shadow-xs"
        >
          {isConverting ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4 animate-spin" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 2 5.373 2 12h4zm8 10a8 8 0 008-8h-8A8 8 0 000 8h4a8 8 0 008 8z" fill="currentColor" />
              </svg>
              <span>Mengonversi...</span>
            </>
          ) : (
            <>
              <ArrowRightLeft size={17} aria-hidden="true" />
              <span>Konversi Gambar</span>
            </>
          )}
        </button>
      </div>

      {/* Results area */}
      {converted.length > 0 && (
        <section className="mt-4 pt-6 border-t border-[#D8CCB9] w-full space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg sm:text-xl font-serif font-bold text-[#332F29]">Hasil Konversi</h2>
              <p className="text-xs text-[#62584C]">{converted.length} berkas berhasil diproses</p>
            </div>
            <button
              type="button"
              onClick={handleDownloadAll}
              className="h-9 inline-flex items-center gap-1.5 bg-[#344638] text-white text-xs font-medium px-3.5 rounded-md hover:bg-[#28362b] focus:outline-none focus:ring-2 focus:ring-[#344638] transition-colors shadow-xs"
            >
              <Archive size={14} aria-hidden="true" />
              <span>Unduh Semua (.zip)</span>
            </button>
          </div>
          <div className="border border-[#D8CCB9] rounded-lg bg-[#FFFCF6] divide-y divide-[#D8CCB9] overflow-hidden shadow-xs">
            {converted.map((c, i) => {
              const ext = mimeToExt(c.mime);
              const downloadFilename = `${c.original.file.name.replace(/\.[^/.]+$/, "")}_converted.${ext}`;
              return (
                <div key={i} className="flex items-center justify-between p-3 sm:px-4 sm:py-3.5 hover:bg-[#D4B98A]/10 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Real Converted Image Thumbnail */}
                    <img
                      src={c.url}
                      alt={c.original.file.name}
                      className="w-10 h-10 rounded object-cover border border-[#D8CCB9] bg-[#F4EBDD]/50 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#332F29] truncate max-w-[160px] sm:max-w-[280px]" title={c.original.file.name}>
                        {c.original.file.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-[#344638]/10 text-[#344638] border border-[#344638]/20">
                          {formatLabel(c.mime)}
                        </span>
                        <span className="text-xs text-[#62584C]">{c.size}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDownload(c.url, downloadFilename)}
                    className="ml-3 h-8 px-3 rounded-md text-xs font-medium border border-[#A34F38] text-[#A34F38] hover:bg-[#A34F38] hover:text-[#FFFCF6] inline-flex items-center gap-1 transition-colors whitespace-nowrap shrink-0"
                  >
                    <Download size={13} aria-hidden="true" />
                    <span>Unduh</span>
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
