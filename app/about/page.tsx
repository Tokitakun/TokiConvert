"use client";

export default function AboutPage() {
  return (
    <section className="max-w-5xl mx-auto p-6 bg-[#FFFEFB] rounded-lg border border-[#D8D0C4]">
      <h1 className="text-3xl font-bold mb-4" style={{ color: '#302E29' }}>About TokiConvert</h1>
      <p className="text-[#625C53]">
        Open‑source image conversion utility built with Next.js and Tailwind CSS. Upload images, adjust format, dimensions, and quality, then download results individually or as a ZIP archive.
      </p>
    </section>
  );
}
