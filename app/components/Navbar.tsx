"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navContainerRef = useRef<HTMLDivElement>(null);

  const navLinks = [
    { name: "Image", fullName: "Image Converter", href: "/" },
    { name: "Audio", fullName: "Audio Converter", href: "/audio" },
    { name: "Video", fullName: "Video Converter", href: "/video" },
    { name: "Document", fullName: "Document Converter", href: "/document" },
    { name: "Media Tools", fullName: "Media Downloader", href: "/media" },
    { name: "About", fullName: "About TokiConvert", href: "/about" },
  ];

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen((prev) => !prev);
  };

  // Keyboard navigation, click outside, and resize handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mobileMenuOpen) {
        closeMobileMenu();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (
        mobileMenuOpen &&
        navContainerRef.current &&
        !navContainerRef.current.contains(e.target as Node)
      ) {
        closeMobileMenu();
      }
    };

    const handleResize = () => {
      // Sembunyikan mobile menu saat viewport melebihi breakpoint desktop (1024px)
      if (window.innerWidth >= 1024 && mobileMenuOpen) {
        closeMobileMenu();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleResize);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleResize);
    };
  }, [mobileMenuOpen]);

  return (
    <header className="sticky top-0 z-40 w-full px-4 sm:px-6 pt-3 sm:pt-4 pb-1 pointer-events-none">
      <div
        ref={navContainerRef}
        className="max-w-5xl mx-auto bg-[#FFFCF6]/95 backdrop-blur-md border border-[#D8CCB9] rounded-xl shadow-xs pointer-events-auto transition-all"
      >
        <nav
          className="h-14 sm:h-16 px-3.5 sm:px-5 flex items-center justify-between"
          aria-label="Navigasi Utama"
        >
          {/* Brand: Logo Asli TokiConvert (tanpa teks ekstra di sampingnya) */}
          <Link
            href="/"
            onClick={closeMobileMenu}
            className="group inline-flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#A34F38] rounded-lg p-1 -ml-1 transition-opacity hover:opacity-90 active:scale-[0.98]"
            aria-label="TokiConvert Home"
          >
            <Image
              src="/logo/logo.webp"
              alt="TokiConvert"
              width={160}
              height={88}
              priority
              className="h-9 sm:h-10 w-auto object-contain"
            />
          </Link>

          {/* Desktop Navigation (>= 1024px) */}
          <div className="hidden lg:flex items-center space-x-1 xl:space-x-1.5">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#A34F38] ${
                    isActive
                      ? "text-[#A34F38] bg-[#D4B98A]/35 font-semibold shadow-2xs border border-[#A34F38]/20"
                      : "text-[#62584C] hover:text-[#332F29] hover:bg-[#D4B98A]/20"
                  }`}
                >
                  <span className="xl:hidden">{link.name}</span>
                  <span className="hidden xl:inline">{link.fullName}</span>
                </Link>
              );
            })}

            {/* External GitHub Link */}
            <a
              href="https://github.com/Tokitakun/TokiConvert"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-[#62584C] hover:text-[#332F29] hover:bg-[#D4B98A]/20 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#A34F38] border border-transparent hover:border-[#D8CCB9]/60"
              aria-label="GitHub Repository TokiConvert (buka di tab baru)"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className="w-4 h-4 fill-current text-[#62584C] group-hover:text-[#332F29] transition-colors"
                aria-hidden="true"
              >
                <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.09 3.29 9.39 7.86 10.92.58.1.79-.25.79-.56 0-.28-.01-1.02-.01-2-3.19.69-3.86-1.54-3.86-1.54-.53-1.35-1.3-1.71-1.3-1.71-1.07-.73.08-.71.08-.71 1.19.08 1.82 1.22 1.82 1.22 1.05 1.8 2.76 1.28 3.44.98.1-.77.41-1.28.75-1.57-2.55-.29-5.23-1.28-5.23-5.71 0-1.26.45-2.29 1.2-3.1-.12-.3-.52-1.51.11-3.14 0 0 .98-.31 3.2 1.18a11.12 11.12 0 012.92-.39c.99.01 2 .13 2.92.39 2.22-1.5 3.2-1.18 3.2-1.18.64 1.63.24 2.84.12 3.14.75.81 1.2 1.84 1.2 3.1 0 4.44-2.69 5.42-5.25 5.71.42.36.8 1.07.8 2.16 0 1.56-.01 2.82-.01 3.2 0 .31.21.67.8.55C20.71 21.38 24 17.09 24 12 24 5.73 18.27.5 12 .5z" />
              </svg>
              <span>GitHub</span>
            </a>
          </div>

          {/* Mobile Hamburger Button (< 1024px) */}
          <div className="flex lg:hidden">
            <button
              type="button"
              onClick={toggleMobileMenu}
              className="min-h-[44px] min-w-[44px] p-2.5 rounded-lg inline-flex items-center justify-center text-[#62584C] hover:text-[#332F29] hover:bg-[#D4B98A]/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#A34F38] transition-colors"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation-menu"
              aria-label={mobileMenuOpen ? "Tutup menu navigasi" : "Buka menu navigasi"}
            >
              {mobileMenuOpen ? (
                <X size={22} aria-hidden="true" />
              ) : (
                <Menu size={22} aria-hidden="true" />
              )}
            </button>
          </div>
        </nav>

        {/* Mobile Dropdown Panel (< 1024px) */}
        {mobileMenuOpen && (
          <div
            id="mobile-navigation-menu"
            className="lg:hidden border-t border-[#D8CCB9] px-3.5 sm:px-5 py-3 space-y-1 bg-[#FFFCF6] rounded-b-xl animate-in fade-in-50 duration-150"
            role="menu"
            aria-orientation="vertical"
          >
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={closeMobileMenu}
                  aria-current={isActive ? "page" : undefined}
                  role="menuitem"
                  className={`min-h-[44px] flex items-center px-3.5 py-2.5 rounded-lg text-sm sm:text-base font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#A34F38] ${
                    isActive
                      ? "text-[#A34F38] bg-[#D4B98A]/35 font-semibold border-l-3 border-[#A34F38] pl-3"
                      : "text-[#62584C] hover:text-[#332F29] hover:bg-[#D4B98A]/20"
                  }`}
                >
                  {link.fullName}
                </Link>
              );
            })}

            <div className="pt-2 border-t border-[#D8CCB9]/60">
              <a
                href="https://github.com/Tokitakun/TokiConvert"
                target="_blank"
                rel="noopener noreferrer"
                onClick={closeMobileMenu}
                role="menuitem"
                className="min-h-[44px] flex items-center space-x-2.5 px-3.5 py-2.5 rounded-lg text-sm sm:text-base font-medium text-[#62584C] hover:text-[#332F29] hover:bg-[#D4B98A]/20 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#A34F38]"
                aria-label="GitHub Repository TokiConvert (buka di tab baru)"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  className="w-5 h-5 fill-current text-[#62584C]"
                  aria-hidden="true"
                >
                  <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.09 3.29 9.39 7.86 10.92.58.1.79-.25.79-.56 0-.28-.01-1.02-.01-2-3.19.69-3.86-1.54-3.86-1.54-.53-1.35-1.3-1.71-1.3-1.71-1.07-.73.08-.71.08-.71 1.19.08 1.82 1.22 1.82 1.22 1.05 1.8 2.76 1.28 3.44.98.1-.77.41-1.28.75-1.57-2.55-.29-5.23-1.28-5.23-5.71 0-1.26.45-2.29 1.2-3.1-.12-.3-.52-1.51.11-3.14 0 0 .98-.31 3.2 1.18a11.12 11.12 0 012.92-.39c.99.01 2 .13 2.92.39 2.22-1.5 3.2-1.18 3.2-1.18.64 1.63.24 2.84.12 3.14.75.81 1.2 1.84 1.2 3.1 0 4.44-2.69 5.42-5.25 5.71.42.36.8 1.07.8 2.16 0 1.56-.01 2.82-.01 3.2 0 .31.21.67.8.55C20.71 21.38 24 17.09 24 12 24 5.73 18.27.5 12 .5z" />
                </svg>
                <span>GitHub Repository</span>
              </a>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
