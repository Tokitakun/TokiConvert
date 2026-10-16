# README.md

## Toki Convert

Alat konversi file berbasis browser. **MVP** fokus pada *Image Converter*; tidak ada akun, database, atau layanan server.

### Status MVP
- **Fitur utama**: pilih hingga **10 gambar** per batch, masing‑masing maksimal **15 MB**.
- **Format output**: PNG, JPEG/JPG, WebP (setelah verifikasi dukungan browser).
- **Pemrosesan** terjadi sepenuhnya di sisi klien menggunakan Canvas API; tidak ada upload gambar ke server.
- **UI**: satu kolom terpusat, tema *light* & *dark*, aksen teal `#0F766E`.

### Teknologi terverifikasi
- **Framework**: Next.js (App Router) – sudah terpasang.
- **Bahasa**: TypeScript.
- **Styling**: Tailwind CSS.
- **Font**: Geist via `next/font`.
- **Deploy target**: Vercel.

### Menjalankan proyek
```bash
pnpm install   # pasang dependencies
pnpm dev       # jalankan server development (http://localhost:3000)
pnpm build     # buat build produksi
```

### Dokumentasi lengkap
- [AGENTS.md](AGENTS.md) – aturan agen coding.
- [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) – token warna, tipografi, komponen UI.
- [CONTRIBUTING.md](CONTRIBUTING.md) – cara berkontribusi.
- `docs/` folder – spesifikasi, arsitektur, rencana, dan detail fitur:
  - [PROJECT_SCOPE.md](docs/PROJECT_SCOPE.md)
  - [IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md)
  - [ARCHITECTURE.md](docs/ARCHITECTURE.md)
  - [FEATURE_SPEC.md](docs/FEATURE_SPEC.md)
  - [CONVERSION_ENGINE.md](docs/CONVERSION_ENGINE.md)
  - [UX_FLOWS.md](docs/UX_FLOWS.md)
  - [ERROR_HANDLING.md](docs/ERROR_HANDLING.md)
  - [SECURITY_PRIVACY.md](docs/SECURITY_PRIVACY.md)
  - [DEPENDENCIES.md](docs/DEPENDENCIES.md)
  - [CODING_STANDARDS.md](docs/CODING_STANDARDS.md)
  - [DECISIONS.md](docs/DECISIONS.md)
  - [TESTING.md](docs/TESTING.md)
  - [CHANGELOG.md](docs/CHANGELOG.md)
  - [RELEASE_CHECKLIST.md](docs/RELEASE_CHECKLIST.md)
  - *Fitur detail* di `docs/features/`:
    - [IMAGE_CONVERTER.md](docs/features/IMAGE_CONVERTER.md)
    - [FILE_INPUT.md](docs/features/FILE_INPUT.md)
    - [CONVERSION_SETTINGS.md](docs/features/CONVERSION_SETTINGS.md)
    - [FILE_RESULTS.md](docs/features/FILE_RESULTS.md)
    - [DOWNLOADS.md](docs/features/DOWNLOADS.md)
    - [THEME_SYSTEM.md](docs/features/THEME_SYSTEM.md)
    - [RESPONSIVE_UI.md](docs/features/RESPONSIVE_UI.md)

### Kontribusi
Ikuti panduan di [CONTRIBUTING.md](CONTRIBUTING.md) untuk fork, development, dan pull request.

### Lisensi
Lisensi MIT – isi tahun dan pemilik hak cipta masih **TODO** pada file [LICENSE](LICENSE).
(https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
