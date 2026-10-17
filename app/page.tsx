"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ImageIcon,
  Music,
  Video,
  FileText,
  Sparkles,
  DownloadCloud,
  ArrowRight,
  Cpu,
  Lock,
  ShieldCheck,
  GitBranch,
  ArrowUpRight,
  HardDrive,
  Layers,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";

/* ─── Scroll Reveal Hook ───────────────────────────────────── */
function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll(".reveal, .reveal-left, .reveal-right");
    if (!els.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );

    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

/* ─── Data: Tools Directory ────────────────────────────────── */
interface ToolItem {
  id: string;
  title: string;
  badge: string;
  engine: string;
  desc: string;
  formats: string[];
  href: string;
  icon: typeof ImageIcon;
  privacy: "100% In-Browser" | "SSRF-Protected Proxy";
  weight: "featured" | "primary" | "secondary";
  highlights: string[];
}

const toolsDirectory: ToolItem[] = [
  {
    id: "image",
    title: "Image Converter",
    badge: "Canvas API & OffscreenCanvas",
    engine: "HTML5 Canvas",
    desc: "Batch konversi format gambar lokal berkecepatan tinggi dengan kendali resolusi fleksibel, pengaturan kualitas kompresi presisi, dan ekspor arsip ZIP otomatis.",
    formats: ["PNG", "JPG", "WEBP", "BMP", "SVG", "GIF"],
    href: "/image",
    icon: ImageIcon,
    privacy: "100% In-Browser",
    weight: "featured",
    highlights: ["Multi-file batching", "ZIP packaging", "Zero cloud upload"],
  },
  {
    id: "favicon",
    title: "Favicon Pack Generator",
    badge: "Binary ICO & Multi-Resolution",
    engine: "Raw ICO Encoder",
    desc: "Cukup unggah satu file logo master. TokiConvert langsung merender seluruh set favicon standar industri: favicon.ico biner resmi (16, 32, 48px), PNG touch icon hingga 512px, webmanifest, dan cuplikan tag HTML siap salin.",
    formats: ["ICO", "PNG 16–512px", "WebManifest", "HTML Tags"],
    href: "/favicon",
    icon: Sparkles,
    privacy: "100% In-Browser",
    weight: "primary",
    highlights: ["Binary ICO header valid", "Apple touch icons", "ZIP download"],
  },
  {
    id: "video",
    title: "Video Converter",
    badge: "WebAssembly Multi-Threaded",
    engine: "FFmpeg WASM",
    desc: "Transcoding berkas video langsung di memori peramban tanpa mengorbankan privasi rekaman pribadi Anda ke server pihak ketiga. Mendukung konversi format dan reduksi resolusi.",
    formats: ["MP4", "WEBM", "MKV", "AVI", "MOV"],
    href: "/video",
    icon: Video,
    privacy: "100% In-Browser",
    weight: "primary",
    highlights: ["In-memory transcoding", "Cross-format remux", "Web Workers"],
  },
  {
    id: "audio",
    title: "Audio Converter",
    badge: "Web Audio & lamejs",
    engine: "lamejs Pure JS",
    desc: "Ekstraksi dan enkoding audio lokal langsung ke format MP3 murni dengan pemilihan bitrate stabil (128–320 kbps) menggunakan Web Audio API tanpa server perantara.",
    formats: ["WAV", "MP3", "OGG", "M4A"],
    href: "/audio",
    icon: Music,
    privacy: "100% In-Browser",
    weight: "secondary",
    highlights: ["Bitrate presets", "Fast encoding", "Private voice audio"],
  },
  {
    id: "document",
    title: "Document Converter",
    badge: "pdf-lib + Mammoth",
    engine: "pdf-lib & DOMPurify",
    desc: "Konversi berkas teks dan kumpulan gambar menjadi dokumen PDF berstandar ISO, serta pratinjau dokumen Word (.docx) ke representasi HTML bersih yang aman dari skrip berbahaya.",
    formats: ["TXT → PDF", "Images → PDF", "DOCX → HTML"],
    href: "/document",
    icon: FileText,
    privacy: "100% In-Browser",
    weight: "secondary",
    highlights: ["ISO 32000 compliant", "Client-side PDF render", "DOCX sanitization"],
  },
  {
    id: "media",
    title: "Media Downloader",
    badge: "SSRF-Protected Proxy",
    engine: "Next.js Route + HMAC",
    desc: "Utilitas penyemat dan pengunduh metadata media publik dengan proteksi ketat socket-pinning, sanitasi URL publik, dan tanda tangan kriptografis HMAC untuk mencegah eksploitasi jaringan privat.",
    formats: ["Direct URLs", "Safe Media Stream"],
    href: "/media",
    icon: DownloadCloud,
    privacy: "SSRF-Protected Proxy",
    weight: "secondary",
    highlights: ["Cryptographic token", "DNS pinning", "No private IP leakage"],
  },
];

