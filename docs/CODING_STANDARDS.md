# CODING_STANDARDS.md

## TypeScript
- Gunakan `strict` mode (`tsconfig.json` sudah mengaktifkan).
- Hindari `any` kecuali ada justifikasi di komentar.
- Definisikan tipe untuk file, hasil konversi, dan error.

## React
- Komponen fungsional dengan hooks.
- Prop typing eksplisit, gunakan `FC<Props>` bila perlu.
- No class components.
- Gunakan `useCallback` untuk handler yang dipassing ke child.

## Next.js
- Semua halaman di folder `app/`.
- Tidak menambah folder `pages/` atau `api/`.
- Gunakan `metadata` untuk SEO, jangan edit `next.config.js` tanpa alasan.

## Styling (Tailwind)
- Semua kelas di‑inline; hindari CSS eksternal kecuali di `globals.css`.
- Ikuti token warna & spacing dari `DESIGN_SYSTEM.md`.
- Hindari `!important`.

## Error Handling
- Gunakan `try/catch` pada async ops (canvas, zip).
- Return objek `{status: 'success'|'error', data?, message?}`.

## Dokumentasi Kode
- Header file: deskripsi singkat, author (optional), tanggal.
- Komentar fungsi: input, output, side‑effects.
- Hindari komentar berulang yang menjelaskan apa yang sudah jelas dari kode.

## Testing
- Unit test dengan Jest (atau Vitest) pada `app/lib/`.
- Mock Canvas API bila diperlukan.
- Pastikan coverage ≥ 80 % pada modul konversi.

## Pull Request Checklist
- Lint bersih (`pnpm lint`).
- Semua tes lulus (`pnpm test`).
- Dokumentasi diperbarui (`README.md`, `docs/*`).
- Tidak ada dependency baru tanpa persetujuan.

Ikuti standar ini untuk konsistensi dan kualitas kode.
