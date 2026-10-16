import {
  ShieldCheck,
  User,
  Layers,
  HeartHandshake,
  MapPin,
  ExternalLink,
  GitBranch,
  FileText,
} from "lucide-react";

export default function AboutPage() {
  const techStack = [
    {
      category: "Framework & Core",
      items: ["Next.js 16 (App Router)", "React 19", "TypeScript"],
    },
    {
      category: "Styling & UI",
      items: ["Tailwind CSS v4", "Lucide React (Ikon)", "Palet Warm Utility"],
    },
    {
      category: "Library Konversi & Arsip",
      items: ["HTML5 Canvas API (Client-side)", "JSZip (Pemaketan ZIP)"],
    },
    {
      category: "Tools Pengembangan",
      items: ["ESLint 9", "pnpm (Package Manager)"],
    },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="bg-[#FFFEFB] border border-[#D8D0C4] rounded-lg p-6 sm:p-10 divide-y divide-[#D8D0C4] space-y-8 sm:space-y-10">
        {/* About TokiConvert */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <ShieldCheck size={28} className="text-[#A9573F] shrink-0" aria-hidden="true" />
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#302E29]">
              About TokiConvert
            </h1>
          </div>
          <p className="text-sm sm:text-base text-[#625C53] leading-relaxed">
            TokiConvert adalah aplikasi konversi file berbasis web yang mengutamakan pengalaman sederhana, privasi, dan kemudahan penggunaan.
          </p>
          <p className="text-sm sm:text-base text-[#625C53] leading-relaxed">
            Seluruh pemrosesan konversi gambar berjalan langsung di dalam peramban (browser) menggunakan HTML5 Canvas API. Berkas Anda tidak pernah diunggah, ditransmisikan, atau disimpan di server mana pun, sehingga data tetap privat dan terlindungi sepenuhnya di perangkat Anda.
          </p>
        </section>

        {/* Made by Nafis */}
        <section className="pt-8 sm:pt-10 space-y-4">
          <div className="flex items-center gap-2.5">
            <User size={24} className="text-[#A9573F] shrink-0" aria-hidden="true" />
            <h2 className="text-xl sm:text-2xl font-bold text-[#302E29]">Made by Nafis</h2>
          </div>
          <p className="text-sm sm:text-base text-[#625C53] leading-relaxed">
            Proyek ini dikembangkan oleh Nafis sebagai alat bantu utilitas web yang bersih, ringan, dan bebas iklan. Alasan utama mengembangkan TokiConvert adalah menyediakan solusi konversi format gambar yang praktis dan dapat diandalkan tanpa keharusan memasang perangkat lunak tambahan, tanpa antrean server, dan tanpa perlu mendaftar akun.
          </p>
        </section>

        {/* Technology Stack */}
        <section className="pt-8 sm:pt-10 space-y-4">
          <div className="flex items-center gap-2.5">
            <Layers size={24} className="text-[#A9573F] shrink-0" aria-hidden="true" />
            <h2 className="text-xl sm:text-2xl font-bold text-[#302E29]">Technology Stack</h2>
          </div>
          <p className="text-sm text-[#625C53]">
            Teknologi yang terverifikasi aktif digunakan dalam basis kode TokiConvert:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {techStack.map((group, idx) => (
              <div
                key={idx}
                className="border border-[#D8D0C4] bg-[#F7F4EE]/50 rounded-md p-4 space-y-2"
              >
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#A9573F]">
                  {group.category}
                </h3>
                <ul className="space-y-1.5">
                  {group.items.map((item, itemIdx) => (
                    <li
                      key={itemIdx}
                      className="text-sm font-medium text-[#302E29] flex items-center gap-2"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#34483D] shrink-0" aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Open Source */}
        <section className="pt-8 sm:pt-10 space-y-4">
          <div className="flex items-center gap-2.5">
            <GitBranch size={24} className="text-[#A9573F] shrink-0" aria-hidden="true" />
            <h2 className="text-xl sm:text-2xl font-bold text-[#302E29]">Open Source</h2>
          </div>
          <p className="text-sm sm:text-base text-[#625C53] leading-relaxed">
            TokiConvert dikembangkan secara terbuka. Kode sumber, berkas lisensi, dan panduan kontribusi tersedia langsung di repositori resmi GitHub.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <a
              href="https://github.com/Tokitakun/TokiConvert"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#A9573F] text-[#FFFEFB] hover:bg-[#8F4531] px-4 py-2.5 rounded-md text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#A9573F]"
              aria-label="Kunjungi Repositori GitHub TokiConvert (buka di tab baru)"
            >
              <span>Repositori GitHub</span>
              <ExternalLink size={16} aria-hidden="true" />
            </a>

            <a
              href="https://github.com/Tokitakun/TokiConvert/blob/main/CONTRIBUTING.md"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 border border-[#D8D0C4] bg-[#FFFEFB] text-[#302E29] hover:bg-[#E9E0D3]/40 px-3.5 py-2.5 rounded-md text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#A9573F]"
              aria-label="Lihat Panduan Kontribusi CONTRIBUTING.md (buka di tab baru)"
            >
              <FileText size={16} className="text-[#625C53]" aria-hidden="true" />
              <span>Panduan Kontribusi</span>
            </a>

            <a
              href="https://github.com/Tokitakun/TokiConvert/blob/main/LICENSE"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 border border-[#D8D0C4] bg-[#FFFEFB] text-[#302E29] hover:bg-[#E9E0D3]/40 px-3.5 py-2.5 rounded-md text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#A9573F]"
              aria-label="Lihat Berkas Lisensi LICENSE (buka di tab baru)"
            >
              <FileText size={16} className="text-[#625C53]" aria-hidden="true" />
              <span>Lisensi (MIT)</span>
            </a>
          </div>
        </section>

        {/* Project Inspirations */}
        <section className="pt-8 sm:pt-10 space-y-4">
          <div className="flex items-center gap-2.5">
            <HeartHandshake size={24} className="text-[#A9573F] shrink-0" aria-hidden="true" />
            <h2 className="text-xl sm:text-2xl font-bold text-[#302E29]">Project Inspirations</h2>
          </div>
          <p className="text-sm text-[#625C53]">
            Pengembangan TokiConvert mengambil referensi dan inspirasi konsep dari dua proyek sumber terbuka berikut:
          </p>
          <div className="space-y-3 pt-1">
            <div className="border border-[#D8D0C4] rounded-md p-4 bg-[#F7F4EE]/30 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#302E29]">Mori</span>
                <a
                  href="https://github.com/coflyn/Mori"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#A9573F] hover:underline inline-flex items-center gap-1 focus:outline-none focus-visible:ring-1 focus-visible:ring-[#A9573F]"
                  aria-label="Repositori GitHub Mori (buka di tab baru)"
                >
                  <span>github.com/coflyn/Mori</span>
                  <ExternalLink size={12} aria-hidden="true" />
                </a>
              </div>
              <p className="text-xs sm:text-sm text-[#625C53] leading-relaxed">
                Referensi aplikasi pengunduh media dan inspirasi pengalaman interaksi produknya yang bersih.
              </p>
            </div>

            <div className="border border-[#D8D0C4] rounded-md p-4 bg-[#F7F4EE]/30 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#302E29]">scrapr</span>
                <a
                  href="https://github.com/coflyn/scrapr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#A9573F] hover:underline inline-flex items-center gap-1 focus:outline-none focus-visible:ring-1 focus-visible:ring-[#A9573F]"
                  aria-label="Repositori GitHub scrapr (buka di tab baru)"
                >
                  <span>github.com/coflyn/scrapr</span>
                  <ExternalLink size={12} aria-hidden="true" />
                </a>
              </div>
              <p className="text-xs sm:text-sm text-[#625C53] leading-relaxed">
                Library Node.js untuk ekstraksi media dan resolusi URL sebagai referensi konsep penanganan URL di masa depan. <span className="font-medium text-[#302E29]">scrapr bukan mesin konversi gambar TokiConvert.</span>
              </p>
            </div>
          </div>
          <p className="text-xs text-[#625C53] italic pt-1">
            Catatan: Proyek-proyek di atas merupakan referensi inspirasi independen dan bukan merupakan pembuat, sponsor, atau partner resmi dari TokiConvert.
          </p>
        </section>

        {/* Roadmap */}
        <section className="pt-8 sm:pt-10 space-y-4">
          <div className="flex items-center gap-2.5">
            <MapPin size={24} className="text-[#A9573F] shrink-0" aria-hidden="true" />
            <h2 className="text-xl sm:text-2xl font-bold text-[#302E29]">Rencana Masa Depan (Roadmap)</h2>
          </div>
          <p className="text-sm text-[#625C53]">
            Status fitur dan rencana pengembangan TokiConvert berikutnya (tanpa menjanjikan tanggal rilis tertentu):
          </p>
          <div className="space-y-2.5 pt-1">
            <div className="flex items-start sm:items-center gap-3 text-sm border border-[#D8D0C4]/70 bg-[#F7F4EE]/40 rounded-md p-3">
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-[#E9E0D3] text-[#34483D] shrink-0">
                Aktif
              </span>
              <div>
                <span className="font-semibold text-[#302E29]">Konversi Gambar (Image Converter)</span>
                <span className="text-[#625C53] text-xs sm:text-sm block sm:inline sm:ml-2">
                  — Tersedia saat ini (PNG, JPG, WEBP, BMP, SVG, GIF, penyesuaian dimensi, kualitas, dan unduh ZIP).
                </span>
              </div>
            </div>

            <div className="flex items-start sm:items-center gap-3 text-sm border border-[#D8D0C4]/70 bg-[#FFFEFB] rounded-md p-3">
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-[#F7F4EE] text-[#625C53] border border-[#D8D0C4] shrink-0">
                Rencana
              </span>
              <div>
                <span className="font-medium text-[#302E29]">Konversi Dokumen &amp; Audio</span>
                <span className="text-[#625C53] text-xs sm:text-sm block sm:inline sm:ml-2">
                  — Tahap evaluasi pustaka dan perancangan format.
                </span>
              </div>
            </div>

            <div className="flex items-start sm:items-center gap-3 text-sm border border-[#D8D0C4]/70 bg-[#FFFEFB] rounded-md p-3">
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-[#F7F4EE] text-[#625C53] border border-[#D8D0C4] shrink-0">
                Rencana
              </span>
              <div>
                <span className="font-medium text-[#302E29]">Media URL Tools &amp; Pengolahan Video</span>
                <span className="text-[#625C53] text-xs sm:text-sm block sm:inline sm:ml-2">
                  — Eksplorasi arsitektur ekstraksi media dan penanganan resolusi URL.
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

