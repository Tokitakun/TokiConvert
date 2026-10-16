"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: "Image Converter", href: "/" },
    { name: "About", href: "/about" },
  ];

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen((prev) => !prev);
  };

  return (
    <nav className="w-full border-b border-[#D8D0C4] bg-[#F7F4EE] sticky top-0 z-40">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand / Wordmark */}
        <Link
          href="/"
          onClick={closeMobileMenu}
          className="text-xl sm:text-2xl font-bold tracking-tight focus:outline-none focus-visible:ring-2 focus-visible:ring-[#A9573F] focus-visible:ring-offset-2 rounded"
          aria-label="TokiConvert Home"
        >
          <span className="text-[#34483D]">Toki</span>
          <span className="text-[#302E29]">Convert</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive ? "page" : undefined}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#A9573F] ${
                  isActive
                    ? "text-[#A9573F] bg-[#E9E0D3]/60 font-semibold"
                    : "text-[#625C53] hover:text-[#302E29] hover:bg-[#E9E0D3]/30"
                }`}
              >
                {link.name}
              </Link>
            );
          })}

          {/* External GitHub Link */}
          <a
            href="https://github.com/Tokitakun/TokiConvert"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1.5 px-3 py-2 rounded-md text-sm font-medium text-[#625C53] hover:text-[#302E29] hover:bg-[#E9E0D3]/30 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#A9573F]"
            aria-label="GitHub Repository (buka di tab baru)"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              className="w-4 h-4 fill-current"
              aria-hidden="true"
            >
              <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.09 3.29 9.39 7.86 10.92.58.1.79-.25.79-.56 0-.28-.01-1.02-.01-2-3.19.69-3.86-1.54-3.86-1.54-.53-1.35-1.3-1.71-1.3-1.71-1.07-.73.08-.71.08-.71 1.19.08 1.82 1.22 1.82 1.22 1.05 1.8 2.76 1.28 3.44.98.1-.77.41-1.28.75-1.57-2.55-.29-5.23-1.28-5.23-5.71 0-1.26.45-2.29 1.2-3.1-.12-.3-.52-1.51.11-3.14 0 0 .98-.31 3.2 1.18a11.12 11.12 0 012.92-.39c.99.01 2 .13 2.92.39 2.22-1.5 3.2-1.18 3.2-1.18.64 1.63.24 2.84.12 3.14.75.81 1.2 1.84 1.2 3.1 0 4.44-2.69 5.42-5.25 5.71.42.36.8 1.07.8 2.16 0 1.56-.01 2.82-.01 3.2 0 .31.21.67.8.55C20.71 21.38 24 17.09 24 12 24 5.73 18.27.5 12 .5z" />
            </svg>
            <span>GitHub</span>
          </a>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex md:hidden">
          <button
            type="button"
            onClick={toggleMobileMenu}
            className="min-h-[44px] min-w-[44px] p-2.5 rounded-md inline-flex items-center justify-center text-[#625C53] hover:text-[#302E29] hover:bg-[#E9E0D3]/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#A9573F]"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation-menu"
            aria-label={mobileMenuOpen ? "Tutup menu navigasi" : "Buka menu navigasi"}
          >
            {mobileMenuOpen ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div
          id="mobile-navigation-menu"
          className="md:hidden border-t border-[#D8D0C4] bg-[#FFFEFB] px-4 pt-2 pb-4 space-y-1 shadow-xs"
        >
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={closeMobileMenu}
                aria-current={isActive ? "page" : undefined}
                className={`min-h-[44px] flex items-center px-3 py-2.5 rounded-md text-base font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#A9573F] ${
                  isActive
                    ? "text-[#A9573F] bg-[#E9E0D3]/60 font-semibold"
                    : "text-[#625C53] hover:text-[#302E29] hover:bg-[#E9E0D3]/30"
                }`}
              >
                {link.name}
              </Link>
            );
          })}
          <a
            href="https://github.com/Tokitakun/TokiConvert"
            target="_blank"
            rel="noopener noreferrer"
            onClick={closeMobileMenu}
            className="min-h-[44px] flex items-center space-x-2 px-3 py-2.5 rounded-md text-base font-medium text-[#625C53] hover:text-[#302E29] hover:bg-[#E9E0D3]/30 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#A9573F]"
            aria-label="GitHub Repository (buka di tab baru)"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              className="w-5 h-5 fill-current"
              aria-hidden="true"
            >
              <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.09 3.29 9.39 7.86 10.92.58.1.79-.25.79-.56 0-.28-.01-1.02-.01-2-3.19.69-3.86-1.54-3.86-1.54-.53-1.35-1.3-1.71-1.3-1.71-1.07-.73.08-.71.08-.71 1.19.08 1.82 1.22 1.82 1.22 1.05 1.8 2.76 1.28 3.44.98.1-.77.41-1.28.75-1.57-2.55-.29-5.23-1.28-5.23-5.71 0-1.26.45-2.29 1.2-3.1-.12-.3-.52-1.51.11-3.14 0 0 .98-.31 3.2 1.18a11.12 11.12 0 012.92-.39c.99.01 2 .13 2.92.39 2.22-1.5 3.2-1.18 3.2-1.18.64 1.63.24 2.84.12 3.14.75.81 1.2 1.84 1.2 3.1 0 4.44-2.69 5.42-5.25 5.71.42.36.8 1.07.8 2.16 0 1.56-.01 2.82-.01 3.2 0 .31.21.67.8.55C20.71 21.38 24 17.09 24 12 24 5.73 18.27.5 12 .5z" />
            </svg>
            <span>GitHub</span>
          </a>
        </div>
      )}
    </nav>
  );
}

