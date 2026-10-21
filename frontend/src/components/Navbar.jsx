import React, { useState, useEffect } from 'react';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-200 ${
        scrolled
          ? 'bg-[var(--color-void)]/90 backdrop-blur-md border-b border-[var(--color-graphite)] shadow-[0_4px_20px_rgba(0,0,0,0.5)]'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Left: Brand Logo */}
        <a
          href="/"
          className="flex items-center gap-2.5 text-[var(--color-paper)] font-[510] text-[17px] tracking-tight group"
        >
          <span className="w-7 h-7 rounded-md bg-[var(--color-carbon)] border border-[var(--color-graphite)] group-hover:border-[var(--color-smoke)] flex items-center justify-center text-[var(--color-acid-lime)] transition-colors shadow-inner">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
          </span>
          <span className="font-sans tracking-[-0.022em] text-white">klikin</span>
        </a>

        {/* Right: Navigation Links + Action Buttons grouped on the RIGHT */}
        <div className="hidden md:flex items-center gap-7">
          <nav className="flex items-center gap-6 text-[13px] font-[400] text-[var(--color-mist)]">
            <a
              href="#solusi"
              className="hover:text-[var(--color-paper)] transition-colors duration-150"
            >
              Solusi
            </a>
            <a
              href="#fitur"
              className="hover:text-[var(--color-paper)] transition-colors duration-150"
            >
              Fitur
            </a>
            <a
              href="#harga"
              className="hover:text-[var(--color-paper)] transition-colors duration-150"
            >
              Harga
            </a>
            <a
              href="#faq"
              className="hover:text-[var(--color-paper)] transition-colors duration-150"
            >
              FAQ
            </a>
          </nav>

          <div className="h-4 w-[1px] bg-[var(--color-graphite)]" />

          <div className="flex items-center gap-3">
            <a
              href="#demo"
              className="btn-ghost-dark text-xs py-1.5 px-3"
            >
              Lihat Demo
            </a>
            <a
              href="#claim"
              className="btn-pill-white text-xs py-1.5 px-4 shadow-[0_2px_8px_rgba(255,255,255,0.15)]"
            >
              Coba Gratis
            </a>
          </div>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-expanded={mobileMenuOpen}
          aria-label="Buka menu navigasi"
          className="md:hidden flex flex-col justify-center items-center gap-1.5 w-9 h-9 rounded-md bg-[var(--color-carbon)] border border-[var(--color-graphite)] text-[var(--color-mist)]"
        >
          <span
            className={`w-4 h-0.5 bg-current transition-transform duration-200 ${
              mobileMenuOpen ? 'rotate-45 translate-y-1' : ''
            }`}
          />
          <span
            className={`w-4 h-0.5 bg-current transition-opacity duration-200 ${
              mobileMenuOpen ? 'opacity-0' : 'opacity-100'
            }`}
          />
          <span
            className={`w-4 h-0.5 bg-current transition-transform duration-200 ${
              mobileMenuOpen ? '-rotate-45 -translate-y-1' : ''
            }`}
          />
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[var(--color-carbon)] border-b border-[var(--color-graphite)] px-6 py-5 flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-150">
          <nav className="flex flex-col gap-3 text-sm text-[var(--color-mist)]">
            <a
              href="#solusi"
              onClick={() => setMobileMenuOpen(false)}
              className="hover:text-white py-1"
            >
              Solusi
            </a>
            <a
              href="#fitur"
              onClick={() => setMobileMenuOpen(false)}
              className="hover:text-white py-1"
            >
              Fitur
            </a>
            <a
              href="#harga"
              onClick={() => setMobileMenuOpen(false)}
              className="hover:text-white py-1"
            >
              Harga
            </a>
            <a
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="hover:text-white py-1"
            >
              FAQ
            </a>
          </nav>
          <div className="pt-3 border-t border-[var(--color-graphite)] flex flex-col gap-2">
            <a
              href="#demo"
              onClick={() => setMobileMenuOpen(false)}
              className="btn-ghost-dark text-center py-2"
            >
              Lihat Demo
            </a>
            <a
              href="#claim"
              onClick={() => setMobileMenuOpen(false)}
              className="btn-acid text-center py-2"
            >
              Coba Gratis
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
