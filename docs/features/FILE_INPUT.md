# FILE_INPUT.md

## Deskripsi
Komponen UI untuk memilih file gambar, mendukung drag‑and‑drop dan picker.

## Fitur
- Drag‑and‑drop area berborder `2px dashed #0F766E`.
- Input tersembunyi `<input type="file" multiple accept="image/*">`.
- Menampilkan daftar file terpilih dengan nama & ukuran.
- Validasi jumlah (≤ 10) dan ukuran (≤ 15 MB).
- Pesan error inline bila batas terlampaui.

## API Komponen
```tsx
interface FileInfo { file: File; size: string; }
function DragDropArea(): JSX.Element;
```
- Mengembalikan state `FileInfo[]`.
- Callback `onChange` opsional untuk sinkronisasi ke parent.

## Aksesibilitas
- ARIA label `"Area seret & lepas file gambar"`.
- Fokus dapat dipindahkan ke area dengan `tabindex="0"`.
- Live region mengumumkan penambahan atau penolakan file.

## Edge Cases
- File duplikat → tambahkan lagi (opsional dismiss).
- Browser tidak mendukung drag‑and‑drop → fallback ke picker.

Tidak ada proses konversi atau upload di sini; hanya input.
