"use client";

import Link from "next/link";
import { useState } from "react";
import { MapPin, Menu, X } from "lucide-react";

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-5 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center shadow-md shadow-violet-200">
            <span className="text-white text-sm font-bold">Q</span>
          </div>
          <span className="font-black text-gray-900 text-lg tracking-tight">QRMenu</span>
        </Link>

        {/* Desktop right */}
        <div className="hidden md:flex items-center gap-4">
          <Link
            href="/merchant/login"
            className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            Connexion
          </Link>
          <button className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors">
            <MapPin className="w-4 h-4" />
            Algérie
          </button>
          <Link
            href="/signup"
            className="text-sm font-semibold bg-violet-600 hover:bg-violet-700 text-white px-5 py-2.5 rounded-full transition-all shadow-md shadow-violet-200/60"
          >
            Créer un Menu
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-all"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          {open ? <X className="w-5 h-5 text-gray-700" /> : <Menu className="w-5 h-5 text-gray-700" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-gray-100 bg-white px-5 py-4 space-y-2">
          <Link
            href="/restaurants"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100 transition-all"
          >
            Établissements
          </Link>
          <Link
            href="/features"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100 transition-all"
          >
            Fonctionnalités
          </Link>
          <Link
            href="/pricing"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100 transition-all"
          >
            Tarifs
          </Link>
          <div className="pt-3 space-y-2 border-t border-gray-100">
            <Link
              href="/merchant/login"
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 text-center"
            >
              Connexion
            </Link>
            <Link
              href="/signup"
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 rounded-full text-sm font-semibold bg-violet-600 text-white text-center hover:bg-violet-700 transition-all"
            >
              Créer un Menu
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
