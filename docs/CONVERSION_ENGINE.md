# CONVERSION_ENGINE.md

## Aturan Konversi di Browser

- **Canvas API**: gunakan `HTMLCanvasElement` untuk decode‑encode gambar.
- **Dukungan Format**:
  - **Input**: semua format gambar yang dapat dibaca oleh browser (`image/png`, `image/jpeg`, `image/webp`, `image/svg+xml`).
  - **Output**: `image/png`, `image/jpeg`, `image/webp` (hasil `canvas.toBlob` dengan tipe yang diminta).
- **Kualitas JPEG**: parameter kualitas 0‑1 pada `toBlob`; default `0.92`.
- **Dimensi**: ubah lebar/tinggi pada canvas sebelum `toBlob` bila ada pengaturan.
- **Transparansi**:
  - JPEG tidak mendukung transparansi – saat konversi ke JPEG, latar putih digunakan.
  - PNG/WebP mempertahankan transparansi.
- **Batas Browser**:
  - Ukuran canvas dibatasi oleh memori; hindari gambar > 5000 px pada satu sisi.
  - Jika `toBlob` gagal, tangani error dan beri feedback.
- **Error Handling**:
  - `canvas.toBlob` callback `null` → error, beri status `failed`.
  - Validasi MIME sebelum konversi, tolak tipe tak didukung.
- **Performance**:
  - Proses satu file pada satu waktu.
  - Bebaskan objek URL (`URL.revokeObjectURL`) setelah selesai.

## Tidak Dijanjikan
- Tidak ada dukungan untuk animasi GIF; konversi GIF menjadi gambar statis pertama frame.
- Tidak ada konversi AVIF atau format lain tanpa evaluasi tambahan.

Dokumen ini menjadi referensi implementasi engine konversi.
