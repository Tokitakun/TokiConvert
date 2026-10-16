# ARCHITECTURE.md

## Prinsip Umum

- **Next.js App Router**: gunakan folder `app/` untuk semua halaman & layout.
- **Pemisahan Concerns**:
  - **UI**: komponen React di `app/components/`.
  - **Validasi**: fungsi utilitas di `app/lib/validation.ts` (akan dibuat).
  * **Engine konversi**: fungsi di `app/lib/converter.ts` (akan ditulis).
  - **Hasil & Download**: helper di `app/lib/download.ts`.
- **State Management**: gunakan React `useState` lokal; tidak ada global store.
- **Tidak ada API route**: seluruh proses di browser, tidak ada server‑side endpoint.
- **Tailwind CSS**: semua styling via kelas Tailwind, mengikuti `DESIGN_SYSTEM.md`.
- **Aksesibilitas**: ARIA label pada elemen interaktif, fokus keyboard.

## Folder Struktur (kunci)

```
app/
  components/          # UI reusable
    DragDropArea.tsx   # drag‑and‑drop + file list
  lib/                 # utilities (validation, conversion, download)
    validation.ts
    converter.ts
    download.ts
  layout.tsx           # Root layout, theme provider
  page.tsx             # Home page, mengimpor DragDropArea
```

Tidak ada folder `pages/` atau `api/`. Semua kode berada di dalam `app/`.

## Alur Data

1. **User** pilih file → `DragDropArea` memperbarui state `files`.
2. **Validasi** dijalankan pada setiap penambahan file (type, ukuran, jumlah).
3. **Konversi** dipicu tombol “Convert”; tiap file diproses oleh `converter.ts` yang mengembalikan `Blob`.
4. **Hasil** disimpan dalam state `results` (file, URL preview, status).
5. **Download**: tombol per file meng‑trigger `download.ts`, ZIP menggabungkan semua `Blob` yang berhasil.

## Catatan
- Semua fungsi bersifat **pure** dan dapat diuji unit.
- Tidak ada akses ke file system server, tidak ada database.
- Performa: proses satu file pada satu waktu untuk menghindari beban memori tinggi.

Dokumen ini menjadi acuan arsitektur untuk semua kontribusi selanjutnya.
