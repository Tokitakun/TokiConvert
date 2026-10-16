"use client";


import { Github } from "lucide-react";

export default function Navbar() {
  return (
    <nav className="flex items-center justify-between max-w-5xl mx-auto h-16 border-b border-[#D8D0C4] bg-[#F7F4EE] px-4">
      <div className="text-2xl font-bold" style={{ color: '#34483D' }}>
        toki <span style={{ color: '#302E29' }}>convert</span>
      </div>
      <div className="flex space-x-4 items-center">
        <a href="/about" className="text-sm text-[#625C53] hover:text-[#302E29] focus:outline-none focus:ring-2 focus:ring-[#A9573F]">About</a>
      </div>
    </nav>
  );
}