/* ─── Hero Interactive Pipeline Simulator Data ────────────── */
const pipelineDemos = [
  {
    name: "Logo Vector",
    input: "brand-logo.svg",
    inputExt: "SVG",
    output: "favicon.ico + icons.zip",
    engine: "Raw ICO & Canvas",
    tech: "Favicon Generator",
    duration: "~140 ms",
    destination: "/favicon",
  },
  {
    name: "Kamera Foto",
    input: "capture_highres.jpg",
    inputExt: "JPG",
    output: "optimized_gallery.webp",
    engine: "Canvas API Engine",
    tech: "Image Converter",
    duration: "~85 ms",
    destination: "/image",
  },
  {
    name: "Video Klip",
    input: "screen_recording.mov",
    inputExt: "MOV",
    output: "stream_ready.mp4",
    engine: "FFmpeg WebAssembly",
    tech: "Video Converter",
    duration: "~1.2 s",
    destination: "/video",
  },
  {
    name: "Rekaman Suara",
    input: "interview_raw.wav",
    inputExt: "WAV",
    output: "podcast_master.mp3",
    engine: "Web Audio + lamejs",
    tech: "Audio Converter",
    duration: "~220 ms",
    destination: "/audio",
  },
];

const formatTickerList = [
  "PNG", "WEBP", "JPG", "ICO", "SVG", "MP4", "WEBM", "MKV", "MP3", "WAV", "OGG", "PDF", "DOCX", "ZIP"
];

