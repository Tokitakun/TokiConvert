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
  RotateCcw,
  AlertCircle,
  Clock,
} from "lucide-react";

export type QueueStatus = "queued" | "processing" | "success" | "failed";

export interface BatchItem {
  id: string;
  file: File;
  name: string;
  size: string;
  url: string;
  targetFormat: string;
  status: QueueStatus;
  errorMessage?: string;
  convertedBlob?: Blob;
  convertedUrl?: string;
  convertedSize?: string;
  convertedMime?: string;
}

export default function ConverterWorkspace({
  onValidate,
}: {
  onValidate: (files: FileList) => { valid: File[]; errors: Map<File, string> };
}) {
  const [queue, setQueue] = useState<BatchItem[]>([]);
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [outputFormat, setOutputFormat] = useState<string>("image/png");
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [isZipping, setIsZipping] = useState<boolean>(false);
  const [status, setStatus] = useState<string>("");

  const [quality, setQuality] = useState<number>(0.92);
  const [targetWidth, setTargetWidth] = useState<number>(0);
  const [targetHeight, setTargetHeight] = useState<number>(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const [isFormatOpen, setIsFormatOpen] = useState<boolean>(false);

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

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
  };

  const formatLabel = (mime: string): string => {
    const found = supportedFormats.find((f) => f.mime === mime);
    return found ? found.label : mime.replace("image/", "").toUpperCase();
  };

  // Helper: Windows 24-bit uncompressed BMP Blob from ImageData
  const imageDataToBmpBlob = (imageData: ImageData): Blob => {
    const width = imageData.width;
    const height = imageData.height;
    const rowSize = Math.floor((24 * width + 31) / 32) * 4;
    const pixelArraySize = rowSize * height;
    const fileSize = 54 + pixelArraySize;
    const buffer = new ArrayBuffer(fileSize);
    const view = new DataView(buffer);

    view.setUint16(0, 0x424D, false); // "BM"
    view.setUint32(2, fileSize, true);
    view.setUint16(6, 0, true);
    view.setUint16(8, 0, true);
    view.setUint32(10, 54, true);

    view.setUint32(14, 40, true);
    view.setInt32(18, width, true);
    view.setInt32(22, height, true);
    view.setUint16(26, 1, true);
    view.setUint16(28, 24, true);
    view.setUint32(30, 0, true);
    view.setUint32(34, pixelArraySize, true);
    view.setInt32(38, 2835, true);
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
        view.setUint8(offset++, 0);
      }
    }

    return new Blob([buffer], { type: "image/bmp" });
  };

  // Helper: GIF89a Blob from ImageData with LZW & transparency
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

  // Helper: Valid SVG XML Document Blob wrapping raster data
  const createSvgBlob = (width: number, height: number, dataUrl: string): Blob => {
    const svgXml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
      `  <image width="${width}" height="${height}" href="${dataUrl}" xlink:href="${dataUrl}"/>`,
      "</svg>",
    ].join("\n");
    return new Blob([svgXml], { type: "image/svg+xml" });
  };

  // Core conversion execution for one file
  const performConversion = async (
    file: File,
    format: string,
    wTarget: number,
    hTarget: number,
    compQuality: number
  ): Promise<{ blob: Blob; mime: string; url: string; sizeStr: string }> => {
    if (file.size === 0) {
      throw new Error("Berkas kosong (0 byte)");
    }

    const isSvg = file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg");
    if (isSvg) {
      const text = await file.text();
      if (!text.includes("<svg") || text.includes("<parsererror")) {
        throw new Error("Berkas SVG tidak valid atau rusak");
      }
    }

    return new Promise((resolve, reject) => {
      const objectUrl = URL.createObjectURL(file);
      const img = new Image();

      img.onload = async () => {
        try {
          const canvas = document.createElement("canvas");
          let naturalW = img.naturalWidth || img.width;
          let naturalH = img.naturalHeight || img.height;
          if (!naturalW || !naturalH) {
            naturalW = 800;
            naturalH = 600;
          }
          const width = wTarget > 0 ? wTarget : naturalW;
          const height = hTarget > 0 ? hTarget : naturalH;
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            URL.revokeObjectURL(objectUrl);
            reject(new Error("Canvas 2D tidak didukung oleh browser"));
            return;
          }

          if (format === "image/jpeg" || format === "image/bmp") {
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, width, height);
          }

          ctx.drawImage(img, 0, 0, width, height);

          // 1. BMP
          if (format === "image/bmp") {
            const imageData = ctx.getImageData(0, 0, width, height);
            const bmpBlob = imageDataToBmpBlob(imageData);
            const url = URL.createObjectURL(bmpBlob);
            URL.revokeObjectURL(objectUrl);
            resolve({
              blob: bmpBlob,
              mime: "image/bmp",
              url,
              sizeStr: formatSize(bmpBlob.size),
            });
            return;
          }

          // 2. GIF
          if (format === "image/gif") {
            const imageData = ctx.getImageData(0, 0, width, height);
            const gifBlob = imageDataToGifBlob(imageData);
            const url = URL.createObjectURL(gifBlob);
            URL.revokeObjectURL(objectUrl);
            resolve({
              blob: gifBlob,
              mime: "image/gif",
              url,
              sizeStr: formatSize(gifBlob.size),
            });
            return;
          }

          // 3. SVG
          if (format === "image/svg+xml") {
            const dataUrl = canvas.toDataURL("image/png");
            const svgBlob = createSvgBlob(width, height, dataUrl);
            const url = URL.createObjectURL(svgBlob);
            URL.revokeObjectURL(objectUrl);
            resolve({
              blob: svgBlob,
              mime: "image/svg+xml",
              url,
              sizeStr: formatSize(svgBlob.size),
            });
            return;
          }

          // 4. Native Canvas Blob for PNG, JPEG, WEBP
          canvas.toBlob(
            (blob) => {
              URL.revokeObjectURL(objectUrl);
              if (!blob) {
                reject(new Error("Encoding gambar menghasilkan berkas kosong"));
                return;
              }
              const url = URL.createObjectURL(blob);
              resolve({
                blob,
                mime: blob.type || format,
                url,
                sizeStr: formatSize(blob.size),
              });
            },
            format,
            format === "image/jpeg" || format === "image/webp" ? compQuality : undefined
          );
        } catch (err) {
          URL.revokeObjectURL(objectUrl);
          reject(err instanceof Error ? err : new Error("Gagal mengonversi gambar"));
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Gagal membaca atau memproses berkas gambar"));
      };

      img.src = objectUrl;
    });
  };

  // Click-outside handler for dropdown
  useEffect(() => {
    if (isFormatOpen) {
      const handleClickOutside = (event: MouseEvent) => {
        if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
          setIsFormatOpen(false);
        }
      };
      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
          setIsFormatOpen(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("keydown", handleEscape);
      };
    }
  }, [isFormatOpen]);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      queue.forEach((item) => {
        URL.revokeObjectURL(item.url);
        if (item.convertedUrl) URL.revokeObjectURL(item.convertedUrl);
      });
    };
  }, [queue]);

  // Safe unique output filename generator (avoids ZIP & download collisions)
  const getUniqueOutputFilenames = (items: BatchItem[]): Map<string, string> => {
    const nameMap = new Map<string, string>();
    const usedNames = new Set<string>();

    for (const item of items) {
      const ext = mimeToExt(item.convertedMime || item.targetFormat);
      const baseName = item.name.replace(/\.[^/.]+$/, "");
      let candidate = `${baseName}_converted.${ext}`;
      let counter = 1;
      while (usedNames.has(candidate.toLowerCase())) {
        candidate = `${baseName}_converted_${counter}.${ext}`;
        counter++;
      }
      usedNames.add(candidate.toLowerCase());
      nameMap.set(item.id, candidate);
    }
    return nameMap;
  };

  const addFiles = (fileList: FileList) => {
    const { valid, errors } = onValidate(fileList);
    const newErrs: string[] = [];
    errors.forEach((msg) => newErrs.push(msg));
    if (newErrs.length > 0) {
      setErrorMessages((prev) => [...prev, ...newErrs]);
    }

    const availableSlots = 10 - queue.length;
    if (availableSlots <= 0) {
      setErrorMessages((prev) => [...prev, "Antrean sudah penuh (maksimal 10 berkas)."]);
      return;
    }

    const filesToAdd = valid.slice(0, availableSlots);
    if (valid.length > availableSlots) {
      setErrorMessages((prev) => [
        ...prev,
        `Hanya ${availableSlots} berkas yang ditambahkan karena batas antrean maksimal 10 berkas.`,
      ]);
    }

    const newItems: BatchItem[] = filesToAdd.map((f) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      file: f,
      name: f.name,
      size: formatSize(f.size),
      url: URL.createObjectURL(f),
      targetFormat: outputFormat,
      status: "queued",
    }));

    filesToAdd.forEach((f) => {
      if (f.type === "image/gif" || f.name.toLowerCase().endsWith(".gif")) {
        setErrorMessages((prev) => [
          ...prev,
          `Catatan GIF: Hanya frame pertama dari '${f.name}' yang akan diproses.`,
        ]);
      }
    });

    setQueue((prev) => [...prev, ...newItems]);
    setStatus(`${filesToAdd.length} berkas ditambahkan ke antrean`);
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

  const openFilePicker = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(e.target.files);
      e.target.value = "";
    }
  };

  const removeQueueItem = (id: string) => {
    if (isConverting) return;
    setQueue((prev) => {
      const item = prev.find((it) => it.id === id);
      if (item) {
        URL.revokeObjectURL(item.url);
        if (item.convertedUrl) URL.revokeObjectURL(item.convertedUrl);
      }
      return prev.filter((it) => it.id !== id);
    });
  };

  const clearAllQueue = () => {
    if (isConverting) return;
    queue.forEach((item) => {
      URL.revokeObjectURL(item.url);
      if (item.convertedUrl) URL.revokeObjectURL(item.convertedUrl);
    });
    setQueue([]);
    setErrorMessages([]);
    setStatus("Semua berkas dihapus dari antrean");
  };

  // Convert a single item in the queue
  const convertQueueItem = async (item: BatchItem) => {
    setQueue((prev) =>
      prev.map((it) => (it.id === item.id ? { ...it, status: "processing", errorMessage: undefined } : it))
    );

    const fmt = item.targetFormat || outputFormat;

    try {
      const res = await performConversion(item.file, fmt, targetWidth, targetHeight, quality);
      setQueue((prev) =>
        prev.map((it) =>
          it.id === item.id
            ? {
                ...it,
                status: "success",
                targetFormat: fmt,
                convertedBlob: res.blob,
                convertedUrl: res.url,
                convertedSize: res.sizeStr,
                convertedMime: res.mime,
                errorMessage: undefined,
              }
            : it
        )
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gagal mengonversi gambar";
      setQueue((prev) =>
        prev.map((it) =>
          it.id === item.id
            ? {
                ...it,
                status: "failed",
                errorMessage: msg,
              }
            : it
        )
      );
    }
  };

  // Controlled concurrency batch runner (max 2 concurrent files to protect browser memory)
  const runBatchConversion = async (itemsToProcess: BatchItem[]) => {
    if (itemsToProcess.length === 0 || isConverting) return;
    setIsConverting(true);
    setStatus(`Mengonversi ${itemsToProcess.length} berkas...`);

    const concurrency = 2;
    let cursor = 0;

    const worker = async () => {
      while (cursor < itemsToProcess.length) {
        const item = itemsToProcess[cursor++];
        await convertQueueItem(item);
      }
    };

    const workerCount = Math.min(concurrency, itemsToProcess.length);
    await Promise.all(Array.from({ length: workerCount }, () => worker()));

    setIsConverting(false);
    setStatus("Proses konversi selesai");
  };

  // Convert All pending or failed items
  const triggerConvertAll = async () => {
    const pendingOrFailed = queue.filter((it) => it.status === "queued" || it.status === "failed");
    if (pendingOrFailed.length === 0) {
      setStatus("Semua berkas dalam antrean sudah selesai dikonversi.");
      return;
    }
    await runBatchConversion(pendingOrFailed);
  };

  // Retry only failed items without repeating successful files
  const triggerRetryFailed = async () => {
    const failedItems = queue.filter((it) => it.status === "failed");
    if (failedItems.length === 0) return;
    await runBatchConversion(failedItems);
  };

  // Download single converted file
  const handleDownloadSingle = (item: BatchItem) => {
    if (!item.convertedUrl) return;
    const nameMap = getUniqueOutputFilenames(queue.filter((q) => q.status === "success"));
    const filename =
      nameMap.get(item.id) ||
      `${item.name.replace(/\.[^/.]+$/, "")}_converted.${mimeToExt(item.convertedMime || item.targetFormat)}`;
    const a = document.createElement("a");
    a.href = item.convertedUrl;
    a.download = filename;
    a.click();
  };

  // Download ZIP archive of all successful conversions
  const handleDownloadZip = async () => {
    const successfulItems = queue.filter(
      (it) => it.status === "success" && (it.convertedBlob || it.convertedUrl)
    );
    if (successfulItems.length === 0) {
      setStatus("Tidak ada file yang berhasil dikonversi untuk diunduh");
      return;
    }

    try {
      setIsZipping(true);
      setStatus("Membuat berkas ZIP...");
      const zip = new JSZip();
      const nameMap = getUniqueOutputFilenames(successfulItems);

      for (const item of successfulItems) {
        const safeName = nameMap.get(item.id)!;
        if (item.convertedBlob) {
          zip.file(safeName, item.convertedBlob);
        } else if (item.convertedUrl) {
          const blob = await fetch(item.convertedUrl).then((r) => r.blob());
          zip.file(safeName, blob);
        }
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const zipUrl = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = zipUrl;
      a.download = `tokiconvert_batch_${new Date().toISOString().slice(0, 10)}.zip`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(zipUrl), 3000);
      setStatus("ZIP berhasil diunduh");
    } catch (err) {
      console.error("ZIP creation error:", err);
      setStatus("Gagal membuat berkas ZIP. Anda tetap dapat mengunduh berkas satu per satu di bawah.");
    } finally {
      setIsZipping(false);
    }
  };

  // Counts for status display
  const successCount = queue.filter((it) => it.status === "success").length;
  const failedCount = queue.filter((it) => it.status === "failed").length;
  const processingCount = queue.filter((it) => it.status === "processing").length;
  const queuedCount = queue.filter((it) => it.status === "queued").length;
  const successfulItems = queue.filter((it) => it.status === "success");

  return (
    <div className="flex flex-col w-full max-w-5xl mx-auto gap-8 p-6 sm:p-8 bg-[#FFFCF6] rounded-lg border border-[#D8CCB9] shadow-xs">
      {/* Status & Error notifications */}
      {status && (
        <div
          className="px-4 py-2.5 rounded-md border border-[#D4B98A]/70 bg-[#F4EBDD]/60 text-xs sm:text-sm font-medium text-[#344638] flex items-center justify-between"
          role="status"
        >
          <span>{status}</span>
          {isConverting && (
            <span className="text-xs text-[#A34F38] font-mono">
              {queue.length - queuedCount - processingCount} / {queue.length}
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

      {/* Main conversion workspace */}
      <div className="flex flex-col lg:flex-row gap-6 items-stretch">
        {/* Source upload & batch queue box */}
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
            className={`border-2 border-dashed rounded-lg p-6 sm:p-8 flex flex-col items-center justify-center min-h-[200px] transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#A34F38] ${
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

          {/* Batch Queue list */}
          {queue.length > 0 && (
            <div className="flex flex-col gap-2 mt-1">
              <div className="flex items-center justify-between text-xs text-[#62584C] px-1">
                <span className="font-medium text-[#332F29]">
                  Antrean: {queue.length} berkas{" "}
                  <span className="text-[#62584C] font-normal">
                    ({successCount} selesai{failedCount > 0 ? `, ${failedCount} gagal` : ""})
                  </span>
                </span>
                <div className="flex items-center gap-3">
                  {failedCount > 0 && (
                    <button
                      type="button"
                      disabled={isConverting}
                      onClick={triggerRetryFailed}
                      className="text-[#A34F38] hover:text-[#8B3F2A] hover:underline font-medium inline-flex items-center gap-1 disabled:opacity-50"
                    >
                      <RotateCcw size={11} aria-hidden="true" />
                      <span>Coba lagi gagal ({failedCount})</span>
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={isConverting}
                    onClick={clearAllQueue}
                    className="text-[#62584C] hover:text-[#A34F38] hover:underline font-medium transition-colors disabled:opacity-50"
                  >
                    Hapus semua
                  </button>
                </div>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                {queue.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between p-2.5 rounded-md border transition-colors ${
                      item.status === "failed"
                        ? "border-[#A34F38]/40 bg-[#A34F38]/5"
                        : item.status === "success"
                        ? "border-[#344638]/30 bg-[#344638]/5"
                        : item.status === "processing"
                        ? "border-[#A34F38]/40 bg-[#D4B98A]/10"
                        : "border-[#D8CCB9] bg-[#FFFCF6] hover:bg-[#D4B98A]/10"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {/* Mini Thumbnail */}
                      <img
                        src={item.convertedUrl || item.url}
                        alt=""
                        className="w-9 h-9 rounded object-cover border border-[#D8CCB9] bg-[#F4EBDD]/50 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p
                            className="truncate text-xs font-medium text-[#332F29] max-w-[130px] sm:max-w-[200px]"
                            title={item.name}
                          >
                            {item.name}
                          </p>
                          <span className="text-[10px] font-semibold uppercase px-1.5 py-0.2 rounded bg-[#344638]/10 text-[#344638] border border-[#344638]/20 shrink-0">
                            &rarr; {formatLabel(item.targetFormat)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[11px] text-[#62584C]">{item.size}</span>

                          {/* Status badges */}
                          {item.status === "queued" && (
                            <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-[#F4EBDD] text-[#62584C] border border-[#D8CCB9]">
                              <Clock size={10} aria-hidden="true" />
                              <span>Antrean</span>
                            </span>
                          )}
                          {item.status === "processing" && (
                            <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-[#A34F38]/15 text-[#A34F38] border border-[#A34F38]/30 font-medium">
                              <RotateCcw size={10} className="animate-spin" aria-hidden="true" />
                              <span>Memproses...</span>
                            </span>
                          )}
                          {item.status === "success" && (
                            <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-[#344638]/15 text-[#344638] border border-[#344638]/30 font-medium">
                              <Check size={10} aria-hidden="true" />
                              <span>Selesai ({item.convertedSize})</span>
                            </span>
                          )}
                          {item.status === "failed" && (
                            <span
                              className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-[#A34F38]/20 text-[#A34F38] border border-[#A34F38]/40 font-medium truncate max-w-[150px]"
                              title={item.errorMessage}
                            >
                              <AlertCircle size={10} aria-hidden="true" />
                              <span className="truncate">{item.errorMessage || "Gagal"}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Item action buttons */}
                    <div className="flex items-center gap-1.5 ml-2 shrink-0">
                      {item.status === "failed" && (
                        <button
                          type="button"
                          disabled={isConverting}
                          onClick={() => convertQueueItem(item)}
                          className="h-7 px-2 rounded text-[11px] font-medium border border-[#A34F38] text-[#A34F38] hover:bg-[#A34F38] hover:text-white inline-flex items-center gap-1 transition-colors disabled:opacity-50"
                          title="Coba lagi berkas ini"
                        >
                          <RotateCcw size={11} aria-hidden="true" />
                          <span className="hidden sm:inline">Coba lagi</span>
                        </button>
                      )}

                      {item.status === "success" && (
                        <button
                          type="button"
                          onClick={() => handleDownloadSingle(item)}
                          className="h-7 px-2 rounded text-[11px] font-medium border border-[#344638] text-[#344638] hover:bg-[#344638] hover:text-white inline-flex items-center gap-1 transition-colors"
                          title="Unduh berkas ini"
                        >
                          <Download size={11} aria-hidden="true" />
                          <span className="hidden sm:inline">Unduh</span>
                        </button>
                      )}

                      <button
                        type="button"
                        disabled={isConverting}
                        onClick={() => removeQueueItem(item.id)}
                        className="p-1 rounded text-[#62584C] hover:text-[#A34F38] hover:bg-[#A34F38]/10 transition-colors disabled:opacity-40"
                        title={`Hapus ${item.name}`}
                        aria-label={`Hapus berkas ${item.name}`}
                      >
                        <Trash2 size={14} aria-hidden="true" />
                      </button>
                    </div>
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
                          // Sync format to pending queue items
                          setQueue((prev) =>
                            prev.map((it) =>
                              it.status === "queued" ? { ...it, targetFormat: fmt.mime } : it
                            )
                          );
                          setIsFormatOpen(false);
                        }
                      }}
                    >
                      <span className="text-xs sm:text-sm">{fmt.label}</span>
                      {isSelected && <Check size={14} className="text-[#A34F38]" aria-hidden="true" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quality & Dimension controls */}
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

            {/* Honest format disclosures */}
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
          onClick={triggerConvertAll}
          disabled={queue.length === 0 || isConverting}
          className="h-12 flex items-center justify-center gap-2 bg-[#A34F38] text-white px-8 rounded-lg text-sm font-medium hover:bg-[#8B3F2A] active:scale-[0.99] disabled:bg-[#A34F38]/40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#A34F38] transition-all shadow-xs"
        >
          {isConverting ? (
            <>
              <RotateCcw size={17} className="animate-spin" aria-hidden="true" />
              <span>Mengonversi Berkas ({queue.length - queuedCount} / {queue.length})...</span>
            </>
          ) : queuedCount === 0 && failedCount === 0 && successCount > 0 ? (
            <>
              <Check size={17} aria-hidden="true" />
              <span>Semua Berkas Selesai Dikonversi</span>
            </>
          ) : failedCount > 0 && queuedCount === 0 ? (
            <>
              <RotateCcw size={17} aria-hidden="true" />
              <span>Coba Lagi Berkas Gagal ({failedCount})</span>
            </>
          ) : (
            <>
              <ArrowRightLeft size={17} aria-hidden="true" />
              <span>Konversi Semua ({queue.length} Berkas)</span>
            </>
          )}
        </button>
      </div>

      {/* Results and ZIP Download Section */}
      {(successCount > 0 || failedCount > 0) && (
        <section className="mt-4 pt-6 border-t border-[#D8CCB9] w-full space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg sm:text-xl font-serif font-bold text-[#332F29]">Hasil Konversi</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs px-2 py-0.5 rounded bg-[#344638]/10 text-[#344638] font-medium border border-[#344638]/20">
                  {successCount} berkas berhasil
                </span>
                {failedCount > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded bg-[#A34F38]/10 text-[#A34F38] font-medium border border-[#A34F38]/20">
                    {failedCount} berkas gagal
                  </span>
                )}
              </div>
            </div>

            {/* ZIP Download button */}
            <button
              type="button"
              disabled={successCount === 0 || isZipping || isConverting}
              onClick={handleDownloadZip}
              className="h-10 inline-flex items-center justify-center gap-2 bg-[#344638] text-white text-xs sm:text-sm font-medium px-4 rounded-md hover:bg-[#28362b] disabled:bg-[#344638]/40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#344638] transition-colors shadow-xs"
            >
              {isZipping ? (
                <>
                  <RotateCcw size={15} className="animate-spin" aria-hidden="true" />
                  <span>Membuat ZIP...</span>
                </>
              ) : (
                <>
                  <Archive size={15} aria-hidden="true" />
                  <span>Unduh ZIP ({successCount} Berkas)</span>
                </>
              )}
            </button>
          </div>

          {/* Success items list */}
          {successfulItems.length > 0 && (
            <div className="border border-[#D8CCB9] rounded-lg bg-[#FFFCF6] divide-y divide-[#D8CCB9] overflow-hidden shadow-xs">
              {successfulItems.map((c) => {
                const nameMap = getUniqueOutputFilenames(successfulItems);
                const downloadFilename = nameMap.get(c.id) || `${c.name}_converted.${mimeToExt(c.convertedMime || c.targetFormat)}`;
                return (
                  <div key={c.id} className="flex items-center justify-between p-3 sm:px-4 sm:py-3.5 hover:bg-[#D4B98A]/10 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={c.convertedUrl || c.url}
                        alt={c.name}
                        className="w-10 h-10 rounded object-cover border border-[#D8CCB9] bg-[#F4EBDD]/50 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#332F29] truncate max-w-[160px] sm:max-w-[280px]" title={downloadFilename}>
                          {downloadFilename}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-[#344638]/10 text-[#344638] border border-[#344638]/20">
                            {formatLabel(c.convertedMime || c.targetFormat)}
                          </span>
                          <span className="text-xs text-[#62584C]">{c.convertedSize || c.size}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDownloadSingle(c)}
                      className="ml-3 h-8 px-3 rounded-md text-xs font-medium border border-[#A34F38] text-[#A34F38] hover:bg-[#A34F38] hover:text-[#FFFCF6] inline-flex items-center gap-1 transition-colors whitespace-nowrap shrink-0"
                    >
                      <Download size={13} aria-hidden="true" />
                      <span>Unduh</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
