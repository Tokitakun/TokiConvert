# FILE_RESULTS.md

## Deskripsi
Menampilkan hasil konversi per file, termasuk preview, ukuran, dan tombol download.

## Konten
- Thumbnail gambar hasil (`<img src="objectURL" ...>`).
- Nama file hasil (`{originalName}_{format}`).
- Ukuran file hasil (KB/MB).
- Badge status: **Sukses** (hijau) atau **Error** (merah).
- Tombol **Download** yang memanggil helper `downloadFile(blob, name)`.

## Interaksi
- Klik thumbnail membuka preview penuh (optional modal).
- Tombol **Download** mengunduh file secara langsung.
- Badge berubah warna sesuai status.

## Aksesibilitas
- `aria-label="Download {fileName}"` pada tombol.
- Fokus keyboard pada setiap elemen list.

## Edge Cases
- Jika konversi gagal, tidak ada preview; hanya badge error dan tombol "Retry".
- File besar > 5 MB tetap dapat di‑download, tapi beri peringatan.

Tidak ada upload atau server interaction.
