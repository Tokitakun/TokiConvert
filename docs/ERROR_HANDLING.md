# ERROR_HANDLING.md

## Kategori Error

- **Validasi Input**: tipe file tidak didukung, ukuran >15 MB, jumlah file >10.
- **Konversi**: `canvas.toBlob` mengembalikan `null`, memori tidak cukup, dimensi terlalu besar.
- **Download**: `URL.createObjectURL` gagal, zip builder error.
- **Runtime**: exception tak terduga di React rendering.

## Pesan Pengguna
- Tampilkan pesan singkat, berbahasa Indonesia, dengan ikon status.
- Contoh: "File terlalu besar (maks 15 MB).", "Format tidak didukung.", "Konversi gagal, coba lagi.", "Download gagal, periksa koneksi."

## Isolasi Kegagalan
- Setiap file memiliki status terpisah; kegagalan satu tidak menghentikan proses file lain.
- UI menandai file gagal dengan badge merah, tetap menampilkan file berhasil.

## Pembersihan Resource
- `URL.revokeObjectURL` dipanggil segera setelah preview tidak lagi dibutuhkan.
- Blob yang tidak terpakai di‑null-kan untuk GC.

## Logging
- Log internal (console) hanya untuk developer, bukan ditampilkan ke user.
- Jangan mengirim data file ke server atau layanan logging eksternal.

## Tidak Dijanjikan
- Tidak ada progres persentase tepat untuk proses konversi yang memakai async Canvas; gunakan indikator "converting".
- Tidak ada retry otomatis; beri tombol "Retry" pada file gagal.

Dokumen ini menjadi acuan penanganan error di seluruh aplikasi.
