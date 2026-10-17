"use client";

import { useEffect } from "react";
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

/* ─── Scroll reveal hook ─────────────────────────────────── */
function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll(".reveal, .reveal-left, .reveal-right");
    if (!els.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            observer.unobserve(e.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -32px 0px" }
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

const techStack = [
  {
    category: "Framework & Core",
    items: [
      { name: "Next.js 16 (App Router)", role: "Framework utama dan rendering dinamis" },
      { name: "React 19", role: "Pustaka antarmuka deklaratif berbasis komponen" },
      { name: "TypeScript", role: "Pengetikan statis untuk keandalan kode" },
    ],
  },
  {
    category: "Styling & UI",
    items: [
      { name: "Tailwind CSS v4", role: "Styling utilitas bertema Vintage Retro Classic" },
      { name: "Lucide React", role: "Ikon antarmuka fungsional dan aksesibel" },
    ],
  },
  {
    category: "Client-Side Engines",
    items: [
      { name: "HTML5 Canvas API", role: "Konversi dan kompresi format gambar di peramban" },
      { name: "Web Audio API + lamejs", role: "Dekode audio dan enkoding MP3 murni" },
      { name: "@ffmpeg/ffmpeg", role: "Transcoding video via WebAssembly (MP4, WebM, MKV)" },
      { name: "Binary ICO Builder", role: "Favicon.ico biner multi-resolusi di sisi klien" },
      { name: "pdf-lib", role: "Pembuatan dan manipulasi dokumen PDF" },
      { name: "mammoth + DOMPurify", role: "Parser DOCX ke HTML tersanitasi" },
      { name: "JSZip", role: "Pemaketan hasil batch ke arsip ZIP" },
    ],
  },
  {
    category: "Security & Proxy",
    items: [
      { name: "Safe Socket DNS Pinning", role: "Mitigasi SSRF dan DNS rebinding di tingkat soket" },
      { name: "HMAC-SHA256 Token", role: "Token fail-closed berumur pendek untuk proxy aman" },
      { name: "@coflyn/scrapr", role: "Resolusi metadata URL media publik" },
    ],
  },
  {
    category: "Tooling",
    items: [
      { name: "pnpm", role: "Package manager cepat dan efisien" },
      { name: "ESLint 9", role: "Standar kualitas dan konsistensi kode" },
    ],
  },
];

const featureStatus = [
  {
    name: "Image Converter",
    status: "available",
    desc: "Batch konversi PNG, JPG, WEBP, BMP, SVG, GIF. Kontrol dimensi, kompresi kualitas, dan unduhan ZIP (maks 10 file @ 15 MB).",
    href: "/",
  },
  {
    name: "Favicon Pack Generator",
    status: "available",
    desc: "Upload satu logo → ICO biner multi-resolusi, PNG 16–512px, site.webmanifest, tag HTML, dan arsip ZIP.",
    href: "/favicon",
  },
  {
    name: "Audio Converter",
    status: "available",
    desc: "Konversi WAV, MP3, OGG, M4A ke MP3 murni via Web Audio API + lamejs langsung di peramban.",
    href: "/audio",
  },
  {
    name: "Video Converter",
    status: "available",
    desc: "Transcoding MP4, WebM, MKV, AVI, MOV via FFmpeg WebAssembly. Kecepatan bergantung pada CPU perangkat.",
    href: "/video",
  },
  {
    name: "Document Converter",
    status: "available",
    desc: "Teks & gambar ke PDF via pdf-lib. Pratinjau DOCX ke HTML tersanitasi via mammoth + DOMPurify.",
    href: "/document",
  },
  {
    name: "Media Downloader",
    status: "available",
    desc: "Ekstraksi metadata URL media publik dan stream via proxy aman. Batas 50 MB, timeout 15 detik.",
    href: "/media",
  },
];

const roadmap = [
  {
    title: "Multi-Threading WebAssembly",
    desc: "Penerapan COOP/COEP header dan SharedArrayBuffer untuk mengakselerasi FFmpeg WASM 2–3x pada CPU multi-core.",
  },
  {
    title: "Ekstensi Format Dokumen",
    desc: "Konversi Markdown (.md) ke PDF/HTML, serta alat merge dan split halaman PDF.",
  },
  {
    title: "Vector Tracing & Kuantisasi",
    desc: "Vektorisasi raster ke SVG dan reduksi palet warna untuk optimalisasi grafis web.",
  },
  {
    title: "Progressive Web App (PWA)",
    desc: "Service Worker dan caching aset penuh agar konversi gambar, audio, dan video dapat dioperasikan offline.",
  },
];

export default function AboutPage() {
  useScrollReveal();

  return (
    <div className="w-full overflow-x-hidden">

      {/* ══════════════════════════════════════════════
          A. HERO — editorial, asimetris
      ══════════════════════════════════════════════ */}
      <section className="w-full max-w-5xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14 pb-12">

        {/* Breadcrumb */}
        <nav className="anim-fade-in flex items-center gap-2 text-xs font-mono text-[#62584C] mb-8" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-[#332F29] hover:underline focus:outline-none focus-visible:ring-1 focus-visible:ring-[#A34F38] rounded">
            Converter
          </Link>
          <span className="text-[#D8CCB9]">/</span>
          <span className="text-[#332F29] font-semibold" aria-current="page">About</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Teks hero */}
          <div className="lg:col-span-7 space-y-5">
            <div className="anim-fade-in">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-[0.12em] text-[#344638] border border-[#344638]/25 rounded px-2.5 py-1 bg-[#344638]/8">
                <ShieldCheck size={11} aria-hidden="true" />
                Open-Source Media Utility
              </span>
            </div>

            <div className="anim-fade-up delay-100">
              <h1 className="text-4xl sm:text-5xl font-serif font-bold text-[#332F29] tracking-tight leading-tight">
                About<br />
                <span className="text-[#A34F38]">TokiConvert</span>
              </h1>
            </div>

            <p className="anim-fade-up delay-200 text-sm sm:text-base text-[#62584C] font-serif italic leading-relaxed max-w-lg">
              Kembalikan kendali privasi data Anda. Utilitas media lokal yang memproses gambar, audio, video, dan dokumen tanpa meninggalkan peramban.
            </p>
            <p className="anim-fade-up delay-300 text-sm text-[#62584C] leading-relaxed max-w-lg">
              Sebagian besar konverter web mengharuskan pengguna mengirim berkas ke server cloud. TokiConvert mengubah paradigma itu dengan eksekusi <strong className="text-[#332F29]">client-side offline-ready</strong> — tidak ada basis data, tanpa login, bebas pelacak, tanpa risiko kebocoran data.
            </p>

            <div className="anim-fade-up delay-400 flex flex-wrap gap-3 pt-1">
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#A34F38] hover:bg-[#8B3F2A] text-[#FFFCF6] text-sm font-semibold transition-all hover:-translate-y-px shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#A34F38]"
              >
                <ArrowLeft size={14} aria-hidden="true" />
                Kembali ke Converter
              </Link>
              <a
                href="https://github.com/Tokitakun/TokiConvert"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#D8CCB9] bg-[#FFFCF6] hover:bg-[#F4EBDD] text-[#332F29] text-sm font-medium transition-all hover:-translate-y-px focus:outline-none focus-visible:ring-2 focus-visible:ring-[#A34F38]"
              >
                <GitBranch size={14} aria-hidden="true" />
                GitHub Repository
              </a>
            </div>
          </div>

          {/* Visual: favicon showcase */}
          <div className="lg:col-span-5 anim-slide-right delay-300">
            <div className="border border-[#D8CCB9] bg-[#FFFCF6] rounded-2xl p-5 space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[#D8CCB9] pb-3 text-[10px] font-mono">
                <span className="font-semibold uppercase tracking-wider text-[#344638] flex items-center gap-1">
                  <Sparkles size={11} aria-hidden="true" />
                  Brandmark & Favicon
                </span>
                <span className="px-1.5 py-0.5 rounded bg-[#F4EBDD] text-[#332F29]">SVG Native</span>
              </div>

              {/* Visual utama */}
              <div className="w-full h-32 bg-[#F4EBDD]/60 border border-[#D8CCB9] rounded-xl flex items-center justify-center overflow-hidden group">
                <Image
                  src="/favicon.svg"
                  alt="TokiConvert Favicon SVG"
                  width={180}
                  height={100}
                  priority
                  className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
                />
              </div>

              {/* Adaptasi resolusi */}
              <div>
                <p className="text-[10px] font-mono text-[#62584C] mb-2 uppercase tracking-wider">Resolusi tampilan</p>
                <div className="grid grid-cols-4 gap-2 text-center text-[9px] font-mono text-[#62584C]">
                  {[
                    { size: "16px", label: "Tab", dim: "w-4 h-4" },
                    { size: "32px", label: "Bookmark", dim: "w-6 h-6" },
                    { size: "48px", label: "Desktop", dim: "w-8 h-8" },
                    { size: "Vector", label: "Hi-DPI", dim: "w-8 h-8", highlight: true },
                  ].map(({ size, label, dim, highlight }) => (
                    <div key={size} className="border border-[#D8CCB9] bg-[#F4EBDD]/40 rounded p-1.5 flex flex-col items-center gap-1">
                      <div className={`${dim} relative flex items-center justify-center`}>
                        <Image src="/favicon.svg" alt={size} fill className="object-contain" />
                      </div>
                      <span className={highlight ? "text-[#A34F38] font-bold" : "text-[#332F29]"}>{size}</span>
                      <span className="text-[#62584C]/70">{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-[10px] text-[#62584C]/70 italic text-center leading-snug">
                SVG terintegrasi pada metadata Next.js untuk ketajaman di seluruh layar beresolusi tinggi.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          B. MASALAH vs SOLUSI — split kontras
      ══════════════════════════════════════════════ */}
      <section className="w-full border-y border-[#D8CCB9] bg-[#FFFCF6]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-14">
          <div className="reveal mb-8 flex items-center gap-3">
            <Lock size={20} className="text-[#344638]" aria-hidden="true" />
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#332F29]">
              Filosofi &amp; Masalah yang Kami Selesaikan
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="reveal-left border-l-3 border-[#A34F38] pl-5 space-y-2">
              <h3 className="text-sm font-serif font-bold text-[#A34F38]">✕ Masalah Konverter Konvensional</h3>
              <p className="text-sm text-[#62584C] leading-relaxed">
                Alat konversi cloud umumnya mengharuskan pengguna mengirim berkas pribadi ke server jarak jauh — menimbulkan risiko retensi data tanpa izin, latensi unggah, dan ketidakpastian privasi pada dokumen penting.
              </p>
            </div>
            <div className="reveal-right border-l-3 border-[#344638] pl-5 space-y-2">
              <h3 className="text-sm font-serif font-bold text-[#344638]">✓ Pendekatan TokiConvert</h3>
              <p className="text-sm text-[#62584C] leading-relaxed">
                TokiConvert memanfaatkan Canvas API, Web Audio, WebAssembly, dan pdf-lib sehingga seluruh proses decoding dan encoding berlangsung 100% pada CPU/RAM perangkat Anda — tanpa upload ke server.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          C. ARSITEKTUR — dua kolom teknis
      ══════════════════════════════════════════════ */}
      <section className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-14">
        <div className="reveal mb-8 flex items-center gap-3">
          <ShieldCheck size={20} className="text-[#344638]" aria-hidden="true" />
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#332F29]">
            Model Arsitektur &amp; Batasan Teknis
          </h2>
        </div>
        <p className="reveal text-sm text-[#62584C] mb-6 max-w-2xl">
          Transparansi teknis penuh: berikut pemisahan alur kerja aktual dalam TokiConvert.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Client-side */}
          <div className="reveal bg-[#FFFCF6] border border-[#D8CCB9] rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-[#344638]">
              <Cpu size={18} aria-hidden="true" />
              <h3 className="text-sm font-serif font-bold text-[#332F29]">
                1. Pemrosesan Client-Side (Lokal)
              </h3>
            </div>
            <ul className="text-xs sm:text-sm text-[#62584C] space-y-2">
              {[
                ["Image Converter", "PNG, JPG, WEBP, BMP, SVG, GIF via Canvas API."],
                ["Audio Converter", "Decode + encode MP3 via Web Audio API + lamejs."],
                ["Video Converter", "Transcoding via FFmpeg WebAssembly."],
                ["Favicon Pack Generator", "ICO biner, PNG 16–512px, webmanifest dari satu logo."],
                ["Document Converter", "PDF via pdf-lib, DOCX via mammoth + DOMPurify."],
              ].map(([name, desc]) => (
                <li key={name} className="flex gap-2">
                  <span className="text-[#344638] font-mono shrink-0">→</span>
                  <span><strong className="text-[#332F29]">{name}:</strong> {desc}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Server-assisted */}
          <div className="reveal bg-[#FFFCF6] border border-[#D8CCB9] rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-[#A34F38]">
              <Server size={18} aria-hidden="true" />
              <h3 className="text-sm font-serif font-bold text-[#332F29]">
                2. Layanan Server-Assisted
              </h3>
            </div>
            <ul className="text-xs sm:text-sm text-[#62584C] space-y-2">
              {[
                ["Media Downloader", "Server hanya memproses URL media publik yang dimasukkan pengguna — bukan berkas lokal."],
                ["DNS Socket Pinning", "Perlindungan soket TCP terhadap SSRF, TOCTOU, loopback internal, dan cloud metadata."],
                ["HMAC-SHA256 Token", "Token tanda tangan berumur pendek dan terikat alamat upstream untuk mencegah open proxy."],
                ["Batasan Protektif", "Maks 50 MB per unduhan, timeout 15 detik."],
              ].map(([name, desc]) => (
                <li key={name} className="flex gap-2">
                  <span className="text-[#A34F38] font-mono shrink-0">→</span>
                  <span><strong className="text-[#332F29]">{name}:</strong> {desc}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          D. STATUS FITUR — daftar kompak
      ══════════════════════════════════════════════ */}
      <section className="w-full bg-[#332F29] text-[#FFFCF6]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-14">
          <div className="reveal mb-8 flex items-center gap-3">
            <Compass size={20} className="text-[#D4B98A]" aria-hidden="true" />
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#FFFCF6]">
              Status Fitur Terverifikasi
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 reveal-stagger">
            {featureStatus.map((feat) => (
              <Link
                key={feat.name}
                href={feat.href}
                className="reveal group flex items-start gap-3 bg-[#FFFCF6]/8 border border-[#FFFCF6]/15 rounded-xl p-4 hover:bg-[#FFFCF6]/12 hover:border-[#FFFCF6]/25 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4B98A]"
              >
                <span className="shrink-0 mt-0.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-[#344638] text-[#FFFCF6] border border-[#344638]/60">
                  Tersedia
                </span>
                <div>
                  <p className="text-sm font-serif font-bold text-[#FFFCF6] group-hover:text-[#D4B98A] transition-colors">
                    {feat.name}
                  </p>
                  <p className="text-[11px] text-[#FFFCF6]/55 leading-snug mt-0.5">{feat.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          E. TECH STACK — grid kompak
      ══════════════════════════════════════════════ */}
      <section className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-14">
        <div className="reveal mb-8 flex items-center gap-3">
          <Layers size={20} className="text-[#344638]" aria-hidden="true" />
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#332F29]">
            Tech Stack Terverifikasi
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 reveal-stagger">
          {techStack.map((group, idx) => (
            <div
              key={idx}
              className="reveal bg-[#FFFCF6] border border-[#D8CCB9] rounded-xl p-4 space-y-2.5"
            >
              <h3 className="text-[10px] font-semibold uppercase tracking-widest text-[#A34F38] border-b border-[#D8CCB9]/60 pb-2">
                {group.category}
              </h3>
              <ul className="space-y-2">
                {group.items.map((item, i) => (
                  <li key={i} className="text-xs">
                    <span className="font-semibold text-[#332F29] block">{item.name}</span>
                    <span className="text-[#62584C] text-[11px] leading-snug">{item.role}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          F. THE MAKER
      ══════════════════════════════════════════════ */}
      <section className="w-full border-t border-[#D8CCB9]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-14">
          <div className="reveal flex items-start gap-5 max-w-2xl">
            <div className="w-10 h-10 rounded-full bg-[#A34F38]/10 border border-[#A34F38]/20 flex items-center justify-center text-[#A34F38] shrink-0 mt-0.5">
              <User size={20} aria-hidden="true" />
            </div>
            <div className="space-y-3">
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#332F29]">The Maker</h2>
              <p className="text-sm text-[#62584C] leading-relaxed">
                TokiConvert dirancang dan dikembangkan oleh <span className="font-semibold text-[#332F29]">Nafis</span> sebagai proyek utilitas sumber terbuka. Visi proyek ini adalah menyediakan alat konversi format yang cepat, menghargai privasi, bebas iklan, dengan antarmuka retro klasik yang nyaman.
              </p>
              <a
                href="https://github.com/Tokitakun"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-[#A34F38] hover:text-[#8B3F2A] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#A34F38] rounded"
              >
                GitHub: Tokitakun
                <ExternalLink size={13} aria-hidden="true" />
              </a>
            </div>
          </div>

          {/* Project Inspirations */}
          <div className="reveal mt-8 pt-8 border-t border-[#D8CCB9]/70 space-y-4 max-w-2xl">
            <div className="flex items-center gap-2">
              <HeartHandshake size={18} className="text-[#344638]" aria-hidden="true" />
              <h3 className="text-sm font-serif font-bold text-[#332F29]">Project Inspirations</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                {
                  name: "Mori",
                  url: "https://github.com/coflyn/Mori",
                  label: "coflyn/Mori",
                  desc: "Inspirasi tata letak produk bersih dan berfokus pada kemudahan utilitas.",
                },
                {
                  name: "scrapr",
                  url: "https://github.com/coflyn/scrapr",
                  label: "coflyn/scrapr",
                  desc: "Toolkit Node.js untuk ekstraksi metadata media publik, dipadukan dengan proteksi soket di TokiConvert.",
                },
              ].map((proj) => (
                <div key={proj.name} className="border border-[#D8CCB9] rounded-lg p-3.5 bg-[#FFFCF6] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-serif font-bold text-[#332F29] text-sm">{proj.name}</span>
                    <a
                      href={proj.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-[#A34F38] hover:underline inline-flex items-center gap-1"
                    >
                      {proj.label}
                      <ExternalLink size={10} aria-hidden="true" />
                    </a>
                  </div>
                  <p className="text-xs text-[#62584C] leading-relaxed">{proj.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          G. ROADMAP
      ══════════════════════════════════════════════ */}
      <section className="w-full border-t border-[#D8CCB9] bg-[#FFFCF6]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-14">
          <div className="reveal mb-8 flex items-center gap-3">
            <Milestone size={20} className="text-[#344638]" aria-hidden="true" />
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#332F29]">
              Peta Jalan &amp; Rencana Masa Depan
            </h2>
          </div>
          <p className="reveal text-sm text-[#62584C] mb-6 max-w-xl">
            Rencana pengembangan teknis yang belum diimplementasikan, dengan tetap berpegang pada prinsip privasi client-side:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 reveal-stagger">
            {roadmap.map((item, idx) => (
              <div
                key={idx}
                className="reveal border border-[#D8CCB9] rounded-xl p-4 space-y-2 hover:border-[#A34F38]/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-serif font-bold text-[#332F29] leading-snug">
                    {item.title}
                  </h3>
                  <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-semibold bg-[#A34F38]/12 text-[#A34F38] uppercase tracking-wider">
                    Planned
                  </span>
                </div>
                <p className="text-xs text-[#62584C] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          H. CLOSING CTA
      ══════════════════════════════════════════════ */}
      <section className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-14">
        <div className="reveal bg-[#332F29] rounded-2xl p-8 sm:p-10 text-center space-y-5">
          <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#FFFCF6]">
            Mulai Konversi Berkas Sekarang
          </h3>
          <p className="text-xs sm:text-sm text-[#FFFCF6]/65 max-w-md mx-auto leading-relaxed">
            Pilih format yang Anda butuhkan. Cepat, privat, dan tidak ada batasan upload ke server.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#A34F38] hover:bg-[#8B3F2A] text-[#FFFCF6] text-sm font-semibold transition-all hover:-translate-y-px shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4B98A]"
            >
              Image Converter
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
            {[
              { href: "/favicon", label: "Favicon Pack" },
              { href: "/video", label: "Video" },
              { href: "/audio", label: "Audio" },
              { href: "/document", label: "Document" },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-[#FFFCF6]/20 bg-[#FFFCF6]/10 hover:bg-[#FFFCF6]/18 text-[#FFFCF6] text-sm font-medium transition-all hover:-translate-y-px focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4B98A]"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          I. FOOTER LINKS
      ══════════════════════════════════════════════ */}
      <footer className="w-full border-t border-[#D8CCB9] bg-[#F4EBDD]/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs text-[#62584C]">
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/"
              className="font-medium text-[#A34F38] hover:underline focus:outline-none focus-visible:ring-1 focus-visible:ring-[#A34F38] rounded"
            >
              ← Kembali ke Beranda
            </Link>
            <a
              href="https://github.com/Tokitakun/TokiConvert"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 hover:text-[#332F29] hover:underline"
            >
              <GitBranch size={12} aria-hidden="true" />
              GitHub Repository
            </a>
            <a
              href="https://github.com/Tokitakun/TokiConvert/blob/main/LICENSE"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 hover:text-[#332F29] hover:underline"
            >
              <FileText size={12} aria-hidden="true" />
              Lisensi MIT
            </a>
            <a
              href="https://github.com/Tokitakun/TokiConvert/blob/main/CONTRIBUTING.md"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 hover:text-[#332F29] hover:underline"
            >
              <FileText size={12} aria-hidden="true" />
              Kontribusi
            </a>
          </div>
          <p className="text-[#62584C]/70 font-mono text-[10px]">
            TokiConvert · Open-source under MIT
          </p>
        </div>
      </footer>

    </div>
  );
}
