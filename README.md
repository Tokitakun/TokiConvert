# TokiConvert

Utilitas konversi berkas open-source yang berjalan sepenuhnya di peramban. Tidak ada upload ke server cloud untuk konversi berkas lokal — semua proses berlangsung di perangkat Anda.

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-blue)](https://react.dev)

---

## Fitur yang Tersedia

| Utilitas | Engine | Format |
|---|---|---|
| **Image Converter** | HTML5 Canvas API | PNG, JPG, WEBP, BMP, SVG, GIF |
| **Favicon Pack Generator** | Canvas + Binary ICO + JSZip | ICO, PNG 16–512px, WebManifest, ZIP |
| **Audio Converter** | Web Audio API + lamejs | WAV, MP3, OGG, M4A → MP3 |
| **Video Converter** | FFmpeg WebAssembly | MP4, WebM, MKV, AVI, MOV |
| **Document Converter** | pdf-lib + mammoth + DOMPurify | TXT/Img → PDF · DOCX → HTML |
| **Media Downloader** | Server proxy + @coflyn/scrapr | URL media publik (stream) |

Semua konversi berkas lokal berlangsung 100% di sisi klien. Berkas Anda tidak pernah meninggalkan perangkat.

**Media Downloader** adalah satu-satunya fitur yang menggunakan server, dan hanya untuk memproses URL media publik — bukan berkas lokal pengguna.

---

## Teknologi

### Framework & Core
- **Next.js 16** (App Router) — framework utama
- **React 19** — pustaka antarmuka
- **TypeScript** — pengetikan statis

### Styling
- **Tailwind CSS v4** — styling utilitas
- **Lucide React** — ikon antarmuka

### Client-Side Engines
- **HTML5 Canvas API** — konversi format gambar
- **Web Audio API + lamejs** — dekode dan enkoding audio MP3
- **@ffmpeg/ffmpeg** — transcoding video via WebAssembly
- **pdf-lib** — pembuatan dokumen PDF
- **mammoth + DOMPurify** — parsing DOCX ke HTML tersanitasi
- **JSZip** — pemaketan hasil batch ke arsip ZIP
- **Custom Binary ICO Builder** — favicon.ico multi-resolusi native

### Security (Media Downloader)
- **Safe Socket DNS Pinning** — mitigasi SSRF dan DNS rebinding
- **HMAC-SHA256 Proxy Token** — token fail-closed berumur pendek
- **Domain Allowlist** — pembatasan host media upstream
- **@coflyn/scrapr** — resolusi metadata URL publik

---

## Instalasi

### Prasyarat
- Node.js 18 atau lebih baru
- pnpm (direkomendasikan)

```bash
# Clone repositori
git clone https://github.com/Tokitakun/TokiConvert.git
cd TokiConvert/tokiconvert

# Instal dependensi
pnpm install
```

### Environment Variables

Buat file `.env.local` di direktori `tokiconvert/`:

```env
# Wajib untuk fitur Media Downloader (HMAC proxy signature)
PROXY_SECRET=ganti_dengan_string_acak_yang_kuat
```

Lihat `.env.example` untuk referensi lengkap. **Jangan pernah meng-commit nilai rahasia ke repositori.**

Jika `PROXY_SECRET` tidak diset, fitur Media Downloader tidak akan berfungsi. Fitur lain (gambar, audio, video, dokumen, favicon) tidak memerlukan environment variable.

---

## Perintah Development

```bash
# Development server (http://localhost:3000)
pnpm dev

# Type-check tanpa emitting output
npx tsc --noEmit

# Lint kode
pnpm run lint

# Build produksi
pnpm run build

# Jalankan build produksi
pnpm start
```

---

## Struktur Direktori

```
tokiconvert/
├── app/
│   ├── components/           # Komponen UI bersama (Navbar, Footer, Workspace, dll.)
│   ├── lib/                  # Library utilitas (validation, faviconGenerator, rateLimiter, dll.)
│   ├── about/page.tsx        # Halaman About
│   ├── audio/page.tsx        # Audio Converter
│   ├── document/page.tsx     # Document Converter
│   ├── favicon/page.tsx      # Favicon Pack Generator
│   ├── media/page.tsx        # Media Downloader
│   ├── video/page.tsx        # Video Converter
│   ├── page.tsx              # Landing Page (Image Converter)
│   ├── layout.tsx            # Root layout
│   └── globals.css           # Design tokens dan animasi global
├── public/
│   ├── logo/logo.webp        # Logo asli TokiConvert
│   ├── favicon.svg           # Favicon SVG native
│   └── favicon_pack/         # Aset favicon pack (ICO, PNG, webmanifest)
├── scripts/                  # Skrip utilitas dan verifikasi
├── docs/                     # Dokumentasi tambahan
├── .env.example              # Contoh environment variable
├── DESIGN_SYSTEM.md          # Panduan visual dan design system
├── CONTRIBUTING.md           # Panduan kontribusi
└── package.json
```

---

## Arsitektur Keamanan (Media Downloader)

Media Downloader menggunakan server proxy dengan perlindungan berlapis:

1. **DNS Socket Pinning** — memverifikasi IP destination setelah resolusi DNS untuk mencegah SSRF dan TOCTOU.
2. **HMAC-SHA256 Signature** — setiap permintaan proxy membutuhkan token yang ditandatangani dengan `PROXY_SECRET`, terikat ke alamat upstream, dan berumur pendek.
3. **Domain Allowlist** — hanya host yang telah diverifikasi yang diizinkan sebagai upstream media.
4. **Batasan Protektif** — maksimum 50 MB per unduhan, timeout 15 detik.

---

## Roadmap

Fitur berikut **direncanakan** untuk pengembangan masa depan:

- **Multi-Threading WebAssembly** — penerapan `COOP/COEP` header dan `SharedArrayBuffer` untuk akselerasi FFmpeg 2–3x.
- **Ekstensi Format Dokumen** — konversi Markdown ke PDF/HTML, merge dan split halaman PDF.
- **Vector Tracing & Kuantisasi** — vektorisasi raster ke SVG dan reduksi palet warna.
- **Progressive Web App (PWA)** — Service Worker untuk operasi offline penuh.

---

## Kontribusi

Lihat [CONTRIBUTING.md](CONTRIBUTING.md) untuk panduan kontribusi.

---

## Lisensi

[MIT](LICENSE) © Nafis (Tokitakun)
