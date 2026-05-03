"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X, ChevronRight, QrCode } from "lucide-react";

export function Navbar() {
  const [open, setOpen]       = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = [
    { href: "/restaurants",   label: "Établissements" },
    { href: "/features",      label: "Fonctionnalités" },
    { href: "/pricing",       label: "Tarifs" },
    { href: "/how-it-works",  label: "Comment ça marche" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/90 backdrop-blur-xl border-b border-gray-100 shadow-sm shadow-black/5"
          : "bg-white border-b border-gray-100"
      }`}
    >
      <div className="max-w-7xl mx-auto px-5 h-16 flex items-center justify-between gap-6">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
          <div className="w-9 h-9 bg-gradient-to-br from-violet-600 to-purple-700 rounded-xl flex items-center justify-center shadow-lg shadow-violet-200 group-hover:shadow-violet-300 transition-shadow">
            <QrCode className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-black text-gray-900 text-xl tracking-tight">
            QR<span className="text-violet-600">Menu</span>
          </span>
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden lg:flex items-center gap-1">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-gray-600 hover:text-violet-600 hover:bg-violet-50 px-3.5 py-2 rounded-lg transition-all"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Desktop CTA row */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/merchant/login"
            className="text-sm font-semibold text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-50 transition-all"
          >
            Connexion
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center gap-1.5 text-sm font-bold bg-violet-600 hover:bg-violet-700 text-white px-5 py-2.5 rounded-full transition-all shadow-lg shadow-violet-200/70 hover:shadow-violet-300/80 hover:-translate-y-px active:translate-y-0"
          >
            Démarrer gratuitement
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-all"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          {open
            ? <X     className="w-5 h-5 text-gray-700" />
            : <Menu  className="w-5 h-5 text-gray-700" />
          }
        </button>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="md:hidden bg-white border-t border-gray-100 px-5 py-4 space-y-1 shadow-lg">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all"
            >
              {l.label}
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </Link>
          ))}
          <div className="pt-3 space-y-2.5 border-t border-gray-100 mt-2">
            <Link
              href="/merchant/login"
              onClick={() => setOpen(false)}
              className="block w-full text-center px-4 py-3 rounded-xl text-sm font-semibold text-gray-700 border border-gray-200 hover:bg-gray-50 transition-all"
            >
              Connexion
            </Link>
            <Link
              href="/signup"
              onClick={() => setOpen(false)}
              className="block w-full text-center px-4 py-3 rounded-full text-sm font-bold bg-violet-600 text-white hover:bg-violet-700 transition-all shadow-md shadow-violet-200"
            >
              Démarrer gratuitement — 14 jours offerts
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
