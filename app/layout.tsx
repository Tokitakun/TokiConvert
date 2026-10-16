import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Navbar from "./components/Navbar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TokiConvert — Konversi Gambar Sederhana & Privat",
  description: "Aplikasi konversi gambar berbasis web yang cepat, mudah digunakan, dan memprioritaskan privasi di sisi klien.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#F7F4EE] text-[#302E29]">
        <Navbar />
        <main className="flex-1 w-full flex flex-col">{children}</main>
      </body>
    </html>
  );
}

