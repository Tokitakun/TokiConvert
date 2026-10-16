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
} from "lucide-react";

export default function AboutPage() {
  const techStack = [
    {
      category: "Framework & Core",
      items: [
        { name: "Next.js 16 (App Router)", role: "Framework utama aplikasi web dan routing" },
        { name: "React 19", role: "Pustaka antarmuka komponen berbasis UI deklaratif" },
        { name: "TypeScript", role: "Pengetikan statis untuk stabilitas dan keandalan kode" },
      ],
    },
    {
      category: "Styling & UI",
      items: [
        { name: "Tailwind CSS v4", role: "Engine styling utilitas bertema Vintage Retro Classic" },
        { name: "Lucide React", role: "Ikon antarmuka fungsional dan proporsional" },
      ],
    },
    {
      category: "Conversion & Archive",
      items: [
        { name: "HTML5 Canvas API", role: "Mesin pemrosesan dan konversi gambar sisi klien" },
        { name: "JSZip", role: "Pemaketan berkas hasil konversi ke arsip ZIP" },
      ],
    },
    {
      category: "Development Tooling",
      items: [
        { name: "pnpm", role: "Manajer paket cepat dan efisien" },
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
              Product Overview &amp; Notes
            </p>
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#332F29] tracking-tight">
              About TokiConvert
            </h1>
          </div>
          <p className="text-sm sm:text-base text-[#62584C] leading-relaxed max-w-3xl">
            TokiConvert adalah utilitas web terbuka yang dirancang untuk konversi format berkas secara sederhana, cepat, dan menjaga privasi data pengguna tanpa proses yang rumit.
          </p>
        </header>

        {/* B. About the Project */}
        <section className="pt-8 sm:pt-10 space-y-3">
          <div className="flex items-center gap-2.5">
            <ShieldCheck size={22} className="text-[#344638] shrink-0" aria-hidden="true" />
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#332F29]">
              About the Project
            </h2>
          </div>
          <p className="text-sm sm:text-base text-[#62584C] leading-relaxed">
            Fokus utama TokiConvert saat ini adalah konversi gambar langsung di sisi peramban (<span className="italic font-medium text-[#332F29]">client-side processing</span>). Gambar yang Anda pilih diproses secara lokal menggunakan kemampuan HTML5 Canvas API, sehingga berkas asli Anda tidak pernah dikirim, diunggah, atau disimpan di server mana pun.
          </p>
          <p className="text-sm sm:text-base text-[#62584C] leading-relaxed">
            Format gambar yang saat ini terverifikasi didukung meliputi <span className="font-medium text-[#332F29]">PNG, JPEG/JPG, WEBP, BMP, SVG,</span> dan <span className="font-medium text-[#332F29]">GIF</span>, lengkap dengan opsi pengaturan dimensi serta slider kualitas kompresi.
          </p>
        </section>

        {/* C. The Maker */}
        <section className="pt-8 sm:pt-10 space-y-3">
          <div className="flex items-center gap-2.5">
            <User size={22} className="text-[#344638] shrink-0" aria-hidden="true" />
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#332F29]">The Maker</h2>
          </div>
          <p className="text-sm sm:text-base text-[#62584C] leading-relaxed">
            TokiConvert dikembangkan oleh <span className="font-semibold text-[#332F29]">Nafis</span> sebagai proyek utilitas independen. Tujuan pengembangannya adalah menghadirkan alat konversi gambar yang bersih, ringan, bebas iklan, dan tidak memerlukan instalasi aplikasi tambahan maupun registrasi akun.
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

        {/* D. Built With */}
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

        {/* E. Project Inspirations */}
        <section className="pt-8 sm:pt-10 space-y-3">
          <div className="flex items-center gap-2.5">
            <HeartHandshake size={22} className="text-[#344638] shrink-0" aria-hidden="true" />
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#332F29]">Project Inspirations</h2>
          </div>
          <p className="text-sm text-[#62584C]">
            Pengembangan TokiConvert merujuk dan terinspirasi dari dua proyek sumber terbuka berikut:
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
                Referensi aplikasi pengunduh media yang menjadi inspirasi tata letak produk yang bersih dan fokus utilitas.
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
                Toolkit Node.js untuk ekstraksi media dan resolusi tautan, dijadikan referensi konseptual arsitektur penanganan URL di masa depan. <span className="font-medium text-[#332F29]">scrapr bukan dependency maupun mesin konversi gambar TokiConvert.</span>
              </p>
            </div>
          </div>
          <p className="text-xs text-[#62584C] italic pt-1">
            Catatan: Proyek-proyek di atas merupakan referensi inspirasi independen dan bukan pembuat, pendukung, atau mitra resmi TokiConvert.
          </p>
        </section>

        {/* F. Current Scope & Future Plans */}
        <section className="pt-8 sm:pt-10 space-y-3">
          <div className="flex items-center gap-2.5">
            <Compass size={22} className="text-[#344638] shrink-0" aria-hidden="true" />
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#332F29]">
              Current Scope &amp; Future Plans
            </h2>
          </div>
          <p className="text-sm text-[#62584C]">
            Batasan fitur yang sudah aktif saat ini serta gambaran rencana ke depan:
          </p>
          <div className="space-y-2.5 pt-1">
            <div className="flex items-start sm:items-center gap-3 text-sm border border-[#D8CCB9] bg-[#F4EBDD]/40 rounded p-3">
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-[#344638] text-[#FFFCF6] shrink-0">
                Tersedia
              </span>
              <div>
                <span className="font-semibold text-[#332F29]">Image Converter</span>
                <span className="text-[#62584C] text-xs sm:text-sm block sm:inline sm:ml-2">
                  — Konversi format gambar lokal (PNG, JPG, WEBP, BMP, SVG, GIF), dimensi kustom, kompresi kualitas, dan ekspor arsip ZIP.
                </span>
              </div>
            </div>

            <div className="flex items-start sm:items-center gap-3 text-sm border border-[#D8CCB9] bg-[#FFFCF6] rounded p-3">
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-[#F4EBDD] text-[#62584C] border border-[#D8CCB9] shrink-0">
                Rencana
              </span>
              <div>
                <span className="font-medium text-[#332F29]">Audio &amp; Document Converter</span>
                <span className="text-[#62584C] text-xs sm:text-sm block sm:inline sm:ml-2">
                  — Rencana eksplorasi konversi audio dan dokumen berbasis WebAssembly.
                </span>
              </div>
            </div>

            <div className="flex items-start sm:items-center gap-3 text-sm border border-[#D8CCB9] bg-[#FFFCF6] rounded p-3">
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-[#F4EBDD] text-[#62584C] border border-[#D8CCB9] shrink-0">
                Rencana
              </span>
              <div>
                <span className="font-medium text-[#332F29]">Video &amp; Media URL Tools</span>
                <span className="text-[#62584C] text-xs sm:text-sm block sm:inline sm:ml-2">
                  — Rencana pengolahan video ringan dan ekstraksi media via tautan URL.
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* G. Footer */}
        <footer className="pt-8 sm:pt-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs text-[#62584C]">
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
              aria-label="Lisensi MIT TokiConvert (buka di tab baru)"
            >
              <FileText size={13} aria-hidden="true" />
              <span>Lisensi (Draf MIT)</span>
            </a>

            <a
              href="https://github.com/Tokitakun/TokiConvert/blob/main/CONTRIBUTING.md"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 hover:text-[#332F29] hover:underline focus:outline-none focus-visible:ring-1 focus-visible:ring-[#A34F38] rounded"
              aria-label="Panduan Kontribusi TokiConvert (buka di tab baru)"
            >
              <FileText size={13} aria-hidden="true" />
              <span>Panduan Kontribusi</span>
            </a>
          </div>

          <p className="text-[#62584C]/80">
            TokiConvert · Open-source utility
          </p>
        </footer>
      </div>
    </div>
  );
}

