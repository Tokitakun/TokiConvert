# CONTRIBUTING.md

## Cara Berkontribusi

1. **Fork repository**
2. **Clone** fork ke mesin lokal
3. **Buat branch** fitur atau perbaikan (`git checkout -b nama-fitur`)
4. **Jalankan** `pnpm install` lalu `pnpm dev` untuk melihat perubahan
5. **Ikuti** panduan **Coding Standards** di `docs/CODING_STANDARDS.md`
6. **Pastikan** semua lint, type‑check, dan tes lulus (`pnpm lint && pnpm test`)\n7. **Buat pull request** ke `main` dengan deskripsi jelas
8. **Tanggapi** review, perbaiki bila diperlukan, lalu **squash‑merge** setelah disetujui

### Kriteria PR
- Kode sesuai **Coding Standards**
- Dokumentasi diperbarui bila perlu
- Tidak menambah dependency tanpa evaluasi (lihat `docs/DEPENDENCIES.md`)
- Tidak mengubah UI selain yang dijelaskan dalam issue
- Semua tes lulus

### Issue Tracker
- Gunakan label `enhancement`, `bug`, atau `documentation`
- Sertakan langkah‑reproduksi untuk bug, atau contoh penggunaan untuk fitur baru

### Review Process
- Minimal satu reviewer utama
- Reviewer memberi persetujuan (`Approve`) sebelum merge
- Perbaikan kecil dapat di‑commit langsung oleh maintainer bila urgent

Terima kasih atas kontribusi Anda!
