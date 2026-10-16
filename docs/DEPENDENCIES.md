# DEPENDENCIES.md

## Evaluasi Dependency

- **Kriteria ukuran bundle**: < 200 KB gzipped untuk setiap library tambahan.
- **Kompatibilitas**: harus bekerja di semua browser modern (Chrome, Firefox, Safari, Edge).
- **Lisensi**: MIT, Apache‑2.0, BSD‑3 atau lisensi yang kompatibel dengan MIT.
- **Pemeliharaan**: aktif di GitHub, setidaknya satu rilis dalam 6 bulan terakhir.
- **Alternatif native**: gunakan API browser native sebelum menambah library.

## Daftar Dependency Saat Ini
| Package | Versi | Alasan | Status |
|---------|-------|--------|--------|
| next | 16.4.1 | Framework utama | Core
| react | 19.3.0 | UI library | Core
| react‑dom | 19.3.0 | DOM rendering | Core
| tailwindcss | ^4 | Styling | Core
| eslint | ^9 | Linting | Dev
| typescript | ^5 | Type checking | Dev

## Dependency Tambahan yang Dipertimbangkan
- `browser-image-compression` – kompresi JPEG/WEBP, evaluasi ukuran bundle.
- `jszip` – pembuatan ZIP download, cek apakah sudah termasuk di browser native (FileSystem API) atau perlu polyfill.
- `@zag-js` – komponen UI aksesibilitas, hanya bila diperlukan.

## Prosedur Penambahan
1. Identifikasi kebutuhan yang tidak dapat dipenuhi native.
2. Ukur ukuran bundle (`pnpm bundle-size <pkg>`).
3. Verifikasi lisensi kompatibilitas MIT.
4. Tambahkan ke `package.json` dan perbarui dokumentasi.
5. Jalankan lint & test.

Jika tidak ada kebutuhan jelas, jangan tambahkan.
