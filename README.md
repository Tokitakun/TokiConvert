# TokiConvert

Utilitas web terbuka untuk konversi format berkas lokal dan pengunduhan media dengan antarmuka bertema **Vintage Retro Classic**. Dirancang untuk mengutamakan privasi pengguna, kecepatan proses, dan kesederhanaan tanpa memerlukan instalasi aplikasi tambahan atau pembuatan akun.

---

## Daftar Isi
- [Gambaran Umum & Filosofi](#gambaran-umum--filosofi)
- [Fitur Utama](#fitur-utama)
- [Arsitektur & Privasi](#arsitektur--privasi)
- [Keamanan Server-Side](#keamanan-server-side)
- [Teknologi Utama](#teknologi-utama)
- [Persyaratan Sistem](#persyaratan-sistem)
- [Panduan Instalasi & Penggunaan](#panduan-instalasi--penggunaan)
- [Konfigurasi Environment](#konfigurasi-environment)
- [Peta Jalan & Perencanaan Pengembangan (Roadmap)](#peta-jalan--perencanaan-pengembangan-roadmap)
- [Batasan & Keterbatasan Layanan](#batasan--keterbatasan-layanan)
- [Lisensi & Kontribusi](#lisensi--kontribusi)

---

## Gambaran Umum & Filosofi

TokiConvert dibangun dengan pendekatan **privacy-first**:
1. **Pemrosesan Berkas Lokal di Sisi Klien:** Berkas gambar, audio, video, dan dokumen diproses langsung di peramban pengguna (*client-side execution*). Berkas tidak pernah diunggah, disimpan, atau dikirim ke server backend mana pun.
2. **Desain Vintage Retro Classic:** Antarmuka visual yang terkurasi menggunakan palet warna khas editorial klasik (*paper cream*, *surface cream*, *burnt terracotta*, *forest green*, *antique gold*, dan *dark text*) yang dipadukan dengan *Floating Navbar* dan indikator progres balok retro 90-an.
3. **Pengunduhan Media yang Aman:** Fitur media downloader dilengkapi perlindungan berlapis untuk mencegah penyalahgunaan open proxy dan serangan Server-Side Request Forgery (SSRF).

---

## Fitur Utama

### 1. Image Converter (Client-Side)
- Konversi batch hingga **10 gambar** secara bersamaan dengan ukuran maksimal **15 MB** per berkas.
- Mendukung format input & output: **PNG, JPEG/JPG, WebP, BMP, SVG, dan GIF**.
- Pengaturan dimensi kustom (proporsional atau bebas) dan kendali kualitas kompresi.
- Ekspor hasil konversi tunggal atau unduh seluruh berkas sekaligus dalam arsip **ZIP**.

### 2. Audio Converter (Client-Side)
- Konversi berkas audio lokal (**WAV, MP3, OGG, M4A**) ke format **MP3 murni** atau **WAV PCM Lossless**.
- Pemrosesan dekode melalui **Web Audio API** dan enkoding MPEG Layer III menggunakan **lamejs** langsung di peramban tanpa upload.

### 3. Video Converter (Client-Side WebAssembly)
- Konversi format video lokal (**MP4, WebM, MKV, AVI, MOV**) langsung di peramban menggunakan **FFmpeg WASM** (`@ffmpeg/ffmpeg`).
- Pemrosesan video privat di memori peramban tanpa mengunggah berkas video ke server backend mana pun.
- Dilengkapi indikator progres proses *frame-by-frame* dan penanganan pembersihan memori (*cleanup memory*).

### 4. Document Converter (Client-Side)
- Konversi teks (**TXT**) dan kumpulan gambar menjadi dokumen **PDF** terstruktur menggunakan **pdf-lib**.
- Parser dokumen Word (**DOCX**) menjadi tampilan HTML yang tersanitasi menggunakan **mammoth** dan **DOMPurify**.

### 5. Media Downloader & Resolver (Server-Assisted)
- Resolusi metadata dan penyediaan opsi format audio/video dari URL media publik di platform yang didukung (YouTube, Spotify, TikTok, Instagram, Twitter/X, Reddit, Bandcamp, SoundCloud, Google Drive, MediaFire, dll.).
- Mendukung direct media URL dari repositori publik terverifikasi (*archive.org*, *wikimedia.org*, *raw.githubusercontent.com*).
- Pengaliran stream unduhan via proxy aman dengan batas ukuran, timeout, dan verifikasi tanda tangan kriptografi HMAC-SHA256.

### 6. Navigasi & Antarmuka Modern Retro
- **Floating Navbar:** Tata letak mengambang dengan sudut membulat (*rounded-xl*), *backdrop blur*, dan jarak bernapas proporsional dari tepi layar.
- **Mobile Hamburger Menu Ergonomis:** Navigasi mobile dengan tombol sentuh nyaman (44px), transisi ikon mulus, penutupan otomatis via tombol Escape, pemilihan tautan, maupun deteksi klik di luar menu (*outside click*).
- **RetroProgressBar:** Indikator progres retro 90-an dengan balok piksel dinamis untuk umpan balik kompresi dan streaming byte secara real-time.

---

## Arsitektur & Privasi

```
┌─────────────────────────────────────────────────────────────┐
│                 BROWSER PENGGUNA (CLIENT-SIDE)              │
│                                                             │
│  [Gambar / Audio / Video / Dokumen Lokal]                   │
│        │                                                    │
│        ├── Canvas API (Konversi Gambar)                     │
│        ├── Web Audio API + lamejs (Ekstraksi Audio MP3)     │
│        ├── FFmpeg WebAssembly (Konversi Video Lokal)        │
│        ├── pdf-lib & mammoth (Dokumen & PDF)                │
│        └── JSZip (Pemaketan Arsip)                          │
│        │                                                    │
│        ▼                                                    │
│  [Hasil Langsung Diunduh Pengguna Tanpa Sentuh Server]     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│             SERVER / RUNTIME API (SERVER-ASSISTED)          │
│                                                             │
│  [Input URL Media Publik]                                   │
│        │                                                    │
│        ▼                                                    │
│  /api/media/resolve (Validasi Host Allowlist & Sign Token)  │
│        │                                                    │
│        ▼                                                    │
│  /api/audio/fetch-media (Verifikasi Token HMAC)             │
│        │                                                    │
│        ├── Safe DNS Lookup & Socket Pinning (Anti-SSRF)     │
│        ├── Validasi Host Allowlist (Bukan Open Proxy)       │
│        ├── Validasi TLS SNI & Sertifikat Host Asli          │
│        └── Streaming Chunked (Maksimal 50 MB, Timeout 15s)  │
└─────────────────────────────────────────────────────────────┘
```

---

## Keamanan Server-Side

Endpoint proxy TokiConvert dirancang dengan prinsip **defense-in-depth**:
- **Pencegahan Open Proxy (HMAC-SHA256 Token):** Setiap tautan unduhan wajib memiliki token tanda tangan server berumur pendek (TTL 2 jam) yang mengikat `hostname:url:expiresAt`. Server menolak tautan tanpa token atau dengan token yang dimanipulasi.
- **Fail-Closed Secret di Production:** Variabel `PROXY_SECRET` wajib dikonfigurasi di environment produksi dengan panjang minimal 32 karakter. Jika variabel tidak ada atau tidak valid, sistem menolak operasi penandatanganan secara aman (*fail-closed*).
- **Domain Allowlist Ketat:** Hanya domain platform yang didukung dan repositori media publik resmi yang diizinkan untuk diproses. URL arbitrer (seperti `example.com` atau domain tak terdaftar) ditolak.
- **SSRF Guard & Socket DNS Pinning:** Menggunakan callback `lookup` kustom pada level soket Node.js (`safeDnsLookup`). Seluruh alamat IP tujuan diverifikasi sebelum soket TCP dibuka untuk memblokir rentang privat (RFC 1918, RFC 6598), loopback (`127.0.0.1`), IPv6 link-local, dan cloud metadata (`169.254.169.254`).
- **Verifikasi TLS Asli:** Koneksi HTTPS tetap memverifikasi TLS SNI (`servername`) dan sertifikat X.509 server asal terhadap Root CA resmi (`rejectUnauthorized: true`).
- **Batas Aliran Data:** Maksimal stream unduhan dibatasi **50 MB** (diperiksa pada header `Content-Length` dan akumulasi byte chunk via Node.js `Transform` stream). Permintaan dibatasi waktu maksimal **15 detik**.
- **Rate Limiting:** Pembatasan frekuensi permintaan per IP untuk mencegah *denial of service* dan *flooding*.

---

## Teknologi Utama

- **Framework:** [Next.js](https://nextjs.org/) 16 (App Router)
- **UI Library:** [React](https://react.dev/) 19 & [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) v4
- **Komponen Ikon:** [Lucide React](https://lucide.dev/)
- **Pemrosesan Klien:** HTML5 Canvas API, Web Audio API, `@breezystack/lamejs`, `@ffmpeg/ffmpeg`, `@ffmpeg/core`, `pdf-lib`, `mammoth`, `dompurify`, `jszip`
- **Resolver Media:** `@coflyn/scrapr`
- **Package Manager:** [pnpm](https://pnpm.io/)

---

## Persyaratan Sistem

- **Node.js:** Versi 18.18+ atau 20+
- **pnpm:** Versi 9+ atau 11+
- Peramban web modern yang mendukung Canvas API, Web Audio API, dan WebAssembly (Chrome, Firefox, Safari, Edge versi terbaru).

---

## Panduan Instalasi & Penggunaan

### 1. Kloning Repositori
```bash
git clone https://github.com/Tokitakun/TokiConvert.git
cd TokiConvert
```

### 2. Pasang Dependensi
```bash
pnpm install
```

### 3. Konfigurasi Environment
Salin templat konfigurasi environment:
```bash
cp .env.example .env.local
```
Buka file `.env.local` dan tentukan nilai `PROXY_SECRET` (lihat bagian [Konfigurasi Environment](#konfigurasi-environment)).

### 4. Menjalankan Server Development
```bash
pnpm dev
```
Buka [http://localhost:3000](http://localhost:3000) pada peramban web Anda.

### 5. Pengujian & Pembuatan Build Produksi
```bash
# Pemeriksaan tipe TypeScript
npx tsc --noEmit

# Pemeriksaan linter
pnpm run lint

# Kompilasi build produksi
pnpm build

# Menjalankan build produksi
pnpm start
```

---

## Konfigurasi Environment

File `.env.example` menyediakan templat konfigurasi yang dibutuhkan aplikasi:

```env
# PROXY_SECRET: Kunci rahasia HMAC-SHA256 untuk penandatanganan token proxy media.
# Wajib diisi pada lingkungan production (minimal 32 karakter).
PROXY_SECRET=
```

### Cara Menghasilkan `PROXY_SECRET` Aman:
Jalankan perintah berikut di terminal:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Panduan Keamanan Environment:
- **Jangan Pernah Menggunakan Prefix `NEXT_PUBLIC_`:** Variabel `PROXY_SECRET` hanya boleh diakses di sisi server (Node.js runtime). Menambahkan prefix `NEXT_PUBLIC_` akan membocorkan secret ke bundel JavaScript peramban.
- **Jangan Commit Berkas `.env.local`:** Berkas `.env`, `.env.local`, dan sejenisnya sudah diabaikan oleh `.gitignore`. Jangan pernah mengunggah kredensial atau secret asli ke repositori Git.
- **Pengaturan di Vercel / Cloud Hosting:** Pada dashboard proyek hosting (misal: Vercel Project Settings $\rightarrow$ Environment Variables), tambahkan `PROXY_SECRET` sebagai variabel rahasia (*Sensitive / Encrypted Environment Variable*).

---

## Peta Jalan & Perencanaan Pengembangan (Roadmap)

Berikut adalah rencana peningkatan dan fitur baru yang sedang dan akan dikembangkan:

### 1. Peningkatan Video Converter (WebAssembly Multi-Threading)
- Mengaktifkan multi-threading WebAssembly berbasis `SharedArrayBuffer` dengan melengkapi konfigurasi header isolasi `Cross-Origin-Opener-Policy: same-origin` dan `Cross-Origin-Embedder-Policy: require-corp` pada lingkungan deployment.
- Menambahkan preset resolusi cepat (1080p, 720p, 480p), pengaturan frame rate (fps), dan opsi pemotongan durasi video (*trimming*).
- Eksplorasi [WebCodecs API](https://developer.mozilla.org/en-US/docs/Web/API/WebCodecs_API) untuk akselerasi perangkat keras (*hardware acceleration*) langsung di peramban yang mendukung.

### 2. Ekstensi Document Converter
- Menambahkan konversi dokumen teks berbasis format **Markdown (.md)** menjadi PDF dan dokumen HTML yang bersih.
- Menambahkan fitur penggabungan beberapa berkas PDF (*PDF merge*) dan ekstraksi teks polos dari berkas PDF langsung di peramban.

### 3. Image Processing Tingkat Lanjut
- Optimasi vektorisasi gambar raster menjadi vektor SVG murni (*vector tracing*).
- Pemangkasan gambar interaktif (*crop & rotate*) sebelum proses konversi batch.

### 4. Dukungan Progressive Web App (PWA) & Mode Offline
- Implementasi Service Worker untuk caching aset statis dan core engine (Canvas, lamejs, pdf-lib).
- Kemampuan menjalankan aplikasi secara offline penuh di perangkat desktop maupun seluler tanpa memerlukan koneksi internet aktif untuk berkas lokal.

---

## Batasan & Keterbatasan Layanan

1. **Ukuran Berkas Proxy Media:** Unduhan stream melalui proxy dibatasi maksimal **50 MB**. Berkas media yang melebihi batas ini akan ditolak (HTTP 413).
2. **Batas Waktu Permintaan (Timeout):** Permintaan unduhan media dibatasi maksimal **15 detik**. Jika server asal mengalami latensi tinggi, unduhan akan dibatalkan (HTTP 504).
3. **Ketergantungan Server Sumber Pihak Ketiga:** Kecepatan dan keberhasilan pengunduhan media publik bergantung langsung pada ketersediaan, stabilitas, dan pembatasan bandwidth (*throttling*) dari CDN platform asal.
4. **Scraper Pihak Ketiga:** Struktur API atau halaman platform publik dapat berubah sewaktu-waktu di luar kendali TokiConvert.
5. **Performa Video Converter di Klien:** Konversi video berbasis WebAssembly bergantung pada kapasitas memori RAM dan kecepatan CPU perangkat pengguna. Berkas video besar dapat membutuhkan waktu pemrosesan beberapa menit tergantung kemampuan spesifikasi perangkat.

---

## Lisensi & Kontribusi

- **Lisensi:** Proyek ini didistribusikan di bawah lisensi open-source **MIT**. Dokumen lisensi tersedia pada file [`LICENSE`](LICENSE).
- **Kontribusi:** Kontribusi kode, perbaikan bug, dan saran fitur sangat terbuka. Silakan baca panduan lengkap pada [`CONTRIBUTING.md`](CONTRIBUTING.md).
