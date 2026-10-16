# TESTING.md

## Matriks Pengujian

| Fitur | Kasus | Input | Expected Output |
|-------|-------|-------|-----------------|
| Drag‑and‑drop | Pilih file valid | 5 gambar <15 MB | File ditambahkan ke list, preview muncul |
| Drag‑and‑drop | Melebihi batas jumlah | 12 gambar | Pesan error "Maksimum 10 gambar" |
| Drag‑and‑drop | Ukuran >15 MB | 1 gambar 20 MB | Pesan error "Ukuran maksimal 15 MB" |
| Validasi tipe | File non‑gambar (pdf) | 1 PDF | Error "Format tidak didukung" |
| Konversi | PNG → JPEG | PNG 800×600 | JPEG file, latar putih bila ada transparansi |
| Konversi | JPEG kualitas | JPEG kualitas 0.5 | File lebih kecil, kualitas menurun |
| Dimensi | Resize ke 400×300 | PNG 1200×800 | Output 400×300, rasio terjaga |
| Preview hasil | Setelah konversi | file berhasil | Thumbnail preview akurat |
| Download per file | Klik tombol download | file berhasil | Blob di‑download dengan nama yang tepat |
| Download ZIP | Semua file berhasil | 3 gambar | ZIP berisi 3 file, nama sesuai output |
| Partial failure | 2 berhasil, 1 gagal | 3 gambar (satu corrupt) | 2 file di‑ZIP, satu badge error |
| Tema | Light & Dark | toggle tema | UI berubah warna sesuai accent dan background |
| Responsif | Mobile viewport 375 px | – | Layout satu kolom, tidak overflow |
| Aksesibilitas | Keyboard navigation | Tab through UI | Fokus masuk ke dropzone, tombol, list item secara logis |
| Error handling | `canvas.toBlob` null | gambar besar | Badge error, tidak menghentikan file lain |

## Cara Menjalankan Test
- `pnpm test` (akan menjalankan Jest/Vitest).
- Mock Canvas API untuk konversi.
- Mock `URL.createObjectURL` untuk download.
- Pastikan coverage ≥ 80 % pada `app/lib/`.

## Tidak Dijanjikan
- Tidak ada tes untuk audio/video/URL tools (roadmap masa depan).
- Tidak ada performa benchmark tingkat tinggi.

Dokumen ini menjadi acuan untuk menulis unit & integration test.
