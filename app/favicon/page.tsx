import type { Metadata } from "next";
import FaviconGeneratorWorkspace from "../components/FaviconGeneratorWorkspace";

export const metadata: Metadata = {
  title: "Favicon Pack Generator — TokiConvert",
  description:
    "Unggah satu logo dan hasilkan paket favicon lengkap (favicon.ico, PNG multi-resolusi, webmanifest, dan tag HTML) dalam satu file ZIP secara instan dan privat di browser.",
};

export default function FaviconPage() {
  return (
    <div className="flex flex-col items-center w-full px-4 sm:px-6 py-8 sm:py-12">
      <section className="w-full max-w-5xl">
        <div className="text-center mb-8 sm:mb-10 space-y-2">
          <p className="text-xs font-semibold tracking-wider uppercase text-[#A34F38]">
            FAVICON PACK GENERATOR · CLIENT-SIDE UTILITY
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-[#332F29] tracking-tight">
            Favicon Pack Generator
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-[#62584C] max-w-xl mx-auto leading-relaxed">
            Cukup unggah satu logo. Aplikasi akan otomatis menghasilkan seluruh variasi ikon web (ICO, PNG 16px hingga 512px, WebManifest, dan panduan tag HTML) dalam satu arsip ZIP siap pakai.
          </p>
        </div>

        <FaviconGeneratorWorkspace />
      </section>
    </div>
  );
}
