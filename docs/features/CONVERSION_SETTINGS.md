# CONVERSION_SETTINGS.md

## Deskripsi
Pengaturan konversi yang dapat diubah pengguna sebelum proses dimulai.

## Pilihan
- **Format output**: dropdown pilih `PNG`, `JPEG`, `WebP`.
- **Kualitas JPEG**: slider 0‑100 (value → `value/100` untuk `canvas.toBlob`).
- **Dimensi output**: input lebar × tinggi (opsional, kosong = ukuran asli).
- **Latar belakang JPEG**: warna hex (default `#ffffff`) untuk mengisi area transparan.

## UI
- Komponen simple form di samping atau di atas tombol "Convert".
- Semua kontrol memiliki label yang jelas.
- Nilai default: format `PNG`, kualitas `92` (0.92), dimensi kosong, latar putih.

## Validasi
- Dimensi harus angka positif, tidak lebih dari 5000 px.
- Kualitas 0‑100.
- Latar belakang warna hex valid (`#RRGGBB`).

## Pengaruh pada Engine
- Pada konversi JPEG, set `canvas.fillStyle` dengan latar belakang sebelum menggambar image.
- Pada resize, set `canvas.width/height` sebelum drawing.

Tidak ada efek pada format lain (PNG/WebP) selain resize.
