"use client";

import AudioConverterWorkspace from "../components/AudioConverterWorkspace";

export default function AudioConverterPage() {
  return (
    <div className="flex flex-col items-center w-full px-4 sm:px-6 py-8 sm:py-12">
      <section className="w-full max-w-5xl">
        <div className="text-center mb-10 space-y-2">
          <p className="text-xs font-semibold tracking-wider uppercase text-[#A34F38]">
            AUDIO CONVERTER · CLIENT-SIDE WASM &amp; WEB AUDIO
          </p>
          <h1 className="text-4xl sm:text-5xl font-serif font-bold text-[#332F29] tracking-tight">
            Audio Converter
          </h1>
          <p className="text-sm sm:text-base text-[#62584C] max-w-lg mx-auto">
            Konversi format audio lokal (WAV, MP3, OGG) langsung di browser secara privat tanpa upload ke server.
          </p>
        </div>
        <AudioConverterWorkspace />
      </section>
    </div>
  );
}
