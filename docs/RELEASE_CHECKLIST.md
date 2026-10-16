# RELEASE_CHECKLIST.md

## Checklist Pra‑Rilis

- [ ] `pnpm run build` berhasil tanpa error.
- [ ] Semua lint (`pnpm lint`) bersih.
- [ ] Semua unit test (`pnpm test`) lulus, coverage ≥ 80 %.
- [ ] Dokumentasi lengkap, tautan internal berfungsi.
- [ ] `README.md` mencantumkan perintah start (`pnpm dev`) dan build (`pnpm build`).
- [ ] `LICENSE` terisi (tahun, pemilik).
- [ ] `CHANGELOG.md` mencatat semua perubahan.
- [ ] Tema light/dark berfungsi, accent teal konsisten.
- [ ] UI responsif pada mobile (≤ 480 px).
- [ ] Aksesibilitas: ARIA label, focus order, live region untuk status.
- [ ] Tidak ada dependency baru tanpa persetujuan.
- [ ] Semua file fitur (drag‑and‑drop, konversi, download) berfungsi sesuai acceptance criteria Phase 1.
- [ ] Tidak ada upload gambar ke server (periksa network panel).
- [ ] Review keamanan: tidak ada skrip eksternal, semua resource dibersihkan.

Jika semua centang, aplikasi siap deploy ke Vercel.
