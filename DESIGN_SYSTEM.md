# DESIGN_SYSTEM.md

## Palet Warna Warm Utility
- **Background (Ivory)**: `#F7F4EE`
- **Surface (Warm White)**: `#FFFEFB`
- **Secondary Surface (Soft Sand)**: `#E9E0D3`
- **Primary Text (Charcoal Ink)**: `#302E29`
- **Secondary Text**: `#625C53`
- **Primary Action (Terracotta)**: `#A9573F`
- **Primary Action Hover**: `#8F4531`
- **Supporting Accent (Forest Ink)**: `#34483D`
- **Border**: `#D8D0C4`

## Tipografi
- Font utama: **Inter** (fallback system font), sudah disertakan di project.
- Ukuran teks: 16 px body, 20‑24 px heading, 14‑16 px secondary.
- Line‑height: 1.5, font‑weight medium untuk heading, regular untuk body.

## Spasi & Radius
- Grid spacing unit: `0.5rem` (8 px) multiples.
- Padding container: `1.5rem` (24 px) horizontal, `1rem` (16 px) vertical.
- Border radius: `0.5rem` (8 px) untuk kartu, `0.25rem` (4 px) untuk tombol.

## Layout & Komposisi
- **Root page**: `min-h-screen bg-[#F7F4EE] flex flex-col items-center`.
- **Container**: max‑width `5xl` (`1120px`), centered `mx-auto`, padding `p-6`.
- **Navbar**: tinggi `64‑72px`, flex `items-center justify-between`, bottom border `border-b border-[#D8D0C4]`.
- **Hero**: heading 36‑40 px, description 16‑18 px, margin bottom `mb-8`.
- **Workspace**: dua kolom pada `lg:` breakpoint, `gap-8`, background `#FFFEFB`, rounded `rounded-lg`, border `border-[#D8D0C4]`.
  - **Left column**: upload dropzone min‑height `240px`, dashed border `#D8D0C4`, background hover `#E9E0D3/10`, centered icon/text, primary button Terracotta.
  - **File list**: list‑disc, spacing `space-y-1`, text color secondary `#625C53`.
  - **Right column**: output settings form, labels `text-[#302E29] text-sm font-medium`, controls `bg-[#FFFEFB] border rounded px-3 py-2` with border `#D8D0C4`.
  - **Convert button**: full‑width max‑w‑xs, background Terracotta, hover `#8F4531`, height `44‑48px`.
- **Result section**: margin top `mt-6`, background `#FFFEFB`, rounded, border `#D8D0C4`.
  - Grid `grid-cols-1 md:grid-cols-2 gap-4`.
  - Each item: border, padding, rounded, preview image `max-w-full h-auto`, filename & format text `text-[#625C53] text-sm`, download link `text-[#34483D] underline`.
  - ZIP download button full‑width same style as Convert.

## Responsivitas
- Mobile: satu kolom, semua elemen stack vertikal, kontrol tetap berukuran minimum 44 px untuk tap.
- Tablet (`md:`): dua kolom tetap, container max‑width `5xl`.
- Desktop (`lg:`): layout as described.

## Komponen Visual State
- **Empty upload**: placeholder text, subtle icon, border `#D8D0C4`.
- **Loading / converting**: spinner or subtle opacity change on button, disabled state `opacity-50 cursor-not-allowed`.
- **Error**: message `text-red-600`, badge red.
- **Success**: badge green, status text `text-blue-600`.

## Aksesibilitas
- Kontras sesuai WCAG AA for all text/background combos.
- Fokus outline `2px solid #A9573F` on interactive elements.
- ARIA live region `role="status"` for conversion progress.
- Semua label terkait input, tombol memiliki `aria-label` bila diperlukan.
- Keyboard navigation order: navbar → hero → dropzone → file list → settings → Convert → results.

## Anti‑AI Visual Slop
- Hindari gradient, glassmorphism, bayangan besar.
- Tidak ada card berlapis; gunakan satu card untuk workspace dan satu untuk result.
- Tidak ada badge dekoratif kecuali status.
- Tidak ada hero besar dengan ruang kosong berlebih.
- Tidak ada animasi selain spinner/opacity.
- Ikon hanya fungsional, tidak sekadar hias.

## Larangan
- Jangan mengubah warna aksi utama tanpa persetujuan.
- Jangan menambah border radius atau shadow ekstra di luar yang ditetapkan.
- Jangan mengganti tipografi default.
- Jangan menambah komponen yang tidak diperlukan.

Dokumen ini menjadi sumber kebenaran visual untuk semua komponen UI pada TokiConvert.

