# IMAGE_CONVERTER.md

## Deskripsi
Fitur utama MVP: mengonversi gambar (PNG, JPEG/JPG, WebP) secara lokal di browser.

## Alur Pengguna
1. Pilih gambar via drag‑and‑drop atau tombol "Select files".
2. Setelah file valid, tampilkan preview dan info ukuran.
3. Pilih format output, kualitas JPEG (0‑1), dan dimensi (opsional).
4. Tekan "Convert".
5. UI menampilkan status per file (converting, success, error).
6. Setelah selesai, tampilkan preview hasil dan tombol "Download" per file.
7. Opsional: tombol "Download ZIP" untuk semua hasil sukses.

## Input
- Tipe: `image/*` (PNG, JPEG, WebP, SVG, dll.)
- Batas: ≤ 10 gambar, tiap ≤ 15 MB

## Output
- File dengan ekstensi sesuai pilihan.
- Nama: `{originalName}_{format}`.
- Ukuran file sesuai pengaturan dimensi & kualitas.

## Validasi
- Jumlah file ≤ 10.
- Ukuran tiap file ≤ 15 MB.
- MIME type didukung browser.
- Jika tidak, tampilkan error "Format tidak didukung".

## Edge Cases
- Transparansi → JPEG: latar putih.
- GIF animasi → konversi ke PNG (frame pertama).
- Canvas terlalu besar → error "Ukuran gambar terlalu besar untuk diproses".

## Acceptance Criteria
- Semua kasus di atas berfungsi dan ter‑test.
- Tidak ada upload ke server.
- UI responsif, tema konsisten.
- Error pada satu file tidak menghentikan file lain.
- ZIP berisi hanya file berhasil.

## Catatan Implementasi
- Gunakan Canvas API (`canvas.toBlob`).
- Revoke object URL setelah selesai.
- Untuk ZIP gunakan `JSZip` (evaluasi ukuran bundle) atau native `Blob` array.

Dokumen ini menjadi referensi untuk pengembangan dan testing fitur Image Converter.
