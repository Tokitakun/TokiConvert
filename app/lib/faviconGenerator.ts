import JSZip from "jszip";

export interface FaviconOptions {
  appName: string;
  shortName: string;
  backgroundColor: string; // 'transparent' or hex like '#ffffff'
  paddingPercent: number; // 0 to 25
  includeSvgIfAvailable: boolean;
}

export interface GeneratedFileItem {
  name: string;
  dimensions?: string;
  sizeBytes: number;
  type: string;
  blob: Blob;
  previewUrl?: string;
}

export interface GenerationResult {
  zipBlob: Blob;
  zipSize: number;
  files: GeneratedFileItem[];
  htmlSnippet: string;
}

/**
 * Buat file ICO binary valid dari beberapa buffer PNG (16x16, 32x32, 48x48).
 * Standar format ICO container dengan PNG payload (didukung penuh peramban modern & Windows).
 */
export function buildIcoBinary(
  images: Array<{ width: number; height: number; buffer: Uint8Array }>
): Uint8Array {
  const count = images.length;
  const headerSize = 6;
  const entrySize = 16;
  const entriesTotalSize = count * entrySize;
  let currentOffset = headerSize + entriesTotalSize;

  let totalSize = currentOffset;
  for (const img of images) {
    totalSize += img.buffer.byteLength;
  }

  const icoBuffer = new Uint8Array(totalSize);
  const view = new DataView(icoBuffer.buffer);

  // ICONDIR header
  view.setUint16(0, 0, true); // reserved (0)
  view.setUint16(2, 1, true); // resource type (1 = ICO)
  view.setUint16(4, count, true); // number of images

  let entryOffset = headerSize;
  for (let i = 0; i < count; i++) {
    const img = images[i];
    const imgLen = img.buffer.byteLength;

    // ICONDIRENTRY
    view.setUint8(entryOffset + 0, img.width >= 256 ? 0 : img.width);
    view.setUint8(entryOffset + 1, img.height >= 256 ? 0 : img.height);
    view.setUint8(entryOffset + 2, 0); // color count (0 for 32bpp)
    view.setUint8(entryOffset + 3, 0); // reserved (0)
    view.setUint16(entryOffset + 4, 1, true); // color planes
    view.setUint16(entryOffset + 6, 32, true); // bits per pixel (32 for RGBA)
    view.setUint32(entryOffset + 8, imgLen, true); // size of image data in bytes
    view.setUint32(entryOffset + 12, currentOffset, true); // file offset of image data

    // Salin byte PNG mentah
    icoBuffer.set(img.buffer, currentOffset);

    currentOffset += imgLen;
    entryOffset += entrySize;
  }

  return icoBuffer;
}

/**
 * Render elemen gambar ke Canvas dengan background dan padding yang disesuaikan.
 */
export async function renderToCanvas(
  imgSource: HTMLImageElement,
  size: number,
  options: { backgroundColor: string; paddingPercent: number }
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    throw new Error("Gagal menginisialisasi 2D Canvas context");
  }

  // Aktifkan image smoothing berkualitas tinggi
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // Background
  if (options.backgroundColor && options.backgroundColor !== "transparent") {
    ctx.fillStyle = options.backgroundColor;
    ctx.fillRect(0, 0, size, size);
  } else {
    ctx.clearRect(0, 0, size, size);
  }

  // Padding
  const paddingRatio = Math.max(0, Math.min(0.3, options.paddingPercent / 100));
  const innerSize = size * (1 - paddingRatio * 2);

  // Pertahankan rasio aspek gambar (fit: contain)
  const origW = imgSource.naturalWidth || imgSource.width || 1;
  const origH = imgSource.naturalHeight || imgSource.height || 1;
  const aspect = origW / origH;

  let drawW = innerSize;
  let drawH = innerSize;

  if (aspect >= 1) {
    drawH = innerSize / aspect;
  } else {
    drawW = innerSize * aspect;
  }

  const drawX = (size - drawW) / 2;
  const drawY = (size - drawH) / 2;

  ctx.drawImage(imgSource, drawX, drawY, drawW, drawH);

  return canvas;
}

/**
 * Konversi Canvas ke PNG Blob
 */
export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("Gagal mengonversi canvas ke blob"));
      }
    }, "image/png");
  });
}

/**
 * Konversi Blob ke Uint8Array
 */
