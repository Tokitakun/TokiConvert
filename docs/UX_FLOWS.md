# UX_FLOWS.md

## Alur Pengguna

1. **Buka aplikasi** – tampilan home dengan tema light/dark.
2. **Pilih file** – drag‑and‑drop area atau tombol "Select files".
   - File ditampilkan dalam daftar dengan nama & ukuran.
   - File melebihi batas (jumlah atau ukuran) ditolak langsung dengan pesan.
3. **Atur konversi** – pilih format output, kualitas JPEG, dimensi (opsional).
4. **Konversi** – klik tombol "Convert".
   - UI menampilkan status per file: *converting*, *success*, *failed*.
   - Preview gambar hasil muncul di sebelah tiap entri.
5. **Unduh** – tombol "Download" per file atau "Download ZIP" untuk semua hasil sukses.
6. **Reset** – pengguna dapat menghapus file dari daftar atau men‑reset seluruh sesi.

### Status UI
- **Empty**: belum ada file, tampilkan instruksi.
- **Ready**: file valid terdaftar, tombol konversi aktif.
- **Converting**: spinner atau progress bar per file.
- **Success**: badge hijau, preview hasil, tombol download.
- **Partial Failure**: badge merah pada file gagal, tetap dapat download file sukses lainnya.
- **Error**: pesan ringkas, opsi "Retry" atau "Remove".

Semua interaksi dapat diakses via keyboard (tab order, enter/space untuk aktivasi). ARIA live region mengumumkan perubahan status.
