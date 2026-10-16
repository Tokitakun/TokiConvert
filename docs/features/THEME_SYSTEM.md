# THEME_SYSTEM.md

## Deskripsi
Implementasi dukungan light dan dark theme dengan toggle.

## Mekanisme
- Tailwind `dark:` variant di‑configure dalam `tailwind.config.js` (sudah ada).
- State tema dikelola global via React Context (`ThemeContext`).
- Toggle button mengubah kelas `dark` pada `<html>` element.
- Accent teal `#0F766E` digunakan pada button, border, dan highlight.

## Persistensi
- Simpan pilihan tema di `localStorage` (`theme=light|dark`).
- Pada load, baca `localStorage` dan set kelas `dark` bila diperlukan.

## Aksesibilitas
- Tombol toggle memiliki `aria-pressed` dan label yang berubah (`"Switch to dark mode"` / `"Switch to light mode"`).
- Fokus keyboard tersedia.

## Edge Cases
- Browser tanpa `localStorage` fallback ke preferensi sistem (`prefers-color-scheme`).
- Jika pengguna mengubah tema via system, aplikasi tetap menghormati pilihan manual.

Tidak ada perubahan UI selain warna dan background.
