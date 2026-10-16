# RESPONSIVE_UI.md

## Deskripsi
Desain UI satu kolom terpusat, responsif pada semua ukuran layar.

## Layout
- Container maksimal lebar `640px`, margin auto horizontal.
- Padding `p-4` pada mobile, `p-8` pada desktop.
- Semua elemen flex/column, menggunakan Tailwind utilities (`flex`, `flex-col`, `items-center`).

## Breakpoints
- **sm** (`≥640px`): maintain satu kolom, gunakan `max-w-md` untuk komponen.
- **md** (`≥768px`): tambah ruang side padding, tetap satu kolom.
- **lg** (`≥1024px`): lebar tetap, fokus pada pusat.

## Mobile
- Touch target minimal `48px` tinggi.
- Font size menyesuaikan (`text-base` pada mobile, `text-lg` pada desktop).
- Scroll vertical otomatis bila konten tinggi.

## Aksesibilitas
- Fokus visual tetap terlihat (`outline` teal).
- Tidak ada horizontal overflow.

## Edge Cases
- Browser dengan viewport sangat kecil (<320px): beri scroll horizontal pada kontainer utama.
- Rotasi layar pada mobile: UI menyesuaikan otomatis karena flex layout.

Tidak ada perubahan logika aplikasi; hanya styling.
