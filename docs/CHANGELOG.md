# CHANGELOG.md

## [0.4.0] - URL to MP3, Authorized Media Processing & Retro Loading Experience (2026-10-17)

### Audio Converter via Link (URL to MP3)
- **Mode Dual Sumber**: Tab navigasi terpadu antara `Upload File` (lokal) dan `Convert from URL` (remote link & authorized streams).
- **Deteksi Direct Media vs Platform**:
  - Direct media (ekstensi `.mp3`, `.wav`, `.ogg`, `.m4a`, `.aac`, `.flac`, `.mp4`, `.webm` atau MIME `audio/*` / `video/*`) dialirkan langsung melalui endpoint proxy berpagar SSRF `/api/audio/fetch-media`.
  - Platform media (Bandcamp, SoundCloud, TikTok, Reddit, Google Drive, MediaFire, Pixeldrain, Catbox) dideteksi dan diproses melalui resolver terotorisasi `/api/media/resolve`.
- **SSRF Guard & Keamanan Jaringan**:
  - Resolusi DNS via OS (`dns.lookup` / `getaddrinfo`) untuk memvalidasi IP sebelum koneksi.
  - Pemblokiran menyeluruh terhadap IP privat IPv4 (10/8, 172.16/12, 192.168/16), loopback (127/8), link-local (169.254/16), cloud metadata endpoint (AWS, Google Cloud, Azure), dan IPv6 privat (`::1`, `fc00::/7`, `fe80::/10`).
  - Pre-flight HEAD check dengan timeout 15 detik, penolakan otomatis halaman web (HTML/XHTML), dan batas maksimal streaming 50 MB dengan pemutus aliran (*chunk byte counter*).
- **Integritas Hak Cipta & Watermark**:
  - Penegasan etis: Sistem tidak menyediakan alat untuk menghapus watermark atau membobol proteksi hak cipta platform. Pemrosesan ditujukan untuk konten legal, publik, atau milik pengguna sendiri.
- **Konversi & Pratinjau**:
  - Media hasil unduhan URL langsung dimasukkan ke antrean konversi client-side dan dikonversi ke MP3 128 kbps murni tanpa penyimpanan permanen di server.
  - Dilengkapi pemutar audio HTML5 untuk pratinjau hasil konversi.

### Retro Loading Experience & Shared UI Components
- **`RetroProgressBar`**: Komponen bilah kemajuan bergaya blok persegi 90-an (`[■■■■■■□□□□]`) dengan pilihan tema terracotta, forest green, dan antique gold. Menampilkan persentase presisi hanya jika progress terukur dan animasi bergeser lembut (*pulse marquee*) saat indeterminate.
- **`TerminalStatus`**: Konsol log interaktif retro dengan prefix `>` (contoh: `> VALIDASI TAUTAN MEDIA...`, `> SSRF GUARD: HOST AMAN [OK]`, `> MENGUNDUH STREAM...`, `> ENCODING KE MP3...`) dan kursor blok berkedip.
- **`PixelLoader`**: Ikon jam pasir beresolusi piksel (*pixel-inspired hourglass*) dengan animasi rotasi berundak 4-step yang menghormati pengaturan aksesibilitas `prefers-reduced-motion`.
- **Integrasi Menyeluruh**:
  - **Image Converter**: Bilah blok progres batch dan indikator piksel pada tombol Convert.
  - **Audio Converter**: Bilah blok progres per berkas, log terminal real-time saat fetch URL, dan indikator piksel pada aksi utama.
  - **Document Converter**: Bilah blok progres saat penyusunan PDF / ekstraksi HTML dan indikator piksel pada tombol Convert.

---

## [0.3.0] - Audio & Document Converter Feasibility & MVP (2026-10-17)

### Audio Converter (Browser-Side MVP)
- **Web Audio API + LAME MP3 Engine**:
  - Implementasi konversi 100% sisi klien tanpa upload file ke server eksternal dan tanpa dependensi jaringan saat proses berlangsung.
  - **Input yang didukung**: WAV, MP3, OGG, AAC, M4A, FLAC, WebM Audio, MP4 Audio.
  - **Target output MVP**:
    - **WAV (Lossless PCM)**: Decoding via `AudioContext.decodeAudioData` dan encoding 16-bit PCM RIFF murni dalam milidetik (0 network overhead).
    - **MP3 (Universal Audio)**: Encoding frame PCM ke MP3 via `@breezystack/lamejs` 128 kbps (~150 KB footprint vs ~31 MB FFmpeg WASM core).
  - **Pratinjau & Kontrol**: Audio player HTML5 terintegrasi untuk mendengarkan hasil konversi langsung di browser, indikator durasi audio (`probeAudioMetadata`), progress bar per file, unduhan satuan, dan pembersihan antrean.

### Document Converter (Browser-Side MVP)
- **Multi-Mode Engine**:
  - **TXT to PDF**: Pembuatan dokumen PDF multi-halaman berbasis `pdf-lib` (ukuran A4, 595.28 x 841.89 pt), word wrapping cerdas, penomoran halaman otomatis (`Halaman X dari Y`), serta sanitasi karakter Unicode non-Latin (fallback Latin-1).
  - **Images to PDF**: Penggabungan gambar PNG/JPG/JPEG menjadi satu berkas PDF multi-halaman. Dilengkapi opsi orientasi A4 Portrait/Landscape dengan penskalaan proporsional atau mode Fit Image ke ukuran asli.
  - **DOCX to HTML**: Ekstraksi berkas Word (.docx) semantik berbasis `mammoth` (h1-h6, paragraf, tabel, daftar) yang disanitasi menggunakan `dompurify` untuk mitigasi serangan XSS, lengkap dengan pratinjau live HTML dan tombol unduh berkas `.html`.

### Sistem Navigasi & Integrasi
- Navigasi [Navbar](file:///c:/Users/muham/Documents/toki-convert/tokiconvert/app/components/Navbar.tsx) diperbarui menghubungkan: `Image Converter`, `Audio Converter`, `Document Converter`, `Media Tools`, dan `About`.
- Halaman [About](file:///c:/Users/muham/Documents/toki-convert/tokiconvert/app/about/page.tsx) diperbarui mencakup kapabilitas Web Audio, PDF-lib, Mammoth, dan LAME MP3.

---

## [0.2.0] - Modern Converter Panel, Bilingual UI & Presets (2026-10-16)
- Modernisasi panel kanan Image Converter: tata letak terstruktur, surface bersih, kartu pemilihan format interaktif, dan tombol aksi utama Convert dengan status lengkap.
- Implementasi Conversion Presets: Web Optimized (WebP 80%), High Quality (95% / Lossless), Small File (WebP 55%), dan penyesuaian Custom.
- Bahasa UI alami (campuran Indonesia & Inggris) untuk kenyamanan pengguna dan istilah teknis standar.
- Tambah UI drag‑and‑drop (`DragDropArea.tsx`).

---

## [0.1.0] - Initial Setup (2026-10-16)
- Setup awal proyek Next.js App Router dengan Tailwind CSS.
- Konfigurasi dokumentasi dasar dan arsitektur converter gambar.
