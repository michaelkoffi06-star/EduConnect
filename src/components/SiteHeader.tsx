"use client";

import { useState } from "react";
import Link from "next/link";

interface SiteHeaderProps {
  active?: "finder" | "register" | "admin";
}

const ANCHOR_LINKS = [
  { href: "/#home", label: "Accueil" },
  { href: "/#services", label: "Services" },
  { href: "/#advantages", label: "Pourquoi nous" },
  { href: "/#stats", label: "Statistiques" },
  { href: "/#contact", label: "Contact" },
];

const INTERFACE_LINKS = [
  { href: "/", label: "Vitrine (Accueil)", key: undefined },
  { href: "/trouver-un-tuteur", label: "Trouver un tuteur", key: "finder" as const },
  { href: "/register-instructor", label: "Devenir instructeur", key: "register" as const },
];

export default function SiteHeader({ active }: SiteHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="bg-[#0d1a30] border-b border-[#2A4A6E] sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between gap-4">

        <Link href="/" className="flex items-center gap-3 shrink-0">
          <img
            src="/marketing/images/logo.png"
            alt="EduConnect"
            className="w-10 h-10 rounded-lg object-cover"
          />
          <div className="leading-tight">
            <div className="font-[family-name:var(--font-cinzel)] text-xl">
              <span className="text-white">Edu</span>
              <span className="text-[#C9951A]">Connect</span>
            </div>
            <span className="text-[#C9951A] text-[11px] tracking-[4px]">EdCo</span>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-gray-200">
          {ANCHOR_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-[#C9951A] transition">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3 shrink-0">

          <div className="relative">
            <button
              onClick={() => setMenuOpen((open) => !open)}
              aria-label="Changer d'interface"
              aria-expanded={menuOpen}
              className="text-white text-xl w-9 h-9 flex items-center justify-center rounded-lg border border-[#2A4A6E] hover:border-[#C9951A] hover:text-[#C9951A] transition"
            >
              {menuOpen ? "✕" : "☰"}
            </button>

            {menuOpen && (
              <nav className="absolute right-0 mt-2 w-56 bg-[#112240] border border-[#2A4A6E] rounded-xl shadow-[0_15px_45px_rgba(0,0,0,.45)] overflow-hidden text-sm">
                <p className="px-4 pt-3 pb-1 text-[10px] uppercase tracking-widest text-gray-500">
                  Interfaces
                </p>
                {INTERFACE_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className={
                      "block px-4 py-2.5 transition " +
                      (active === link.key
                        ? "text-[#C9951A] bg-[#C9951A]/10"
                        : "text-gray-200 hover:bg-white/5 hover:text-[#C9951A]")
                    }
                  >
                    {link.label}
                  </Link>
                ))}
                <div className="lg:hidden border-t border-[#2A4A6E]">
                  <p className="px-4 pt-3 pb-1 text-[10px] uppercase tracking-widest text-gray-500">
                    Sur la vitrine
                  </p>
                  {ANCHOR_LINKS.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2.5 text-gray-200 hover:bg-white/5 hover:text-[#C9951A] transition"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </nav>
            )}
          </div>

          <Link
            href="/trouver-un-tuteur"
            className="hidden sm:inline-flex items-center justify-center px-6 py-2.5 rounded-full bg-gradient-to-r from-[#c9951a] to-[#d4a820] text-[#0a1628] font-bold text-sm shadow-[0_8px_20px_rgba(201,149,26,.3)] hover:brightness-110 transition"
          >
            Trouver un tuteur
          </Link>

        </div>

      </div>
    </header>
  );
}