export async function blobToUint8Array(blob: Blob): Promise<Uint8Array> {
  const arrayBuffer = await blob.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

/**
 * Sanitasi SVG sederhana dan aman: memastikan berkas berformat XML SVG valid
 * tanpa skrip atau tag eksekusi berbahaya sebelum dimasukkan ke ZIP.
 */
export function isSafeSvg(svgText: string): boolean {
  const lower = svgText.toLowerCase();
  if (lower.includes("<script") || lower.includes("javascript:") || lower.includes("onload=") || lower.includes("onerror=")) {
    return false;
  }
  return lower.includes("<svg") && lower.includes("</svg>");
}

/**
 * Pipeline Utama Favicon Pack Generator
 */
export async function generateFaviconPack(
  sourceFile: File,
  options: FaviconOptions,
  onProgress?: (percent: number, status: string) => void
): Promise<GenerationResult> {
  onProgress?.(10, "Membaca berkas logo sumber...");

  // Load source image safely via object URL
  const objectUrl = URL.createObjectURL(sourceFile);
  const img = new Image();
  img.crossOrigin = "anonymous";

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Format berkas gambar tidak didukung atau berkas rusak"));
    img.src = objectUrl;
  });

  onProgress?.(25, "Merender variasi resolusi PNG...");

  // Target ukuran standar favicon pack
  const targets = [
    { name: "favicon-16x16.png", size: 16 },
    { name: "favicon-32x32.png", size: 32 },
    { name: "apple-touch-icon.png", size: 180 },
    { name: "android-chrome-192x192.png", size: 192 },
    { name: "android-chrome-512x512.png", size: 512 },
  ];

  const renderedBlobs: Map<string, { blob: Blob; buffer: Uint8Array; canvas: HTMLCanvasElement }> = new Map();

  for (let i = 0; i < targets.length; i++) {
    const target = targets[i];
    const canvas = await renderToCanvas(img, target.size, {
      backgroundColor: options.backgroundColor,
      paddingPercent: options.paddingPercent,
    });
    const blob = await canvasToBlob(canvas);
    const buffer = await blobToUint8Array(blob);
    renderedBlobs.set(target.name, { blob, buffer, canvas });
  }

  onProgress?.(50, "Membuat file multi-resolution favicon.ico...");

  // Juga render ukuran 48x48 khusus untuk disematkan di dalam favicon.ico
  const canvas48 = await renderToCanvas(img, 48, {
    backgroundColor: options.backgroundColor,
    paddingPercent: options.paddingPercent,
  });
  const blob48 = await canvasToBlob(canvas48);
  const buffer48 = await blobToUint8Array(blob48);

  const buffer16 = renderedBlobs.get("favicon-16x16.png")!.buffer;
  const buffer32 = renderedBlobs.get("favicon-32x32.png")!.buffer;

  // Bangun binary ICO valid dengan 3 resolusi (16, 32, 48)
  const icoUint8 = buildIcoBinary([
    { width: 16, height: 16, buffer: buffer16 },
    { width: 32, height: 32, buffer: buffer32 },
    { width: 48, height: 48, buffer: buffer48 },
  ]);

  const icoBlob = new Blob([icoUint8.buffer as ArrayBuffer], { type: "image/x-icon" });

  onProgress?.(65, "Membuat manifest dan dokumen panduan...");

  // site.webmanifest
  const manifestData = {
    name: options.appName || "My Application",
    short_name: options.shortName || options.appName || "App",
    icons: [
      {
        src: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    theme_color: options.backgroundColor !== "transparent" ? options.backgroundColor : "#ffffff",
    background_color: options.backgroundColor !== "transparent" ? options.backgroundColor : "#ffffff",
    display: "standalone",
  };
  const manifestString = JSON.stringify(manifestData, null, 2);
  const manifestBlob = new Blob([manifestString], { type: "application/manifest+json" });

  // index.html panduan tag
  const isSvgInput = sourceFile.type === "image/svg+xml" || sourceFile.name.toLowerCase().endsWith(".svg");
  let hasValidSvg = false;
  let safeSvgBlob: Blob | null = null;

  if (isSvgInput && options.includeSvgIfAvailable) {
    try {
      const svgText = await sourceFile.text();
      if (isSafeSvg(svgText)) {
        hasValidSvg = true;
        safeSvgBlob = new Blob([svgText], { type: "image/svg+xml" });
      }
    } catch {
      hasValidSvg = false;
    }
  }

  const htmlSnippet = `<!-- Favicon & App Icons generated by TokiConvert (https://tokiconvert.com) -->
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="manifest" href="/site.webmanifest">
${hasValidSvg ? '<link rel="icon" type="image/svg+xml" href="/favicon.svg">\n' : ""}<link rel="shortcut icon" href="/favicon.ico">
<meta name="theme-color" content="${manifestData.theme_color}">`;

  const htmlDocBlob = new Blob([`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${manifestData.name}</title>
  ${htmlSnippet}
</head>
<body style="font-family: sans-serif; padding: 2rem; background: #fafafa; color: #333;">
  <h1>Favicon Pack Ready!</h1>
  <p>Semua tag ikon telah disematkan di dalam bagian &lt;head&gt; berkas ini.</p>
</body>
</html>`], { type: "text/html" });

  // README.txt
  const readmeText = `TokiConvert - Favicon Pack Usage Guide
======================================

1. PENGGUNAAN BERKAS:
   Salin semua berkas ikon hasil ekstraksi (favicon.ico, apple-touch-icon.png,
   favicon-32x32.png, favicon-16x16.png, android-chrome-192x192.png,
   android-chrome-512x512.png${hasValidSvg ? ", favicon.svg" : ""}, dan site.webmanifest)
   ke direktori root website Anda (contoh: folder public/ atau root domain /).

2. KODE HTML:
   Salin cuplikan kode berikut ke dalam bagian <head> halaman HTML Anda:

${htmlSnippet}

Dihasilkan 100% di peramban secara privat dengan TokiConvert.
Data dan gambar Anda tidak pernah diunggah ke server cloud.`;

  const readmeBlob = new Blob([readmeText], { type: "text/plain" });

  onProgress?.(80, "Mengemas ke dalam arsip ZIP...");

  // Bangun file list
  const files: GeneratedFileItem[] = [
    {
      name: "favicon.ico",
      dimensions: "16x16, 32x32, 48x48",
      sizeBytes: icoBlob.size,
      type: "image/x-icon",
      blob: icoBlob,
      previewUrl: URL.createObjectURL(icoBlob),
    },
    {
      name: "favicon-16x16.png",
      dimensions: "16x16 px",
      sizeBytes: renderedBlobs.get("favicon-16x16.png")!.blob.size,
      type: "image/png",
      blob: renderedBlobs.get("favicon-16x16.png")!.blob,
      previewUrl: URL.createObjectURL(renderedBlobs.get("favicon-16x16.png")!.blob),
    },
    {
      name: "favicon-32x32.png",
      dimensions: "32x32 px",
      sizeBytes: renderedBlobs.get("favicon-32x32.png")!.blob.size,
      type: "image/png",
      blob: renderedBlobs.get("favicon-32x32.png")!.blob,
      previewUrl: URL.createObjectURL(renderedBlobs.get("favicon-32x32.png")!.blob),
    },
    {
      name: "apple-touch-icon.png",
      dimensions: "180x180 px",
      sizeBytes: renderedBlobs.get("apple-touch-icon.png")!.blob.size,
      type: "image/png",
      blob: renderedBlobs.get("apple-touch-icon.png")!.blob,
      previewUrl: URL.createObjectURL(renderedBlobs.get("apple-touch-icon.png")!.blob),
    },
    {
      name: "android-chrome-192x192.png",
      dimensions: "192x192 px",
      sizeBytes: renderedBlobs.get("android-chrome-192x192.png")!.blob.size,
      type: "image/png",
      blob: renderedBlobs.get("android-chrome-192x192.png")!.blob,
      previewUrl: URL.createObjectURL(renderedBlobs.get("android-chrome-192x192.png")!.blob),
    },
    {
      name: "android-chrome-512x512.png",
      dimensions: "512x512 px",
      sizeBytes: renderedBlobs.get("android-chrome-512x512.png")!.blob.size,
      type: "image/png",
      blob: renderedBlobs.get("android-chrome-512x512.png")!.blob,
      previewUrl: URL.createObjectURL(renderedBlobs.get("android-chrome-512x512.png")!.blob),
    },
  ];

  if (hasValidSvg && safeSvgBlob) {
    files.push({
      name: "favicon.svg",
      dimensions: "Scalable Vector",
      sizeBytes: safeSvgBlob.size,
      type: "image/svg+xml",
      blob: safeSvgBlob,
      previewUrl: URL.createObjectURL(safeSvgBlob),
    });
  }

  files.push(
    {
      name: "site.webmanifest",
      dimensions: "JSON Config",
      sizeBytes: manifestBlob.size,
      type: "application/manifest+json",
      blob: manifestBlob,
    },
    {
      name: "index.html",
      dimensions: "HTML Snippet",
      sizeBytes: htmlDocBlob.size,
      type: "text/html",
      blob: htmlDocBlob,
    },
    {
      name: "README.txt",
      dimensions: "Guide Text",
      sizeBytes: readmeBlob.size,
      type: "text/plain",
      blob: readmeBlob,
    }
  );

  // Buat ZIP via JSZip
  const zip = new JSZip();
  for (const item of files) {
    zip.file(item.name, item.blob);
  }

  onProgress?.(95, "Mengompresi seluruh paket ZIP...");
  const zipBlob = await zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });

  // Bersihkan object URL sumber
  URL.revokeObjectURL(objectUrl);

  onProgress?.(100, "Selesai! Paket favicon siap diunduh.");

  return {
    zipBlob,
    zipSize: zipBlob.size,
    files,
    htmlSnippet,
  };
}
