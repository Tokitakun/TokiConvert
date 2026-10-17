import Link from "next/link";
import {
  ArrowLeft,
  ExternalLink,
  ShieldCheck,
  User,
  Layers,
  HeartHandshake,
  Compass,
  FileText,
  GitBranch,
  Lock,
  Server,
  Cpu,
} from "lucide-react";

export default function AboutPage() {
  const techStack = [
    {
      category: "Framework & Core",
      items: [
        { name: "Next.js 16 (App Router)", role: "Framework utama aplikasi web dan routing dinamis" },
        { name: "React 19", role: "Pustaka antarmuka deklaratif berbasis komponen" },
        { name: "TypeScript", role: "Pengetikan statis untuk keandalan dan stabilitas kode" },
      ],
    },
    {
      category: "Styling & UI",
      items: [
        { name: "Tailwind CSS v4", role: "Mesin styling utilitas bertema Vintage Retro Classic" },
        { name: "Lucide React", role: "Ikon antarmuka fungsional, proporsional, dan aksesibel" },
      ],
    },
    {
      category: "Client-Side Processing",
      items: [
        { name: "HTML5 Canvas API", role: "Mesin konversi dan kompresi format gambar di peramban" },
        { name: "Web Audio API + lamejs", role: "Dekode audio dan enkoding MP3 murni tanpa WASM berat" },
        { name: "pdf-lib", role: "Pembuatan dan manipulasi dokumen PDF dari teks atau gambar" },
        { name: "mammoth + DOMPurify", role: "Parser dokumen Word (.docx) ke HTML tersanitasi" },
        { name: "JSZip", role: "Pemaketan berkas hasil konversi batch ke dalam arsip ZIP" },
      ],
    },
    {
      category: "Server-Side & Security",
      items: [
        { name: "@coflyn/scrapr", role: "Resolusi metadata dan format dari URL media publik" },
        { name: "Safe Socket DNS Pinning", role: "Mitigasi TOCTOU / DNS rebinding dan pencegahan SSRF" },
        { name: "HMAC-SHA256 Token & Allowlist", role: "Pencegahan Open Proxy dengan fail-closed secret" },
      ],
    },
    {
      category: "Development Tooling",
      items: [
        { name: "pnpm", role: "Manajer paket cepat dan hemat ruang disk" },
        { name: "ESLint 9", role: "Pemeriksaan standar kualitas dan konsistensi kode" },
      ],
    },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Container Editorial Vintage */}
      <div className="bg-[#FFFCF6] border border-[#D8CCB9] rounded-lg p-6 sm:p-10 divide-y divide-[#D8CCB9] space-y-8 sm:space-y-10 shadow-xs">
        {/* A. Page Header */}
        <header className="space-y-3">
          {/* Breadcrumb & Navigation */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-1">
            <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-xs font-medium text-[#62584C]">
              <Link
                href="/"
                className="hover:text-[#332F29] hover:underline focus:outline-none focus-visible:ring-1 focus-visible:ring-[#A34F38] rounded"
              >
                Converter
              </Link>
              <span className="text-[#D8CCB9]">/</span>
              <span className="text-[#332F29]" aria-current="page">About</span>
            </nav>

            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-[#A34F38] hover:text-[#8B3F2A] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#A34F38] rounded px-1"
            >
              <ArrowLeft size={15} aria-hidden="true" />
              <span>Back to Converter</span>
            </Link>
          </div>

          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wider font-semibold text-[#A34F38]">
              Product Overview &amp; Architecture Notes
            </p>
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#332F29] tracking-tight">
              About TokiConvert
            </h1>
          </div>
          <p className="text-sm sm:text-base text-[#62584C] leading-relaxed max-w-3xl">
            TokiConvert adalah utilitas web terbuka yang dirancang untuk konversi format berkas secara sederhana, cepat, dan mengutamakan privasi data pengguna melalui pemrosesan lokal di sisi klien.
          </p>
        </header>

        {/* B. About the Project & Philosophy */}
        <section className="pt-8 sm:pt-10 space-y-3">
          <div className="flex items-center gap-2.5">
            <ShieldCheck size={22} className="text-[#344638] shrink-0" aria-hidden="true" />
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#332F29]">
              About the Project &amp; Philosophy
            </h2>
          </div>
          <p className="text-sm sm:text-base text-[#62584C] leading-relaxed">
            Filosofi utama TokiConvert adalah <span className="font-semibold text-[#332F29]">privacy-by-design</span>. Sebagian besar alat konversi online konvensional mewajibkan pengguna mengunggah dokumen pribadi ke server cloud mereka. TokiConvert mengubah paradigma ini dengan memproses konversi berkas langsung di peramban pengguna (<span className="italic font-medium text-[#332F29]">client-side processing</span>).
          </p>
          <p className="text-sm sm:text-base text-[#62584C] leading-relaxed">
            Aplikasi ini tidak menggunakan basis data, tidak memerlukan pendaftaran akun, bebas pelacak invasif, dan tidak menyimpan salinan berkas lokal yang Anda konversi.
          </p>
        </section>

        {/* C. Privacy & Architecture Model */}
        <section className="pt-8 sm:pt-10 space-y-4">
          <div className="flex items-center gap-2.5">
            <Lock size={22} className="text-[#344638] shrink-0" aria-hidden="true" />
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#332F29]">
              Privacy &amp; Architecture Model
            </h2>
          </div>
          <p className="text-sm text-[#62584C]">
            Untuk transparansi teknis, berikut adalah pembagian pemrosesan aktual dalam TokiConvert:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {/* Box Client-Side */}
            <div className="border border-[#D8CCB9] bg-[#F4EBDD]/40 rounded-lg p-5 space-y-2.5">
              <div className="flex items-center gap-2 text-[#344638]">
                <Cpu size={18} aria-hidden="true" />
                <h3 className="text-sm font-serif font-bold text-[#332F29]">
                  1. Pemrosesan di Peramban (Client-Side)
                </h3>
              </div>
              <ul className="text-xs sm:text-sm text-[#62584C] space-y-1.5 list-disc list-inside">
                <li><strong className="text-[#332F29]">Image Converter:</strong> Konversi PNG, JPEG, WEBP, BMP, SVG, GIF, dan kompresi kualitas via Canvas API.</li>
                <li><strong className="text-[#332F29]">Audio Converter:</strong> Decode berkas audio dan encode ke MP3 murni via Web Audio API + lamejs.</li>
                <li><strong className="text-[#332F29]">Document Converter:</strong> Pembuatan PDF via pdf-lib dan pratinjau DOCX tersanitasi via mammoth + DOMPurify.</li>
                <li><strong className="text-[#332F29]">Jaminan Privasi:</strong> Berkas tidak pernah diunggah atau meninggalkan perangkat Anda.</li>
              </ul>
            </div>

            {/* Box Server-Side */}
            <div className="border border-[#D8CCB9] bg-[#F4EBDD]/40 rounded-lg p-5 space-y-2.5">
              <div className="flex items-center gap-2 text-[#A34F38]">
                <Server size={18} aria-hidden="true" />
                <h3 className="text-sm font-serif font-bold text-[#332F29]">
                  2. Layanan Media di Server (Server-Assisted)
                </h3>
              </div>
              <ul className="text-xs sm:text-sm text-[#62584C] space-y-1.5 list-disc list-inside">
                <li><strong className="text-[#332F29]">Media Downloader:</strong> Server hanya memproses URL media publik yang dimasukkan pengguna, bukan file lokal.</li>
                <li><strong className="text-[#332F29]">Open Proxy Prevention:</strong> Token tanda tangan HMAC-SHA256 berumur pendek mencegah penyalahgunaan server sebagai open proxy.</li>
                <li><strong className="text-[#332F29]">SSRF Socket Pinning:</strong> Perlindungan tingkat soket TCP untuk memblokir IP privat, loopback, dan cloud metadata.</li>
                <li><strong className="text-[#332F29]">Batasan Protektif:</strong> Ukuran unduhan dibatasi maksimal 50 MB dengan batas waktu 15 detik.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* D. The Maker */}
        <section className="pt-8 sm:pt-10 space-y-3">
          <div className="flex items-center gap-2.5">
            <User size={22} className="text-[#344638] shrink-0" aria-hidden="true" />
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#332F29]">The Maker</h2>
          </div>
          <p className="text-sm sm:text-base text-[#62584C] leading-relaxed">
            TokiConvert dikembangkan oleh <span className="font-semibold text-[#332F29]">Nafis</span> sebagai proyek utilitas sumber terbuka. Tujuan pengembangannya adalah menghadirkan alat konversi berkas yang rapi, cepat, berfokus pada privasi, dan bebas dari iklan yang mengganggu.
          </p>
          <div className="pt-1">
            <a
              href="https://github.com/Tokitakun"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-[#A34F38] hover:text-[#8B3F2A] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#A34F38] rounded"
              aria-label="Profil GitHub Nafis (Tokitakun) (buka di tab baru)"
            >
              <span>GitHub: Tokitakun</span>
              <ExternalLink size={14} aria-hidden="true" />
            </a>
          </div>
        </section>

        {/* E. Built With */}
        <section className="pt-8 sm:pt-10 space-y-4">
          <div className="flex items-center gap-2.5">
            <Layers size={22} className="text-[#344638] shrink-0" aria-hidden="true" />
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#332F29]">Built With</h2>
          </div>
          <p className="text-sm text-[#62584C]">
            Teknologi dan pustaka terverifikasi yang digunakan dalam basis kode aktif TokiConvert:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {techStack.map((group, idx) => (
              <div
                key={idx}
                className="border border-[#D8CCB9] bg-[#F4EBDD]/40 rounded p-4 space-y-2.5"
              >
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#A34F38]">
                  {group.category}
                </h3>
                <ul className="space-y-2">
                  {group.items.map((item, itemIdx) => (
                    <li key={itemIdx} className="text-xs sm:text-sm">
                      <span className="font-semibold text-[#332F29]">{item.name}</span>
                      <span className="text-[#62584C] block text-xs">{item.role}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* F. Project Inspirations */}
        <section className="pt-8 sm:pt-10 space-y-3">
          <div className="flex items-center gap-2.5">
            <HeartHandshake size={22} className="text-[#344638] shrink-0" aria-hidden="true" />
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#332F29]">Project Inspirations</h2>
          </div>
          <p className="text-sm text-[#62584C]">
            Pengembangan fitur TokiConvert merujuk dan terinspirasi dari proyek sumber terbuka berikut:
          </p>
          <div className="space-y-3 pt-1">
            <div className="border border-[#D8CCB9] rounded p-4 bg-[#F4EBDD]/25 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-serif font-bold text-[#332F29]">Mori</span>
                <a
                  href="https://github.com/coflyn/Mori"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#A34F38] hover:underline inline-flex items-center gap-1 focus:outline-none focus-visible:ring-1 focus-visible:ring-[#A34F38]"
                  aria-label="Repositori GitHub Mori (buka di tab baru)"
                >
                  <span>github.com/coflyn/Mori</span>
                  <ExternalLink size={12} aria-hidden="true" />
                </a>
              </div>
              <p className="text-xs sm:text-sm text-[#62584C] leading-relaxed">
                Referensi aplikasi pengunduh media yang menjadi inspirasi tata letak produk yang bersih, minimalis, dan berfokus pada utilitas.
              </p>
            </div>

            <div className="border border-[#D8CCB9] rounded p-4 bg-[#F4EBDD]/25 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-serif font-bold text-[#332F29]">scrapr</span>
                <a
                  href="https://github.com/coflyn/scrapr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#A34F38] hover:underline inline-flex items-center gap-1 focus:outline-none focus-visible:ring-1 focus-visible:ring-[#A34F38]"
                  aria-label="Repositori GitHub scrapr (buka di tab baru)"
                >
                  <span>github.com/coflyn/scrapr</span>
                  <ExternalLink size={12} aria-hidden="true" />
                </a>
              </div>
              <p className="text-xs sm:text-sm text-[#62584C] leading-relaxed">
                Toolkit Node.js untuk ekstraksi metadata media dari berbagai platform publik, dipadukan dengan kebijakan domain allowlist dan pengamanan soket jaringan di TokiConvert.
              </p>
            </div>
          </div>
          <p className="text-xs text-[#62584C] italic pt-1">
            Catatan: Proyek-proyek di atas merupakan referensi inspirasi independen dan bukan pembuat, pendukung, atau mitra resmi TokiConvert.
          </p>
        </section>

        {/* G. Current Scope & Limitations */}
        <section className="pt-8 sm:pt-10 space-y-3">
          <div className="flex items-center gap-2.5">
            <Compass size={22} className="text-[#344638] shrink-0" aria-hidden="true" />
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#332F29]">
              Scope, Limitations &amp; Future Notes
            </h2>
          </div>
          <p className="text-sm text-[#62584C]">
            Status fitur yang aktif saat ini serta batasan teknis yang berlaku:
          </p>
          <div className="space-y-2.5 pt-1">
            <div className="flex items-start sm:items-center gap-3 text-sm border border-[#D8CCB9] bg-[#F4EBDD]/40 rounded p-3">
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-[#344638] text-[#FFFCF6] shrink-0">
                Tersedia
              </span>
              <div>
                <span className="font-semibold text-[#332F29]">Image Converter</span>
                <span className="text-[#62584C] text-xs sm:text-sm block sm:inline sm:ml-2">
                  — Batch konversi gambar (PNG, JPG, WEBP, BMP, SVG, GIF), kontrol dimensi, kompresi kualitas, dan unduhan arsip ZIP (maks 10 file @ 15 MB).
                </span>
              </div>
            </div>

            <div className="flex items-start sm:items-center gap-3 text-sm border border-[#D8CCB9] bg-[#F4EBDD]/40 rounded p-3">
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-[#344638] text-[#FFFCF6] shrink-0">
                Tersedia
              </span>
              <div>
                <span className="font-semibold text-[#332F29]">Audio Converter</span>
                <span className="text-[#62584C] text-xs sm:text-sm block sm:inline sm:ml-2">
                  — Konversi audio lokal (WAV, MP3, OGG, M4A) ke MP3 murni menggunakan Web Audio API + lamejs langsung di browser tanpa upload.
                </span>
              </div>
            </div>

            <div className="flex items-start sm:items-center gap-3 text-sm border border-[#D8CCB9] bg-[#F4EBDD]/40 rounded p-3">
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-[#344638] text-[#FFFCF6] shrink-0">
                Tersedia
              </span>
              <div>
                <span className="font-semibold text-[#332F29]">Document Converter</span>
                <span className="text-[#62584C] text-xs sm:text-sm block sm:inline sm:ml-2">
                  — Teks &amp; Gambar ke PDF (via pdf-lib) serta pembacaan DOCX ke HTML tersanitasi (via mammoth + DOMPurify) sepenuhnya di sisi peramban.
                </span>
              </div>
            </div>

            <div className="flex items-start sm:items-center gap-3 text-sm border border-[#D8CCB9] bg-[#F4EBDD]/40 rounded p-3">
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-[#344638] text-[#FFFCF6] shrink-0">
                Tersedia
              </span>
              <div>
                <span className="font-semibold text-[#332F29]">Media Downloader</span>
                <span className="text-[#62584C] text-xs sm:text-sm block sm:inline sm:ml-2">
                  — Ekstraksi metadata dari URL media publik dan pengaliran stream via proxy terverifikasi (batas 50 MB, timeout 15 detik). Kecepatan bergantung pada pembatasan server asal upstream.
                </span>
              </div>
            </div>

            <div className="flex items-start sm:items-center gap-3 text-sm border border-[#D8CCB9] bg-[#F4EBDD]/20 rounded p-3 opacity-70">
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-[#62584C]/20 text-[#62584C] shrink-0">
                Direncanakan
              </span>
              <div>
                <span className="font-semibold text-[#332F29]">Video Converter</span>
                <span className="text-[#62584C] text-xs sm:text-sm block sm:inline sm:ml-2">
                  — Konversi video lokal via FFmpeg WebAssembly. Belum diaktifkan karena kebutuhan header isolasi cross-origin (COOP/COEP) pada lingkungan deployment saat ini.
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* H. Quick Links */}
        <div className="pt-8 sm:pt-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs text-[#62584C]">
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/"
              className="font-medium text-[#A34F38] hover:text-[#8B3F2A] hover:underline focus:outline-none focus-visible:ring-1 focus-visible:ring-[#A34F38] rounded"
            >
              ← Kembali ke Converter
            </Link>

            <a
              href="https://github.com/Tokitakun/TokiConvert"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 hover:text-[#332F29] hover:underline focus:outline-none focus-visible:ring-1 focus-visible:ring-[#A34F38] rounded"
              aria-label="GitHub Repository TokiConvert (buka di tab baru)"
            >
              <GitBranch size={13} aria-hidden="true" />
              <span>GitHub Repository</span>
            </a>

            <a
              href="https://github.com/Tokitakun/TokiConvert/blob/main/LICENSE"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 hover:text-[#332F29] hover:underline focus:outline-none focus-visible:ring-1 focus-visible:ring-[#A34F38] rounded"
              aria-label="Lisensi TokiConvert di GitHub (buka di tab baru)"
            >
              <FileText size={13} aria-hidden="true" />
              <span>Lisensi (MIT)</span>
            </a>

            <a
              href="https://github.com/Tokitakun/TokiConvert/blob/main/CONTRIBUTING.md"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 hover:text-[#332F29] hover:underline focus:outline-none focus-visible:ring-1 focus-visible:ring-[#A34F38] rounded"
              aria-label="Panduan Kontribusi TokiConvert di GitHub (buka di tab baru)"
            >
              <FileText size={13} aria-hidden="true" />
              <span>Panduan Kontribusi</span>
            </a>
          </div>

          <p className="text-[#62584C]/80">
            TokiConvert · Open-source utility
          </p>
        </div>
      </div>
    </div>
  );
}
