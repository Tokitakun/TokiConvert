# PROJECT_SCOPE.md

## 1. Tujuan Proyek

Menyediakan konversi file sederhana berbasis browser dengan fokus awal pada gambar.

## 2. Fase Pengembangan

| Fase | Status | Cakupan |
|------|--------|---------|
| 0 – Foundation | In progress | Setup Next.js, dokumentasi dasar, struktur kode, keputusan desain.
| 1 – Image Converter MVP | Planned | Input file (drag‑and‑drop, picker), validasi, preview, konversi PNG/JPEG/WebP, download per file & ZIP, UI tema light/dark, batas 10 gambar per batch, 15 MB per gambar.
| 2 – Image Format Expansion | Planned | AVIF, GIF, format tambahan setelah verifikasi.
| 3 – Audio Converter | Future | MP3, WAV, FLAC, AAC, OGG.
| 4 – Video Converter | Future | MP4, WebM, MOV, resolusi, bitrate.
| 5 – Media URL Tools | Future | Input URL, CORS handling, batas legal.

## 3. Batas File & Privasi

- Maks 10 gambar per batch.
- Maks 15 MB per gambar.
- Semua pemrosesan di browser, tidak ada upload ke server.
- Kegagalan satu file tidak memengaruhi file lain.

## 4. Acceptance Criteria (per fase)

### Phase 0
- Project dapat dijalankan lokal (`pnpm dev`).
- Dokumentasi konsisten, tidak ada fitur palsu.

### Phase 1
- Pilih & hapus file sebelum konversi.
- File tak memenuhi batas ditolak dengan pesan jelas.
- Konversi menghasilkan file dengan format aktual.
- Pengaturan dimensi & kualitas memengaruhi output.
- Preview sesuai output.
- Download per file & ZIP berisi hanya hasil sukses.
- Light & dark mode berfungsi, UI responsif.
- Tidak ada upload gambar ke server.
- Error tidak menghilangkan seluruh state.

## 5. Hal yang Tidak Termasuk (Non‑Goals)
- Akun pengguna, database, cloud storage.
- Audio, video, URL tools sampai roadmap.
- Animasi GIF penuh, konversi transparansi JPEG (gunakan latar putih).

## 6. Keputusan yang Belum Diputuskan
- Tahun dan pemilik hak cipta untuk lisensi MIT (TODO).
- Penambahan library khusus konversi (misalnya `browser-image-compression`) – akan dievaluasi saat fase 2.
