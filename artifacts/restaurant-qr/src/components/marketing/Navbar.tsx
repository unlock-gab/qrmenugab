"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/restaurants", label: "Établissements" },
  { href: "/features", label: "Fonctionnalités" },
  { href: "/pricing", label: "Tarifs" },
  { href: "/faq", label: "FAQ" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-amber-500 rounded-lg flex items-center justify-center shadow-md shadow-orange-200">
            <span className="text-white text-sm font-bold">Q</span>
          </div>
          <span className="font-black text-gray-900 text-lg tracking-tight">QRMenu</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                pathname === l.href || pathname.startsWith(l.href + "/")
                  ? "text-orange-600 bg-orange-50"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/merchant/login"
            className="text-sm font-medium text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-100 transition-all"
          >
            Connexion
          </Link>
          <Link
            href="/signup"
            className="text-sm font-semibold bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl transition-all shadow-md shadow-orange-200 hover:shadow-orange-300"
          >
            Essai gratuit
          </Link>
        </div>

        <button
          className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-all"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          <div className={cn("w-5 h-0.5 bg-gray-600 mb-1 transition-all", open && "rotate-45 translate-y-1.5")} />
          <div className={cn("w-5 h-0.5 bg-gray-600 mb-1 transition-all", open && "opacity-0")} />
          <div className={cn("w-5 h-0.5 bg-gray-600 transition-all", open && "-rotate-45 -translate-y-1.5")} />
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-gray-100 bg-white px-5 py-4 space-y-1">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100 transition-all"
            >
              {l.label}
            </Link>
          ))}
          <div className="pt-3 space-y-2 border-t border-gray-100 mt-2">
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
              className="block px-4 py-2.5 rounded-xl text-sm font-semibold bg-orange-500 text-white text-center hover:bg-orange-600 transition-all"
            >
              Essai gratuit
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
