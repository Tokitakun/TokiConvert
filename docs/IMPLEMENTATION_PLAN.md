# IMPLEMENTATION_PLAN.md

## Urutan Implementasi

1. **Audit & Persiapan Dokumentasi** – pastikan semua dokumen ada (AGENTS.md, DESIGN_SYSTEM.md, dsb.).
2. **Fondasi UI** – buat layout satu kolom terpusat, tema light/dark, gunakan accent teal.
3. **Input & Validasi** – komponen **DragDropArea** (sudah dibuat), batasi 10 file, 15 MB, tipe gambar.
4. **Engine Konversi** – fungsi konversi berbasis Canvas API, dukung PNG, JPEG, WebP.
5. **Preview & Hasil** – tampilkan preview gambar sumber & hasil, informasi ukuran.
6. **Download & ZIP** – tombol download per file, kumpulkan hasil sukses menjadi ZIP.
7. **QA & Testing** – uji batas ukuran, format, tema, responsif, aksesibilitas.
8. **Persiapan Rilis** – build produksi, cek lisensi, dokumentasi, checklist rilis.

### Acceptance Criteria per Langkah
- **Audit**: semua dokumen terisi, tautan internal berfungsi.
- **UI**: layout satu kolom, maksimal lebar 640 px, responsif pada mobile.
- **Input**: drag‑and‑drop + file picker, penolakan file >10 atau >15 MB, pesan jelas.
- **Engine**: konversi menghasilkan file dengan format yang dipilih, kualitas dimensi berpengaruh.
- **Preview**: preview sebelum & sesudah konversi akurat.
- **Download**: file dapat diunduh individual; ZIP hanya berisi file berhasil.
- **QA**: lint, type‑check, unit test lulus, aksesibilitas terpenuhi.
- **Rilis**: `pnpm build` sukses, semua tes lulus, dokumen lengkap.

Setiap langkah selesai harus di‑commit (tidak otomatis) dan diverifikasi sebelum melanjutkan.