/* ─── Landing Page Component ───────────────────────────────── */
export default function HomePage() {
  useScrollReveal();

  const [activeDemoIndex, setActiveDemoIndex] = useState(0);
  const activeDemo = pipelineDemos[activeDemoIndex];

  return (
    <div className="flex flex-col items-center w-full min-h-screen">

      {/* ═══════════════════════════════════════════════════
          1. HERO SECTION — Asimetris, Editorial, & Berbobot
      ═══════════════════════════════════════════════════ */}
      <section className="relative w-full max-w-5xl mx-auto px-4 sm:px-6 pt-8 sm:pt-14 pb-12 sm:pb-18">
        {/* Garis batas dekoratif aksen klasik */}
        <div
          aria-hidden="true"
          className="absolute left-0 top-6 bottom-6 w-px bg-gradient-to-b from-transparent via-[#D8CCB9] to-transparent hidden sm:block"
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          
          {/* Sisi Kiri: Headline & Identitas Wajib */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Pill Status */}
            <div className="anim-fade-in inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#344638]/10 border border-[#344638]/20 text-[#344638] text-xs font-mono font-medium">
              <span className="w-2 h-2 rounded-full bg-[#344638] anim-pulse-dot" aria-hidden="true" />
              <span>100% Client-Side · Nol Upload ke Server</span>
            </div>

            {/* WAJIB:
                # TokiConvert
                ## Konversi Berkas Cepat, & Rapi
            */}
            <div className="space-y-1">
              <h1 className="anim-fade-up delay-100 text-5xl sm:text-6xl lg:text-7xl font-serif font-bold text-[#332F29] tracking-tight leading-[1.05]">
                TokiConvert
              </h1>
              <h2 className="anim-fade-up delay-200 text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-[#A34F38] leading-tight">
                Konversi Berkas Cepat, &amp; Rapi
              </h2>
            </div>

            {/* Deskripsi Produk */}
            <p className="anim-fade-up delay-300 text-sm sm:text-base text-[#62584C] leading-relaxed max-w-xl">
              Platform utilitas pemrosesan media berbasis peramban modern. Ubah format gambar, hasilkan paket favicon lengkap, konversi audio, video, dan dokumen langsung di memori perangkat Anda tanpa mengorbankan privasi ke server eksternal.
            </p>

            {/* Tombol Aksi Utama */}
            <div className="anim-fade-up delay-400 flex flex-wrap gap-3 pt-1">
              <a
                href="#tools"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#A34F38] hover:bg-[#8B3F2A] text-[#FFFCF6] font-semibold text-sm transition-all shadow-sm hover:shadow-md hover:-translate-y-px focus:outline-none focus-visible:ring-2 focus-visible:ring-[#A34F38]"
              >
                <span>Pilih Utilitas Konversi</span>
                <ArrowRight size={16} aria-hidden="true" />
              </a>

              <Link
                href="/image"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#D8CCB9] bg-[#FFFCF6]/80 hover:bg-[#FFFCF6] text-[#332F29] font-medium text-sm transition-all hover:-translate-y-px focus:outline-none focus-visible:ring-2 focus-visible:ring-[#A34F38]"
              >
                <ImageIcon size={16} className="text-[#A34F38]" aria-hidden="true" />
                <span>Image Converter</span>
              </Link>

              <Link
                href="/favicon"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#D8CCB9] bg-[#FFFCF6]/80 hover:bg-[#FFFCF6] text-[#332F29] font-medium text-sm transition-all hover:-translate-y-px focus:outline-none focus-visible:ring-2 focus-visible:ring-[#A34F38]"
              >
                <Sparkles size={16} className="text-[#A34F38]" aria-hidden="true" />
                <span>Favicon Generator</span>
              </Link>
            </div>

            {/* Jaminan Teknis Ringkas */}
            <div className="anim-fade-up delay-500 pt-3 border-t border-[#D8CCB9]/70 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-[#62584C]">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-[#344638]" aria-hidden="true" />
                <span>Tanpa Akun &amp; Langganan</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-[#344638]" aria-hidden="true" />
                <span>Arsip ZIP Seketika</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-[#344638]" aria-hidden="true" />
                <span>Lisensi Terbuka MIT</span>
              </span>
            </div>
          </div>

          {/* Sisi Kanan: Interactive Pipeline Simulator */}
          <div className="lg:col-span-5 anim-slide-right delay-300">
            <div className="relative bg-[#FFFCF6] border border-[#D8CCB9] rounded-2xl p-5 shadow-xs overflow-hidden">
              
              {/* Header Kartu Simulator */}
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#D8CCB9]/70">
                <div className="flex items-center gap-1.5" aria-hidden="true">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#A34F38]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#D4B98A]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#344638]" />
                  <span className="ml-2 text-[11px] font-mono font-medium text-[#62584C]">
                    pipeline.simulator
                  </span>
                </div>
                <span className="text-[10px] font-mono text-[#344638] font-semibold bg-[#344638]/10 px-2 py-0.5 rounded border border-[#344638]/20">
                  Client Memory
                </span>
              </div>

              {/* Selector Demo */}
              <div className="space-y-1 mb-4">
                <p className="text-[11px] font-mono text-[#62584C] uppercase tracking-wider">
                  Pilih Simulasi Pipeline:
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {pipelineDemos.map((demo, idx) => (
                    <button
                      key={demo.name}
                      type="button"
                      onClick={() => setActiveDemoIndex(idx)}
                      className={`text-left px-2.5 py-1.5 rounded-md text-xs font-mono transition-all flex items-center justify-between ${
                        activeDemoIndex === idx
                          ? "bg-[#A34F38] text-[#FFFCF6] font-semibold shadow-2xs"
                          : "bg-[#F4EBDD] text-[#62584C] hover:bg-[#EBDDC8]"
                      }`}
                    >
                      <span>{demo.name}</span>
                      <span className="text-[10px] opacity-80">.{demo.inputExt.toLowerCase()}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Diagram Alur Input -> Engine -> Output */}
              <div className="p-3.5 rounded-xl bg-[#F4EBDD]/60 border border-[#D8CCB9] space-y-3">
                {/* Input Step */}
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[#62584C]">Berkas Masuk:</span>
                  <span className="font-semibold text-[#332F29] bg-[#FFFCF6] px-2 py-0.5 rounded border border-[#D8CCB9]">
                    {activeDemo.input}
                  </span>
                </div>

                {/* Processing Step */}
                <div className="relative py-1">
                  <div className="h-px bg-gradient-to-r from-[#D8CCB9] via-[#A34F38]/40 to-[#D8CCB9] relative" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="bg-[#FFFCF6] px-2.5 py-0.5 rounded-full border border-[#D4B98A] text-[10px] font-mono text-[#A34F38] font-semibold shadow-2xs flex items-center gap-1">
                      <RefreshCw size={10} className="animate-spin" aria-hidden="true" />
                      <span>{activeDemo.engine}</span>
                    </span>
                  </div>
                </div>

                {/* Output Step */}
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[#62584C]">Hasil Render:</span>
                  <span className="font-semibold text-[#344638] bg-[#344638]/10 px-2 py-0.5 rounded border border-[#344638]/20">
                    {activeDemo.output}
                  </span>
                </div>
              </div>

              {/* Footer Panel dengan Tautan Langsung */}
              <div className="mt-4 pt-3 border-t border-[#D8CCB9]/70 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-[#62584C] block">Estimasi Kecepatan:</span>
                  <span className="text-xs font-mono font-semibold text-[#332F29]">{activeDemo.duration}</span>
                </div>
                <Link
                  href={activeDemo.destination}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#332F29] hover:bg-[#201D1A] text-[#FFFCF6] text-xs font-medium transition-colors"
                >
                  <span>Buka {activeDemo.tech}</span>
                  <ArrowUpRight size={13} aria-hidden="true" />
                </Link>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          2. FORMAT TICKER — Halus & Fungsional
      ═══════════════════════════════════════════════════ */}
      <div
        className="w-full border-y border-[#D8CCB9] bg-[#FFFCF6]/60 overflow-hidden py-2.5"
        aria-hidden="true"
      >
        <div className="flex gap-0">
          {[0, 1].map((copy) => (
            <div key={copy} className="anim-marquee flex shrink-0 gap-6 pr-6">
              {[...formatTickerList, ...formatTickerList].map((fmt, idx) => (
                <span
                  key={`${copy}-${idx}`}
                  className="text-[11px] font-mono text-[#62584C]/80 uppercase tracking-widest whitespace-nowrap flex items-center gap-3"
                >
                  <span className="font-semibold text-[#332F29]">{fmt}</span>
                  <span className="text-[#D8CCB9]">·</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          3. FEATURED TOOLS DIRECTORY — Pengenalan Lengkap Semua Tool
      ═══════════════════════════════════════════════════ */}
      <section
        id="tools"
        className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-14 sm:py-20 scroll-mt-20"
      >
        {/* Section Header */}
        <div className="reveal flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 pb-4 border-b border-[#D8CCB9]">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-[0.14em] text-[#A34F38] font-semibold">
              Katalog Utilitas Lengkap
            </span>
            <h2 className="mt-1 text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-[#332F29]">
              Direktori Alat TokiConvert
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-[#62584C] max-w-sm sm:text-right">
            Pilih utilitas yang Anda butuhkan di bawah ini. Masing-masing memiliki halaman workspace khusus yang terisolasi dan siap pakai.
          </p>
        </div>

        {/* Directory Grid Berhierarki */}
        <div className="space-y-4 sm:space-y-6">

          {/* 1. Featured Utama: Image Converter */}
          {toolsDirectory.filter(t => t.weight === "featured").map((tool) => {
            const Icon = tool.icon;
            return (
              <div
                key={tool.id}
                className="reveal group relative bg-[#FFFCF6] border border-[#D8CCB9] rounded-2xl p-6 sm:p-8 hover:border-[#A34F38]/60 hover:shadow-sm transition-all duration-300 overflow-hidden"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
                  <div className="space-y-3 max-w-2xl">
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="w-12 h-12 rounded-xl bg-[#A34F38]/10 border border-[#A34F38]/20 flex items-center justify-center text-[#A34F38] shrink-0 group-hover:scale-105 transition-transform">
                        <Icon size={24} aria-hidden="true" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#332F29] group-hover:text-[#A34F38] transition-colors">
                            {tool.title}
                          </h3>
                          <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-semibold bg-[#344638]/10 text-[#344638] border border-[#344638]/20">
                            {tool.badge}
                          </span>
                        </div>
                        <span className="text-xs font-mono text-[#62584C]/80">Engine: {tool.engine}</span>
                      </div>
                    </div>

                    <p className="text-sm text-[#62584C] leading-relaxed">
                      {tool.desc}
                    </p>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {tool.formats.map((fmt) => (
                        <span
                          key={fmt}
                          className="px-2 py-0.5 rounded bg-[#F4EBDD] border border-[#D8CCB9] text-[11px] font-mono font-medium text-[#332F29]"
                        >
                          {fmt}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* CTA Card Button */}
                  <div className="shrink-0 flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-3 pt-2 lg:pt-0 border-t lg:border-t-0 border-[#D8CCB9]/70">
                    <span className="text-xs font-mono text-[#344638] font-semibold flex items-center gap-1.5">
                      <ShieldCheck size={14} aria-hidden="true" />
                      <span>{tool.privacy}</span>
                    </span>
                    <Link
                      href={tool.href}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#A34F38] hover:bg-[#8B3F2A] text-[#FFFCF6] font-semibold text-sm transition-all shadow-2xs hover:shadow-sm hover:-translate-y-px focus:outline-none focus-visible:ring-2 focus-visible:ring-[#A34F38]"
                    >
                      <span>Buka Image Converter</span>
                      <ArrowRight size={15} aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}

          {/* 2. Primary Tools: 2 Kolom (Favicon Pack Generator & Video Converter) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {toolsDirectory.filter(t => t.weight === "primary").map((tool) => {
              const Icon = tool.icon;
              return (
                <div
                  key={tool.id}
                  className="reveal group bg-[#FFFCF6] border border-[#D8CCB9] rounded-2xl p-6 hover:border-[#A34F38]/50 hover:shadow-xs transition-all duration-300 flex flex-col justify-between gap-5"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#F4EBDD] border border-[#D8CCB9] flex items-center justify-center text-[#A34F38] group-hover:scale-105 transition-transform shrink-0">
                        <Icon size={20} aria-hidden="true" />
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#344638]/10 text-[#344638] border border-[#344638]/20">
                        {tool.badge}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-lg sm:text-xl font-serif font-bold text-[#332F29] group-hover:text-[#A34F38] transition-colors">
                        {tool.title}
                      </h3>
                      <p className="mt-1 text-xs sm:text-sm text-[#62584C] leading-relaxed">
                        {tool.desc}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {tool.formats.map((fmt) => (
                        <span
                          key={fmt}
                          className="px-2 py-0.5 rounded bg-[#F4EBDD]/70 border border-[#D8CCB9] text-[10px] font-mono font-medium text-[#332F29]"
                        >
                          {fmt}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#D8CCB9]/70 flex items-center justify-between">
                    <span className="text-[11px] font-mono text-[#62584C]">
                      {tool.privacy}
                    </span>
                    <Link
                      href={tool.href}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#A34F38] hover:text-[#8B3F2A] hover:underline"
                    >
                      <span>Buka Workspace</span>
                      <ArrowRight size={13} aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 3. Secondary Tools: 3 Kolom (Audio, Document, Media) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {toolsDirectory.filter(t => t.weight === "secondary").map((tool) => {
              const Icon = tool.icon;
              return (
                <div
                  key={tool.id}
                  className="reveal group bg-[#FFFCF6]/80 border border-[#D8CCB9] rounded-xl p-5 hover:bg-[#FFFCF6] hover:border-[#A34F38]/40 transition-all duration-300 flex flex-col justify-between gap-4"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="w-8 h-8 rounded-lg bg-[#F4EBDD] flex items-center justify-center text-[#62584C] group-hover:text-[#A34F38] transition-colors shrink-0">
                        <Icon size={16} aria-hidden="true" />
                      </div>
                      <span className="text-[10px] font-mono text-[#62584C]/80">{tool.badge}</span>
                    </div>

                    <h3 className="text-base font-serif font-bold text-[#332F29] group-hover:text-[#A34F38] transition-colors">
                      {tool.title}
                    </h3>

                    <p className="text-xs text-[#62584C] leading-relaxed">
                      {tool.desc}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-[#D8CCB9]/60 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-[#344638] font-medium">
                      {tool.privacy}
                    </span>
                    <Link
                      href={tool.href}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#A34F38] hover:underline"
                    >
                      <span>Akses</span>
                      <ArrowRight size={12} aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          4. ARSITEKTUR & PRIVASI — Mengapa TokiConvert Berbeda
      ═══════════════════════════════════════════════════ */}
      <section className="w-full bg-[#332F29] text-[#FFFCF6] py-14 sm:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-12">
          
          {/* Header Section */}
          <div className="reveal flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#FFFCF6]/15 pb-6">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-[0.14em] text-[#D4B98A] font-semibold">
                Paradigma Arsitektur
              </span>
              <h2 className="mt-1 text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-[#FFFCF6]">
                Mengapa Pemrosesan Sisi-Klien Penting?
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[#FFFCF6]/70 max-w-sm sm:text-right leading-relaxed">
              Sebagian besar konverter web mengunggah berkas rahasia Anda ke server terpusat. TokiConvert memutus alur tersebut sepenuhnya.
            </p>
          </div>

          {/* Perbandingan 2 Kolom: Cloud vs TokiConvert */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 reveal-stagger">
            
            {/* Kolom Tradisional Cloud */}
            <div className="p-6 rounded-2xl bg-[#FFFCF6]/5 border border-[#FFFCF6]/10 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#FFFCF6]/10">
                <span className="text-xs font-mono uppercase tracking-wider text-[#FFFCF6]/60 font-semibold">
                  Konverter Awan Tradisional
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#A34F38]/20 text-[#A34F38] border border-[#A34F38]/30">
                  Risiko Privasi
                </span>
              </div>
              <ul className="space-y-3 text-xs sm:text-sm text-[#FFFCF6]/70">
                <li className="flex items-start gap-2.5">
                  <span className="text-[#A34F38] font-bold">✕</span>
                  <span><strong>Unggah Berkas Utuh:</strong> Foto, rekaman, atau dokumen Anda dikirim melintasi internet ke server pihak ketiga.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-[#A34F38] font-bold">✕</span>
                  <span><strong>Antrean &amp; Kuota:</strong> Dibatasi batas ukuran harian, antrean lambat, atau dipaksa berlangganan akun berbayar.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-[#A34F38] font-bold">✕</span>
                  <span><strong>Penyimpanan Sementara di Server:</strong> Risiko kebocoran berkas dari sisa cache penyimpanan penyedia.</span>
                </li>
              </ul>
            </div>

            {/* Kolom TokiConvert */}
            <div className="p-6 rounded-2xl bg-[#344638]/25 border border-[#344638]/50 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#344638]/30">
                <span className="text-xs font-mono uppercase tracking-wider text-[#D4B98A] font-semibold">
                  Arsitektur TokiConvert
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#344638] text-[#FFFCF6] border border-[#344638]">
                  Zero Upload
                </span>
              </div>
              <ul className="space-y-3 text-xs sm:text-sm text-[#FFFCF6]/90">
                <li className="flex items-start gap-2.5">
                  <span className="text-[#D4B98A] font-bold">✓</span>
                  <span><strong>100% Eksekusi Lokal:</strong> Konversi berjalan di memori browser Anda menggunakan WebAssembly, Canvas API, dan Web Workers.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-[#D4B98A] font-bold">✓</span>
                  <span><strong>Tanpa Batas Kuota:</strong> Bebas memproses berkas sebanyak yang didukung oleh kemampuan perangkat keras Anda sendiri.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-[#D4B98A] font-bold">✓</span>
                  <span><strong>Nol Jejak Server:</strong> File Anda tidak pernah menyentuh hard drive siapapun selain komputer Anda.</span>
                </li>
              </ul>
            </div>

          </div>

          {/* Pilar Teknologi Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-[#FFFCF6]/10">
            <div className="p-4 rounded-xl bg-[#FFFCF6]/5 border border-[#FFFCF6]/10">
              <HardDrive size={18} className="text-[#D4B98A] mb-2" aria-hidden="true" />
              <h3 className="text-sm font-serif font-bold text-[#FFFCF6]">WebAssembly</h3>
              <p className="mt-1 text-xs text-[#FFFCF6]/60">FFmpeg dikompilasi ke WASM untuk transcoding audio &amp; video langsung di peramban.</p>
            </div>
            <div className="p-4 rounded-xl bg-[#FFFCF6]/5 border border-[#FFFCF6]/10">
              <Cpu size={18} className="text-[#D4B98A] mb-2" aria-hidden="true" />
              <h3 className="text-sm font-serif font-bold text-[#FFFCF6]">Canvas API</h3>
              <p className="mt-1 text-xs text-[#FFFCF6]/60">Rasterisasi dan kompresi gambar berbasis GPU lokal berkecepatan tinggi.</p>
            </div>
            <div className="p-4 rounded-xl bg-[#FFFCF6]/5 border border-[#FFFCF6]/10">
              <Layers size={18} className="text-[#D4B98A] mb-2" aria-hidden="true" />
              <h3 className="text-sm font-serif font-bold text-[#FFFCF6]">pdf-lib &amp; lamejs</h3>
              <p className="mt-1 text-xs text-[#FFFCF6]/60">Sintesis dokumen PDF dan enkoder MP3 murni JavaScript tanpa dependensi native backend.</p>
            </div>
            <div className="p-4 rounded-xl bg-[#FFFCF6]/5 border border-[#FFFCF6]/10">
              <Lock size={18} className="text-[#D4B98A] mb-2" aria-hidden="true" />
              <h3 className="text-sm font-serif font-bold text-[#FFFCF6]">HMAC Token Pinning</h3>
              <p className="mt-1 text-xs text-[#FFFCF6]/60">Proxy media eksternal dilindungi socket-pinning dan token bertanda tangan untuk mencegah SSRF.</p>
            </div>
          </div>

        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          5. ALUR KERJA SEDERHANA (3 Langkah)
      ═══════════════════════════════════════════════════ */}
      <section className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
        <div className="text-center max-w-xl mx-auto mb-10">
          <span className="text-[11px] font-mono uppercase tracking-[0.14em] text-[#A34F38] font-semibold">
            Alur Penggunaan
          </span>
          <h2 className="mt-1 text-2xl sm:text-3xl font-serif font-bold text-[#332F29]">
            Cara Kerja TokiConvert
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-[#62584C]">
            Dirancang ringkas agar Anda dapat segera menyelesaikan pekerjaan tanpa langkah yang bertele-tele.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {/* Langkah 1 */}
          <div className="p-6 rounded-2xl bg-[#FFFCF6] border border-[#D8CCB9] space-y-3 relative hover:shadow-xs transition-shadow">
            <span className="text-3xl font-serif font-bold text-[#A34F38]/30">01</span>
            <h3 className="text-base font-serif font-bold text-[#332F29]">Pilih Utilitas</h3>
            <p className="text-xs text-[#62584C] leading-relaxed">
              Buka alat yang Anda butuhkan melalui Navbar atau Direktori: Gambar, Favicon, Video, Audio, Dokumen, atau Media Downloader.
            </p>
          </div>

          {/* Langkah 2 */}
          <div className="p-6 rounded-2xl bg-[#FFFCF6] border border-[#D8CCB9] space-y-3 relative hover:shadow-xs transition-shadow">
            <span className="text-3xl font-serif font-bold text-[#A34F38]/30">02</span>
            <h3 className="text-base font-serif font-bold text-[#332F29]">Tarik &amp; Sesuaikan</h3>
            <p className="text-xs text-[#62584C] leading-relaxed">
              Tarik berkas Anda ke area workspace. Sesuaikan resolusi, target format, dan kualitas kompresi sesuai kebutuhan Anda.
            </p>
          </div>

          {/* Langkah 3 */}
          <div className="p-6 rounded-2xl bg-[#FFFCF6] border border-[#D8CCB9] space-y-3 relative hover:shadow-xs transition-shadow">
            <span className="text-3xl font-serif font-bold text-[#A34F38]/30">03</span>
            <h3 className="text-base font-serif font-bold text-[#332F29]">Unduh Seketika</h3>
            <p className="text-xs text-[#62584C] leading-relaxed">
              Dapatkan berkas hasil konversi secara tunggal atau unduh seluruh batch dalam satu arsip ZIP siap pakai.
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          6. FAQ RINGKAS & RELEVAN
      ═══════════════════════════════════════════════════ */}
      <section className="w-full bg-[#F4EBDD]/60 border-t border-[#D8CCB9] py-14 sm:py-18">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="text-center max-w-xl mx-auto">
            <span className="text-[11px] font-mono uppercase tracking-[0.14em] text-[#A34F38] font-semibold">
              Pertanyaan Umum
            </span>
            <h2 className="mt-1 text-2xl sm:text-3xl font-serif font-bold text-[#332F29]">
              Kerap Ditanyakan
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className="p-5 rounded-xl bg-[#FFFCF6] border border-[#D8CCB9] space-y-2">
              <h3 className="text-sm font-serif font-bold text-[#332F29]">Apakah berkas saya aman dari kebocoran?</h3>
              <p className="text-xs text-[#62584C] leading-relaxed">
                Ya. Seluruh berkas gambar, audio, video, dan dokumen diproses di dalam browser Anda sendiri. Tidak ada berkas yang dikirim ke server cloud kami.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-[#FFFCF6] border border-[#D8CCB9] space-y-2">
              <h3 className="text-sm font-serif font-bold text-[#332F29]">Apakah ada batasan kuota harian atau ukuran?</h3>
              <p className="text-xs text-[#62584C] leading-relaxed">
                Tidak ada batasan buatan dari kami. Batasan hanya ditentukan oleh kapasitas RAM dan kemampuan prosesor perangkat yang Anda gunakan.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-[#FFFCF6] border border-[#D8CCB9] space-y-2">
              <h3 className="text-sm font-serif font-bold text-[#332F29]">Bagaimana Favicon Pack Generator bekerja?</h3>
              <p className="text-xs text-[#62584C] leading-relaxed">
                Favicon Generator menghasilkan file binary ICO resmi yang berisi layer resolusi 16x16, 32x32, dan 48x48, ditambah icon PNG hingga 512px dan manifest web lengkap dalam satu ZIP.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-[#FFFCF6] border border-[#D8CCB9] space-y-2">
              <h3 className="text-sm font-serif font-bold text-[#332F29]">Apakah TokiConvert gratis dan open-source?</h3>
              <p className="text-xs text-[#62584C] leading-relaxed">
                TokiConvert sepenuhnya gratis, bebas iklan invasif, dan dirilis di bawah lisensi terbuka MIT di GitHub.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          7. CLOSING BANNER — Tautan & Komunitas
      ═══════════════════════════════════════════════════ */}
      <section className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
        <div className="reveal p-8 sm:p-12 rounded-2xl bg-gradient-to-br from-[#FFFCF6] to-[#F4EBDD] border border-[#D8CCB9] flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs">
          <div className="space-y-2 max-w-xl">
            <span className="text-xs font-mono uppercase tracking-wider text-[#A34F38] font-semibold">
              Mulai Eksplorasi
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#332F29]">
              Siap Mengonversi Berkas Anda?
            </h2>
            <p className="text-xs sm:text-sm text-[#62584C] leading-relaxed">
              Buka alat yang Anda perlukan dan nikmati konversi media yang cepat, rapi, dan terbebas dari kekhawatiran privasi.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              href="/image"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#A34F38] hover:bg-[#8B3F2A] text-[#FFFCF6] font-semibold text-sm transition-all shadow-2xs hover:shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-[#A34F38]"
            >
              <span>Image Converter</span>
              <ArrowRight size={15} aria-hidden="true" />
            </Link>

            <Link
              href="/about"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#D8CCB9] bg-[#FFFCF6] hover:bg-[#F4EBDD] text-[#332F29] font-medium text-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#A34F38]"
            >
              <span>Tentang Kami</span>
            </Link>

            <a
              href="https://github.com/Tokitakun/TokiConvert"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#344638] hover:bg-[#253328] text-[#FFFCF6] font-medium text-sm transition-all shadow-2xs focus:outline-none focus-visible:ring-2 focus-visible:ring-[#344638]"
            >
              <GitBranch size={15} aria-hidden="true" />
              <span>GitHub</span>
            </a>
          </div>
        </div>
      </section>

    </div>
  );
}
