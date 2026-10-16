# DOWNLOADS.md

## Deskripsi
Fitur download hasil konversi, baik per file maupun batch ZIP.

## Per File
- Tombol **Download** memanggil `downloadFile(blob, fileName)`.
- Menggunakan `URL.createObjectURL` dan `a.download` untuk trigger.
- Setelah download, `URL.revokeObjectURL` dipanggil.

## ZIP Download
- Tombol **Download ZIP** mengumpulkan semua `Blob` yang berhasil.
- Dibuat dengan library **JSZip** (evaluasi ukuran bundle) atau native `Blob` array.
- Nama file ZIP: `toki-convert-results-{timestamp}.zip`.
- Setelah pembuatan, trigger `a.href = URL.createObjectURL(zipBlob)`.

## Validasi
- ZIP hanya berisi file dengan status **Sukses**.
- Jika tidak ada file berhasil, tombol ZIP non‑aktif.

## Edge Cases
- Jika pembuatan ZIP gagal, tampilkan error "Tidak dapat membuat ZIP".
- Browser yang tidak mendukung `Blob`/`URL` → fallback ke per‑file download.

Tidak ada komunikasi dengan server.
