import Link from "next/link";
import Image from "next/image";
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
  Milestone,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export default function AboutPage() {
  const techStack = [
    {
      category: "Framework & Core",
      items: [
        { name: "Next.js 16 (App Router)", role: "Framework utama aplikasi web dan rendering dinamis" },
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
      category: "Client-Side Engines",
      items: [
        { name: "HTML5 Canvas API", role: "Mesin konversi dan kompresi format gambar di peramban" },
        { name: "Web Audio API + lamejs", role: "Dekode audio dan enkoding MP3 murni tanpa WASM berat" },
        { name: "@ffmpeg/ffmpeg & @ffmpeg/util", role: "Transcoding video multi-format (MP4, WebM, MKV, AVI) via WebAssembly" },
        { name: "pdf-lib", role: "Pembuatan dan manipulasi dokumen PDF dari teks atau gambar" },
        { name: "mammoth + DOMPurify", role: "Parser dokumen Word (.docx) ke HTML tersanitasi" },
        { name: "JSZip", role: "Pemaketan berkas hasil konversi batch ke dalam arsip ZIP" },
      ],
    },
    {
      category: "Security & Server Proxy",
      items: [
        { name: "Safe Socket DNS Pinning", role: "Mitigasi TOCTOU / DNS rebinding dan pencegahan SSRF di tingkat soket" },
        { name: "HMAC-SHA256 Proxy Token", role: "Pencegahan Open Proxy dengan fail-closed secret berumur pendek" },
        { name: "Domain Allowlist Enforcement", role: "Penyaringan host media upstream yang telah diverifikasi" },
        { name: "@coflyn/scrapr", role: "Resolusi metadata dan format dari URL media publik" },
      ],
    },
    {
      category: "Tooling & Standard",
      items: [
        { name: "pnpm", role: "Manajer paket cepat dan hemat ruang disk" },
        { name: "ESLint 9", role: "Pemeriksaan standar kualitas dan konsistensi kode" },
      ],
    },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Container Editorial Vintage */}
      <article className="bg-[#FFFCF6] border border-[#D8CCB9] rounded-xl p-6 sm:p-10 divide-y divide-[#D8CCB9] space-y-8 sm:space-y-10 shadow-xs">
        
        {/* A. Editorial Hero Section & Favicon Showcase */}
        <header className="space-y-6">
          {/* Breadcrumb & Navigation */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-1 border-b border-[#D8CCB9]/60">
            <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-xs font-medium text-[#62584C]">
              <Link
                href="/"
                className="hover:text-[#332F29] hover:underline focus:outline-none focus-visible:ring-1 focus-visible:ring-[#A34F38] rounded"
              >
                Converter
              </Link>
              <span className="text-[#D8CCB9]">/</span>
              <span className="text-[#332F29] font-semibold" aria-current="page">About</span>
            </nav>

            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-[#A34F38] hover:text-[#8B3F2A] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#A34F38] rounded px-1"
            >
              <ArrowLeft size={14} aria-hidden="true" />
              <span>Kembali ke Converter</span>
            </Link>
          </div>

          {/* Hero Grid: Editorial Intro + Visual Favicon Showcase */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-2">
            {/* Teks Editorial */}
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-[#344638]/10 text-[#344638] text-xs font-semibold tracking-wider uppercase border border-[#344638]/20">
                <ShieldCheck size={14} aria-hidden="true" />
                <span>Open-Source Media Utility</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-serif font-bold text-[#332F29] tracking-tight leading-tight">
                About TokiConvert
              </h1>
              <p className="text-base sm:text-lg text-[#62584C] font-serif italic leading-relaxed">
                Kembalikan kendali privasi data Anda. Utilitas media lokal yang memproses gambar, audio, video, dan dokumen tanpa meninggalkan peramban.
              </p>
              <p className="text-xs sm:text-sm text-[#62584C] leading-relaxed">
                Sebagian besar konverter web konvensional mewajibkan pengguna mengunggah berkas pribadi ke peladen cloud pihak ketiga. TokiConvert mengubah paradigma tersebut dengan eksekusi <strong className="text-[#332F29]">client-side offline-ready</strong>: tidak ada basis data, tanpa login, bebas pelacak invasif, dan tanpa risiko kebocoran data.
              </p>
            </div>

            {/* Visual Favicon & Brandmark Showcase Plate */}
            <div className="lg:col-span-5">
              <div className="border border-[#D8CCB9] bg-[#F4EBDD]/60 rounded-xl p-5 space-y-3.5 shadow-2xs relative">
                {/* Header Label Plat Teknis */}
                <div className="flex items-center justify-between border-b border-[#D8CCB9] pb-2 text-[11px] font-mono text-[#62584C]">
                  <span className="font-semibold uppercase tracking-wider text-[#344638] flex items-center gap-1">
                    <Sparkles size={12} aria-hidden="true" />
                    Brandmark &amp; Favicon Asset
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-[#EFE4D2] text-[#332F29] font-medium">SVG Native</span>
                </div>

                {/* Tampilan Visual Utama dari favicon.svg */}
                <div className="relative w-full h-36 sm:h-40 bg-[#FFFCF6] border border-[#D8CCB9] rounded-lg p-3 flex items-center justify-center overflow-hidden group">
                  <Image
                    src="/favicon.svg"
                    alt="TokiConvert Official Favicon SVG"
                    width={220}
                    height={123}
                    priority
                    className="max-h-full max-w-full object-contain drop-shadow-2xs transition-transform duration-300 group-hover:scale-105"
                  />
                </div>

                {/* Micro Showcase: Variasi Adaptasi Favicon di Browser */}
                <div className="space-y-1.5 pt-0.5">
                  <p className="text-[11px] font-serif font-semibold text-[#332F29]">
                    Kesesuaian Tampilan Antarmuka Peramban:
                  </p>
                  <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-mono text-[#62584C]">
                    <div className="border border-[#D8CCB9] bg-[#FFFCF6] rounded p-1.5 flex flex-col items-center justify-center gap-1">
                      <div className="w-4 h-4 relative flex items-center justify-center">
                        <Image src="/favicon.svg" alt="16px" fill className="object-contain" />
                      </div>
                      <span className="text-[#332F29]">16px</span>
                      <span className="text-[9px] text-[#62584C]/80">Tab Bar</span>
                    </div>

                    <div className="border border-[#D8CCB9] bg-[#FFFCF6] rounded p-1.5 flex flex-col items-center justify-center gap-1">
                      <div className="w-6 h-6 relative flex items-center justify-center">
                        <Image src="/favicon.svg" alt="32px" fill className="object-contain" />
                      </div>
                      <span className="text-[#332F29]">32px</span>
                      <span className="text-[9px] text-[#62584C]/80">Bookmark</span>
                    </div>

                    <div className="border border-[#D8CCB9] bg-[#FFFCF6] rounded p-1.5 flex flex-col items-center justify-center gap-1">
                      <div className="w-8 h-8 relative flex items-center justify-center">
                        <Image src="/favicon.svg" alt="48px" fill className="object-contain" />
                      </div>
                      <span className="text-[#332F29]">48px</span>
                      <span className="text-[9px] text-[#62584C]/80">Desktop</span>
                    </div>

                    <div className="border border-[#D8CCB9] bg-[#FFFCF6] rounded p-1.5 flex flex-col items-center justify-center gap-1">
                      <div className="w-8 h-8 relative flex items-center justify-center">
                        <Image src="/favicon.svg" alt="Vector" fill className="object-contain" />
                      </div>
                      <span className="text-[#A34F38] font-bold">Vector</span>
                      <span className="text-[9px] text-[#62584C]/80">Hi-DPI</span>
                    </div>
                  </div>
                </div>

                <p className="text-[10px] text-[#62584C]/80 leading-normal italic text-center">
                  Vektor SVG terintegrasi langsung pada metadata Next.js untuk ketajaman sempurna di seluruh layar beresolusi tinggi.
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* B. Problem & Philosophy (Why TokiConvert) */}
        <section className="pt-8 sm:pt-10 space-y-4">
          <div className="flex items-center gap-2.5">
            <Lock size={22} className="text-[#344638] shrink-0" aria-hidden="true" />
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#332F29]">
              Filosofi &amp; Masalah yang Kami Selesaikan
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            <div className="border border-[#D8CCB9] bg-[#F4EBDD]/25 rounded-lg p-5 space-y-2">
              <h3 className="text-sm font-serif font-bold text-[#A34F38] flex items-center gap-1.5">
                <span>✕</span> Masalah Konverter Konvensional
              </h3>
              <p className="text-xs sm:text-sm text-[#62584C] leading-relaxed">
                Alat konversi berbasis cloud pada umumnya mengharuskan pengguna mengirimkan berkas pribadi ke server jarak jauh. Hal ini menimbulkan risiko retensi data tanpa izin, latensi unggah yang memakan kuota, serta ketidakpastian privasi pada dokumen penting atau foto keluarga.
              </p>
            </div>

            <div className="border border-[#D8CCB9] bg-[#F4EBDD]/25 rounded-lg p-5 space-y-2">
              <h3 className="text-sm font-serif font-bold text-[#344638] flex items-center gap-1.5">
                <span>✓</span> Pendekatan TokiConvert
              </h3>
              <p className="text-xs sm:text-sm text-[#62584C] leading-relaxed">
                TokiConvert memanfaatkan komputasi modern peramban (HTML5 Canvas, Web Audio API, WebAssembly, dan pdf-lib) sehingga proses decoding dan encoding berkas berlangsung 100% pada CPU/RAM perangkat Anda secara instan tanpa proses unggah ke server luar.
              </p>
            </div>
          </div>
        </section>

        {/* C. Model Arsitektur & Keamanan Verifikasi */}
        <section className="pt-8 sm:pt-10 space-y-4">
          <div className="flex items-center gap-2.5">
            <ShieldCheck size={22} className="text-[#344638] shrink-0" aria-hidden="true" />
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#332F29]">
              Model Arsitektur &amp; Batasan Teknis
            </h2>
          </div>
          <p className="text-sm text-[#62584C]">
            Demi transparansi teknis penuh kepada komunitas open-source, berikut adalah batas pemisahan alur kerja aktual dalam TokiConvert:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {/* Box 1: Client-Side */}
            <div className="border border-[#D8CCB9] bg-[#F4EBDD]/40 rounded-lg p-5 space-y-3">
              <div className="flex items-center gap-2 text-[#344638]">
                <Cpu size={18} aria-hidden="true" />
                <h3 className="text-sm font-serif font-bold text-[#332F29]">
                  1. Pemrosesan di Sisi Klien (Client-Side)
                </h3>
              </div>
              <ul className="text-xs sm:text-sm text-[#62584C] space-y-2 list-disc list-inside">
                <li><strong className="text-[#332F29]">Image Converter:</strong> Konversi PNG, JPEG, WEBP, BMP, SVG, GIF, rotasi, penyesuaian dimensi, serta kompresi kualitas via Canvas API.</li>
                <li><strong className="text-[#332F29]">Audio Converter:</strong> Decode berkas audio dan encode ke MP3 murni via Web Audio API + lamejs.</li>
                <li><strong className="text-[#332F29]">Video Converter:</strong> Transcoding video (MP4, WebM, MKV, AVI, MOV) langsung di peramban via FFmpeg WebAssembly.</li>
                <li><strong className="text-[#332F29]">Document Converter:</strong> Pembuatan PDF via pdf-lib dan pratinjau DOCX tersanitasi via mammoth + DOMPurify.</li>
                <li><strong className="text-[#332F29]">Jaminan Privasi:</strong> Berkas lokal tidak pernah diunggah atau meninggalkan perangkat Anda.</li>
              </ul>
            </div>

            {/* Box 2: Server-Assisted */}
            <div className="border border-[#D8CCB9] bg-[#F4EBDD]/40 rounded-lg p-5 space-y-3">
              <div className="flex items-center gap-2 text-[#A34F38]">
                <Server size={18} aria-hidden="true" />
                <h3 className="text-sm font-serif font-bold text-[#332F29]">
                  2. Layanan Media di Server (Server-Assisted)
                </h3>
              </div>
              <ul className="text-xs sm:text-sm text-[#62584C] space-y-2 list-disc list-inside">
                <li><strong className="text-[#332F29]">Media Downloader:</strong> Server hanya memproses URL media publik yang dimasukkan pengguna, bukan file lokal.</li>
                <li><strong className="text-[#332F29]">Safe Socket DNS Pinning:</strong> Perlindungan soket TCP terhadap ancaman SSRF, TOCTOU, loopback internal, dan cloud metadata.</li>
                <li><strong className="text-[#332F29]">HMAC-SHA256 Token:</strong> Token tanda tangan berumur pendek dan terikat alamat upstream untuk mencegah penyalahgunaan open proxy.</li>
                <li><strong className="text-[#332F29]">Batasan Protektif:</strong> Kuota unduhan dibatasi maksimum 50 MB dengan batas waktu pemrosesan 15 detik.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* D. Status Fitur Terverifikasi */}
        <section className="pt-8 sm:pt-10 space-y-3">
          <div className="flex items-center gap-2.5">
            <Compass size={22} className="text-[#344638] shrink-0" aria-hidden="true" />
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#332F29]">
              Status Fitur Terverifikasi
            </h2>
          </div>
          <p className="text-sm text-[#62584C]">
            Daftar utilitas yang telah aktif, diuji, dan dapat digunakan secara langsung:
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
                <span className="font-semibold text-[#332F29]">Video Converter</span>
                <span className="text-[#62584C] text-xs sm:text-sm block sm:inline sm:ml-2">
                  — Transcoding video lokal (MP4, WebM, MKV, AVI, MOV) langsung di peramban via FFmpeg WebAssembly secara privat. Kecepatan transcoding bergantung pada CPU dan RAM perangkat Anda.
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
                  — Teks &amp; Gambar ke PDF (via pdf-lib) serta pembacaan berkas DOCX ke HTML tersanitasi (via mammoth + DOMPurify) sepenuhnya di sisi peramban.
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
                  — Ekstraksi metadata URL media publik dan pengaliran stream audio/video via proxy aman dengan batas ukuran 50 MB dan timeout 15 detik.
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* E. Built With / Tech Stack */}
        <section className="pt-8 sm:pt-10 space-y-4">
          <div className="flex items-center gap-2.5">
            <Layers size={22} className="text-[#344638] shrink-0" aria-hidden="true" />
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#332F29]">
              Tech Stack Terverifikasi
            </h2>
          </div>
          <p className="text-sm text-[#62584C]">
            Teknologi dan pustaka aktif yang menyusun fondasi sistem TokiConvert:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
            {techStack.map((group, idx) => (
              <div
                key={idx}
                className="border border-[#D8CCB9] bg-[#F4EBDD]/30 rounded-lg p-4 space-y-2.5"
              >
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#A34F38] border-b border-[#D8CCB9]/60 pb-1">
                  {group.category}
                </h3>
                <ul className="space-y-2">
                  {group.items.map((item, itemIdx) => (
                    <li key={itemIdx} className="text-xs sm:text-sm">
                      <span className="font-semibold text-[#332F29]">{item.name}</span>
                      <span className="text-[#62584C] block text-[11px] leading-snug">{item.role}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* F. The Maker & Project Inspirations */}
        <section className="pt-8 sm:pt-10 space-y-4">
          <div className="flex items-center gap-2.5">
            <User size={22} className="text-[#344638] shrink-0" aria-hidden="true" />
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#332F29]">The Maker</h2>
          </div>
          <p className="text-sm sm:text-base text-[#62584C] leading-relaxed">
            TokiConvert dirancang dan dikembangkan oleh <span className="font-semibold text-[#332F29]">Nafis</span> sebagai proyek utilitas sumber terbuka. Visi proyek ini adalah menyediakan alat konversi format yang cepat, menghargai privasi, bebas iklan pelacak, serta memiliki antarmuka retro klasik yang menenangkan mata.
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

          <div className="pt-4 border-t border-[#D8CCB9]/70 space-y-3">
            <div className="flex items-center gap-2">
              <HeartHandshake size={18} className="text-[#344638]" aria-hidden="true" />
              <h3 className="text-sm font-serif font-bold text-[#332F29]">Project Inspirations</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="border border-[#D8CCB9] rounded p-3.5 bg-[#F4EBDD]/25 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-serif font-bold text-[#332F29] text-sm">Mori</span>
                  <a
                    href="https://github.com/coflyn/Mori"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-[#A34F38] hover:underline inline-flex items-center gap-1"
                    aria-label="Repositori GitHub Mori"
                  >
                    <span>coflyn/Mori</span>
                    <ExternalLink size={11} aria-hidden="true" />
                  </a>
                </div>
                <p className="text-xs text-[#62584C] leading-relaxed">
                  Inspirasi tata letak produk yang bersih, minimalis, dan berfokus pada kemudahan utilitas.
                </p>
              </div>

              <div className="border border-[#D8CCB9] rounded p-3.5 bg-[#F4EBDD]/25 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-serif font-bold text-[#332F29] text-sm">scrapr</span>
                  <a
                    href="https://github.com/coflyn/scrapr"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-[#A34F38] hover:underline inline-flex items-center gap-1"
                    aria-label="Repositori GitHub scrapr"
                  >
                    <span>coflyn/scrapr</span>
                    <ExternalLink size={11} aria-hidden="true" />
                  </a>
                </div>
                <p className="text-xs text-[#62584C] leading-relaxed">
                  Toolkit Node.js untuk ekstraksi metadata media publik, dipadukan dengan kebijakan proteksi soket di TokiConvert.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* G. Peta Jalan & Perencanaan Fitur (Roadmap — Planned) */}
        <section className="pt-8 sm:pt-10 space-y-4">
          <div className="flex items-center gap-2.5">
            <Milestone size={22} className="text-[#344638] shrink-0" aria-hidden="true" />
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#332F29]">
              Peta Jalan &amp; Perencanaan Masa Depan (Roadmap)
            </h2>
          </div>
          <p className="text-sm text-[#62584C]">
            Rencana pengembangan teknis berjangka yang direncanakan untuk memperluas kapabilitas TokiConvert dengan tetap berpegang teguh pada prinsip privasi di sisi klien:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            <div className="border border-[#D8CCB9] bg-[#F4EBDD]/30 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-serif font-bold text-[#332F29]">
                  1. Multi-Threading WebAssembly
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#A34F38]/15 text-[#A34F38] uppercase tracking-wider">
                  Planned
                </span>
              </div>
              <p className="text-xs text-[#62584C] leading-relaxed">
                Penerapan header isolasi lintas asal (<code className="text-[#332F29] bg-[#EFE4D2] px-1 rounded">COOP / COEP</code>) dan <code className="text-[#332F29] bg-[#EFE4D2] px-1 rounded">SharedArrayBuffer</code> guna mengakselerasi pemrosesan FFmpeg WASM hingga 2-3x lipat pada CPU multi-core.
              </p>
            </div>

            <div className="border border-[#D8CCB9] bg-[#F4EBDD]/30 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-serif font-bold text-[#332F29]">
                  2. Ekstensi Format Dokumen
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#A34F38]/15 text-[#A34F38] uppercase tracking-wider">
                  Planned
                </span>
              </div>
              <p className="text-xs text-[#62584C] leading-relaxed">
                Konversi berkas Markdown (<code className="text-[#332F29] bg-[#EFE4D2] px-1 rounded">.md</code>) ke PDF dan HTML tersanitasi, serta penambahan alat penggabungan (<em className="italic">merge</em>) dan pemisahan (<em className="italic">split</em>) halaman dokumen PDF.
              </p>
            </div>

            <div className="border border-[#D8CCB9] bg-[#F4EBDD]/30 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-serif font-bold text-[#332F29]">
                  3. Vector Tracing &amp; Kuantisasi Palet
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#A34F38]/15 text-[#A34F38] uppercase tracking-wider">
                  Planned
                </span>
              </div>
              <p className="text-xs text-[#62584C] leading-relaxed">
                Vektorisasi gambar raster (PNG / JPEG) menjadi grafis vektor SVG terukur, serta fitur reduksi dan kuantisasi palet warna untuk optimalisasi bobot web grafis.
              </p>
            </div>

            <div className="border border-[#D8CCB9] bg-[#F4EBDD]/30 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-serif font-bold text-[#332F29]">
                  4. Progressive Web App (PWA)
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#A34F38]/15 text-[#A34F38] uppercase tracking-wider">
                  Planned
                </span>
              </div>
              <p className="text-xs text-[#62584C] leading-relaxed">
                Dukungan Service Worker dan caching aset peramban penuh agar fungsi konversi gambar, audio, dan video dapat dioperasikan secara utuh saat perangkat berada di luar jaringan (100% offline).
              </p>
            </div>
          </div>
        </section>

        {/* H. Penutup & Call to Action */}
        <section className="pt-8 sm:pt-10">
          <div className="border border-[#D8CCB9] bg-[#F4EBDD]/50 rounded-xl p-6 sm:p-8 text-center space-y-4">
            <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#332F29]">
              Mulai Konversi Berkas Anda Sekarang
            </h3>
            <p className="text-xs sm:text-sm text-[#62584C] max-w-xl mx-auto leading-relaxed">
              Pilih format yang Anda butuhkan dan nikmati proses konversi yang cepat, privat, dan tanpa batasan unggah ke server luar.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#A34F38] hover:bg-[#8B3F2A] text-[#FFFCF6] font-medium text-xs sm:text-sm transition-colors shadow-2xs focus:outline-none focus-visible:ring-2 focus-visible:ring-[#A34F38]"
              >
                <span>Image Converter</span>
                <ArrowRight size={15} aria-hidden="true" />
              </Link>
              <Link
                href="/video"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#D8CCB9] bg-[#FFFCF6] hover:bg-[#F4EBDD] text-[#332F29] font-medium text-xs sm:text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#A34F38]"
              >
                <span>Video Converter</span>
              </Link>
              <Link
                href="/audio"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#D8CCB9] bg-[#FFFCF6] hover:bg-[#F4EBDD] text-[#332F29] font-medium text-xs sm:text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#A34F38]"
              >
                <span>Audio Converter</span>
              </Link>
              <Link
                href="/document"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#D8CCB9] bg-[#FFFCF6] hover:bg-[#F4EBDD] text-[#332F29] font-medium text-xs sm:text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#A34F38]"
              >
                <span>Document Converter</span>
              </Link>
            </div>
          </div>
        </section>

        {/* I. Quick Links & Repository Footer */}
        <footer className="pt-8 sm:pt-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs text-[#62584C]">
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/"
              className="font-medium text-[#A34F38] hover:text-[#8B3F2A] hover:underline focus:outline-none focus-visible:ring-1 focus-visible:ring-[#A34F38] rounded"
            >
              ← Kembali ke Beranda
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

          <p className="text-[#62584C]/80 font-mono text-[11px]">
            TokiConvert · Open-source utility under MIT
          </p>
        </footer>

      </article>
    </div>
  );
}
