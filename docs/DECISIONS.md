# DECISIONS.md

## Keputusan Produk yang Dikunci

- **Nama**: Toki Convert
- **Tagline**: Convert files. Keep it simple.
- **Framework**: Next.js (App Router)
- **Bahasa**: TypeScript, UI bahasa Inggris
- **Tema**: Light & Dark, accent `#0F766E`
- **Deploy**: Vercel
- **MVP Fokus**: Image Converter, pemrosesan lokal di browser
- **Batas File**: 10 gambar per batch, 15 MB per gambar
- **Format Output**: PNG, JPEG/JPG, WebP (setelah verifikasi)
- **Tidak ada akun, DB, cloud storage**
- **Tidak ada audio/video/URL tools pada MVP**

## Keputusan Belum Diputuskan
- Tahun & pemilik hak cipta untuk lisensi MIT (TODO).
- Penambahan library khusus kompresi gambar (misal `browser-image-compression`).
- Penggunaan library ZIP (`jszip`) vs native.

Catatan: dokumen lain harus konsisten dengan keputusan ini; bila tidak, ubah atau buat issue.
