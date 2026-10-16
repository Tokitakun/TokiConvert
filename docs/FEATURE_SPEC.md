# FEATURE_SPEC.md

## Template Specifikasi Fitur

- **Nama Fitur**: (contoh `Image Converter`)
- **Tujuan**: (apa yang ingin dicapai)
- **Input**: tipe file, batas ukuran, jumlah maksimum.
- **Alur Pengguna**: langkah‑langkah UI dari pemilihan hingga download.
- **Output**: format file, nama, ukuran, status.
- **Validasi**: aturan ukuran, tipe, jumlah.
- **State**: state React yang dikelola (files, results, error).
- **Edge Cases**:
  - File melebihi batas → tolak dengan pesan.
  - Format tidak didukung → beri peringatan.
  - Konversi gagal → tandai error, tidak menghalangi file lain.
- **Aksesibilitas**: ARIA label, focus order.
- **Keamanan/Privasi**: proses di browser, tidak ada upload.
- **Acceptance Criteria**:
  - Semua poin di atas terpenuhi dan ter‑test.
  - UI responsif, tema berfungsi.
  - Tidak ada error runtime.

Gunakan templat ini untuk setiap fitur baru.
