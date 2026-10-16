"use client";
import { validateBatch } from "./lib/validation";
import ConverterWorkspace from "./components/ConverterWorkspace";

export default function Home() {
  return (
    <div className="flex flex-col items-center w-full px-4 sm:px-6 py-8 sm:py-12">
      <section className="w-full max-w-5xl">
        <div className="text-center mb-10 space-y-2">
          <p className="text-xs font-semibold tracking-wider uppercase text-[#A34F38]">
            IMAGE CONVERTER · CLIENT-SIDE UTILITY
          </p>
          <h1 className="text-4xl sm:text-5xl font-serif font-bold text-[#332F29] tracking-tight">
            Convert your images
          </h1>
          <p className="text-sm sm:text-base text-[#62584C] max-w-lg mx-auto">
            Ubah format gambar dengan cepat dan aman langsung di browser Anda tanpa upload ke server.
          </p>
        </div>
        <ConverterWorkspace onValidate={validateBatch} />
      </section>
    </div>
  );
}



