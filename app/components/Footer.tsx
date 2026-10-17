import Link from "next/link";
import { ShieldCheck, GitBranch, FileText } from "lucide-react";

export default function Footer() {
  return (
    <footer className="w-full border-t border-[#D8CCB9] bg-[#F4EBDD] mt-auto">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 pb-6 border-b border-[#D8CCB9]/70">
          {/* Kolom 1: Brand & Filosofi */}
          <div className="space-y-2.5">
            <div className="inline-flex items-center text-lg sm:text-xl font-serif font-bold tracking-tight">
              <span className="text-[#344638]">Toki</span>
              <span className="text-[#332F29]">Convert</span>
            </div>
            <p className="text-xs sm:text-sm text-[#62584C] leading-relaxed">
              Utilitas konversi media berbasis web dengan estetika klasik. Berkas diproses langsung di peramban Anda dengan mengutamakan privasi tanpa unggah ke server.
            </p>
            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-[#344638]/10 text-[#344638] text-[11px] font-medium border border-[#344638]/20">
              <ShieldCheck size={13} aria-hidden="true" />
              <span>Client-Side Privacy First</span>
            </div>
          </div>

          {/* Kolom 2: Navigasi Internal */}
          <div className="space-y-2.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#332F29]">
              Navigasi Utilitas
            </p>
            <ul className="space-y-1.5 text-xs sm:text-sm text-[#62584C]">
              <li>
                <Link
                  href="/"
                  className="hover:text-[#A34F38] hover:underline transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-[#A34F38] rounded"
                >
                  Image Converter
                </Link>
              </li>
              <li>
                <Link
                  href="/audio"
                  className="hover:text-[#A34F38] hover:underline transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-[#A34F38] rounded"
                >
                  Audio Converter
                </Link>
              </li>
              <li>
                <Link
                  href="/document"
                  className="hover:text-[#A34F38] hover:underline transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-[#A34F38] rounded"
                >
                  Document Converter
                </Link>
              </li>
              <li>
                <Link
                  href="/media"
                  className="hover:text-[#A34F38] hover:underline transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-[#A34F38] rounded"
                >
                  Media Tools &amp; Downloader
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="hover:text-[#A34F38] hover:underline transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-[#A34F38] rounded"
                >
                  About &amp; Architecture Notes
                </Link>
              </li>
            </ul>
          </div>

          {/* Kolom 3: Open Source & Lisensi */}
          <div className="space-y-2.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#332F29]">
              Dokumentasi &amp; Sumber Kode
            </p>
            <ul className="space-y-1.5 text-xs sm:text-sm text-[#62584C]">
              <li>
                <a
                  href="https://github.com/Tokitakun/TokiConvert"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 hover:text-[#A34F38] hover:underline transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-[#A34F38] rounded"
                  aria-label="GitHub Repository TokiConvert (buka di tab baru)"
                >
                  <GitBranch size={13} aria-hidden="true" />
                  <span>GitHub Repository</span>
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/Tokitakun/TokiConvert/blob/main/LICENSE"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 hover:text-[#A34F38] hover:underline transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-[#A34F38] rounded"
                  aria-label="Lisensi MIT TokiConvert (buka di tab baru)"
                >
                  <FileText size={13} aria-hidden="true" />
                  <span>Lisensi (MIT)</span>
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/Tokitakun/TokiConvert/blob/main/CONTRIBUTING.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 hover:text-[#A34F38] hover:underline transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-[#A34F38] rounded"
                  aria-label="Panduan Kontribusi TokiConvert (buka di tab baru)"
                >
                  <FileText size={13} aria-hidden="true" />
                  <span>Panduan Kontribusi</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Baris Bawah: Hak Cipta & Catatan */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#62584C]">
          <p>
            &copy; 2026 TokiConvert. Open-source under MIT License.
          </p>
          <p className="flex items-center gap-1 text-[11px] text-[#62584C]/80">
            Dibuat dengan dedikasi untuk utilitas web yang bersih dan menghormati privasi.
          </p>
        </div>
      </div>
    </footer>
  );
}
