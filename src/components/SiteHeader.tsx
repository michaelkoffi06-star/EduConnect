"use client";

import { useState } from "react";
import Link from "next/link";

interface SiteHeaderProps {
  active?: "finder" | "register" | "admin";
  theme?: "light" | "dark";
}

const NAV_LINKS = [
  { href: "/", label: "Accueil" },
  { href: "/#instructeurs", label: "Nos instructeurs" },
  { href: "/trouver-un-tuteur", label: "Trouver un tuteur" },
  { href: "/register-instructor", label: "Devenir instructeur" },
  { href: "/#contact", label: "Contact" },
];

export default function SiteHeader({ theme = "light" }: SiteHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const isLight = theme === "light";

  const headerBg = isLight ? "bg-white" : "bg-[#0d1a30]";
  const headerBorder = isLight ? "border-[#eee6d3]" : "border-[#2A4A6E]";
  const textColor = isLight ? "text-[#0d1b3e]" : "text-white";
  const dropdownBg = isLight ? "bg-white" : "bg-[#0a1628]";
  const dropdownBorder = isLight ? "border-[#eee6d3]" : "border-[#2A4A6E]";
  const dropdownText = isLight ? "text-[#333]" : "text-gray-300";
  const logoSrc = isLight ? "/marketing/images/logo-light.png" : "/marketing/images/logo.png";

  return (
    <header className={`${headerBg} border-b ${headerBorder} sticky top-0 z-50`}>
      <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between gap-4">

        <Link href="/" className="flex items-center gap-3 shrink-0">
          <img src={logoSrc} alt="EduConnect" className="w-10 h-10 rounded-lg object-cover" />
          <div className={`font-[family-name:var(--font-cinzel)] text-lg ${textColor}`}>
            Edu<span className="text-[#C9951A]">Connect</span>
          </div>
        </Link>

        <button
          onClick={() => setMenuOpen((open) => !open)}
          aria-label="Ouvrir le menu"
          aria-expanded={menuOpen}
          className={`${textColor} text-xl w-9 h-9 flex items-center justify-center rounded-lg border ${headerBorder} hover:border-[#C9951A] hover:text-[#C9951A] transition`}
        >
          {menuOpen ? "✕" : "☰"}
        </button>

      </div>

      {menuOpen && (
        <nav className={`absolute right-6 w-56 ${dropdownBg} border ${dropdownBorder} rounded-xl shadow-lg overflow-hidden text-sm`}>
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className={`block px-4 py-2.5 transition ${dropdownText} hover:bg-[#c9951a]/10 hover:text-[#c9951a]`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}

    </header>
  );
}
