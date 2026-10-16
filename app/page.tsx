"use client";
import { validateBatch } from "./lib/validation";
import ConverterWorkspace from "./components/ConverterWorkspace";

export default function Home() {
  return (
    <div className="flex flex-col items-center w-full px-4 sm:px-6 py-8">
      <section className="w-full max-w-5xl mt-4 sm:mt-6">
        <div className="text-center mb-10">
          <p className="text-xs font-semibold tracking-wider uppercase text-[#625C53]">IMAGE CONVERTER</p>
          <h1 className="text-4xl sm:text-5xl font-bold text-[#302E29] tracking-tight mt-1">Convert your images</h1>
          <p className="mt-3 text-sm sm:text-base text-[#625C53]">Convert image formats in a few simple steps.</p>
        </div>
        <ConverterWorkspace onValidate={validateBatch} />
      </section>
    </div>
  );
}



