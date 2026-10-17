"use client";

import ConverterWorkspace from "../components/ConverterWorkspace";
import { validateBatch } from "../lib/validation";

export default function ImageConverterPage() {
  return (
    <div className="flex flex-col items-center w-full px-4 sm:px-6 py-8 sm:py-12">
      <section className="w-full max-w-5xl">
        <div className="text-center mb-8 sm:mb-10 space-y-2">
          <p className="text-xs font-semibold tracking-wider uppercase text-[#A34F38]">
            IMAGE CONVERTER · CLIENT-SIDE CANVAS API
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-[#332F29] tracking-tight">
            Image Converter
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-[#62584C] max-w-xl mx-auto leading-relaxed">
            Batch konversi format gambar lokal (PNG, JPG, WebP, BMP, GIF, SVG) langsung di browser Anda dengan kontrol resolusi, penyesuaian kualitas kompresi, dan ekspor arsip ZIP tanpa upload ke server.
          </p>
        </div>

        <ConverterWorkspace onValidate={validateBatch} />
      </section>
    </div>
  );
}
