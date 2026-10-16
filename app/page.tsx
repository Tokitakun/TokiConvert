"use client";
import { validateBatch } from "./lib/validation";
import DragDropArea from "./components/DragDropArea"
import Navbar from "./components/Navbar";






export default function Home() {
  return (
    <div className="flex flex-col items-center min-h-screen bg-[#F7F4EE] p-6">
      <Navbar />
      <section className="w-full max-w-5xl mt-12">
        <div className="text-center mb-10">
          <p className="text-sm text-[#625C53]">IMAGE CONVERTER</p>
          <h1 className="text-5xl font-bold text-[#302E29]">Convert your images</h1>
          <p className="mt-4 text-[#625C53]">Convert image formats in a few simple steps.</p>
        </div>
        <DragDropArea onValidate={validateBatch} />
      </section>
    </div>
  );
}



