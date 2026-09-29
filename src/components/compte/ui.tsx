"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";

// Système visuel des pages de comptes, du forum et de l'espace instructeur (voir §7quindecies) :
// photos de fond libres de droits (Unsplash, public/images/comptes/), voiles et halos dorés,
// cartes en verre dépoli, apparitions « fondantes » (classes animate-fade-blur / stagger de
// globals.css), dans la continuité de la page d'accueil (or #c9951a, bleu nuit #0d1b3e, Cinzel).

// --- Classes communes ---

export const inputClass =
  "w-full rounded-xl px-4 py-3 text-sm text-[#0d1b3e] bg-white/90 border border-[#e5dcc6] placeholder-gray-400 shadow-[inset_0_1px_2px_rgba(13,27,62,0.04)] focus:outline-none focus:border-[#c9951a] focus:ring-4 focus:ring-[#c9951a]/15 focus:bg-white transition";
export const labelClass = "block text-[13px] font-semibold text-[#0d1b3e]/80 mb-1.5";
export const cardClass =
  "bg-white/85 backdrop-blur-xl rounded-[1.75rem] border border-white/70 ring-1 ring-[#eee6d3] shadow-[0_24px_60px_-20px_rgba(13,27,62,0.22)] p-6 md:p-7";
export const primaryBtn =
  "w-full py-3.5 rounded-full bg-gradient-to-r from-[#c9951a] via-[#d4a820] to-[#c9951a] bg-[length:200%_100%] bg-left hover:bg-right text-white font-bold text-sm tracking-wide shadow-[0_10px_24px_-10px_rgba(201,149,26,0.8)] hover:shadow-[0_16px_30px_-10px_rgba(201,149,26,0.9)] hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:hover:translate-y-0 transition-all duration-500";
export const secondaryBtn =
  "px-5 py-2.5 rounded-full border border-[#0d1b3e]/15 text-[#0d1b3e] font-semibold text-sm hover:bg-[#0d1b3e]/5 hover:-translate-y-0.5 transition-all";
export const smallBtn =
  "px-4 py-2 rounded-full text-xs font-semibold border border-[#0d1b3e]/15 text-[#0d1b3e] hover:border-[#c9951a] hover:text-[#8a6510] hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 transition-all";

// --- Messages ---

function Box({ tone, children }: { tone: "error" | "info" | "success"; children: React.ReactNode }) {
  const styles = {
    error: "bg-red-50/90 border-red-200 text-red-700",
    info: "bg-[#fbf6e9]/90 border-[#ecdcb4] text-[#5b4a22]",
    success: "bg-emerald-50/90 border-emerald-200 text-emerald-800",
  }[tone];
  const icon = { error: "!", info: "i", success: "✓" }[tone];
  const dot = { error: "bg-red-500", info: "bg-[#c9951a]", success: "bg-emerald-500" }[tone];
  return (
    <div className={`animate-fade-blur flex gap-3 items-start border rounded-2xl px-4 py-3 text-sm leading-relaxed backdrop-blur ${styles}`}>
      <span className={`shrink-0 mt-0.5 w-5 h-5 rounded-full ${dot} text-white text-[11px] font-bold flex items-center justify-center`}>{icon}</span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
export const ErrorBox = ({ children }: { children: React.ReactNode }) => <Box tone="error">{children}</Box>;
export const InfoBox = ({ children }: { children: React.ReactNode }) => <Box tone="info">{children}</Box>;
export const SuccessBox = ({ children }: { children: React.ReactNode }) => <Box tone="success">{children}</Box>;

// --- Décor ---

// Photo plein cadre, immobile, sous un voile (clair par défaut, bleu nuit si dark)
export function Backdrop({
  src,
  position = "center",
  dark = false,
  priority = true,
}: {
  src: string;
  position?: string;
  dark?: boolean;
  priority?: boolean;
}) {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      <Image src={src} alt="" fill priority={priority} sizes="100vw" quality={70} className="object-cover" style={{ objectPosition: position }} />
      {dark ? (
        <div className="absolute inset-0 bg-gradient-to-br from-[#0d1b3e]/90 via-[#0d1b3e]/70 to-[#0d1b3e]/40" />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-b from-white/55 via-white/70 to-[#faf8f2]" />
      )}
    </div>
  );
}

// Halos dorés flous + trame de points, en arrière-plan des zones de contenu. Les halos sont
// placés à distance du bord haut : coupés par le conteneur, ils dessinaient une ligne nette
// sous le bandeau photo. Dégradés radiaux (pas de blur CSS) : plus doux et plus légers à afficher.
export function Glow() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div
        className="absolute top-[18%] -left-40 w-[560px] h-[560px] rounded-full animate-drift"
        style={{ background: "radial-gradient(circle, rgba(201,149,26,0.14) 0%, rgba(201,149,26,0) 65%)" }}
      />
      <div
        className="absolute top-[45%] -right-40 w-[520px] h-[520px] rounded-full animate-drift [animation-delay:-8s]"
        style={{ background: "radial-gradient(circle, rgba(226,185,74,0.12) 0%, rgba(226,185,74,0) 65%)" }}
      />
      <div
        className="absolute inset-0 opacity-[0.05] [mask-image:linear-gradient(to_bottom,transparent,black_20%,black_80%,transparent)]"
        style={{ backgroundImage: "radial-gradient(circle, #c9951a 1.2px, transparent 1.2px)", backgroundSize: "24px 24px" }}
      />
    </div>
  );
}

// Petite accroche dorée au-dessus des titres
export function Kicker({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-8 h-px bg-[#c9951a]" />
      <span className={`text-xs font-semibold tracking-[0.14em] uppercase ${light ? "text-[#f0d58a]" : "text-[#8a6510]"}`}>{children}</span>
    </div>
  );
}

// --- Mises en page ---

// Page simple (fond crème + halos)
export function Page({ children, width = "max-w-md" }: { children: React.ReactNode; width?: string }) {
  return (
    <div className="min-h-screen bg-[#faf8f2] flex flex-col">
      <SiteHeader theme="light" />
      <div className="relative flex-1">
        <Glow />
        <div className={`relative ${width} mx-auto py-10 px-4`}>{children}</div>
      </div>
    </div>
  );
}

// Grand bandeau photo en tête de page, contenu qui vient ensuite chevaucher le bas du bandeau
export function PageHero({
  image,
  position,
  kicker,
  title,
  subtitle,
  aside,
  children,
  width = "max-w-5xl",
}: {
  image: string;
  position?: string;
  kicker: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  aside?: React.ReactNode;
  children: React.ReactNode;
  width?: string;
}) {
  return (
    <div className="min-h-screen bg-[#faf8f2] flex flex-col">
      <SiteHeader theme="light" />
      <section className="relative overflow-hidden">
        <Backdrop src={image} position={position} />
        <div className={`relative ${width} mx-auto px-5 md:px-6 pt-12 pb-24 md:pt-16 md:pb-28 grid lg:grid-cols-[minmax(0,1fr)_auto] gap-8 items-end`}>
          <div className="animate-fade-blur">
            <Kicker>{kicker}</Kicker>
            <h1 className="mt-4 font-[family-name:var(--font-cinzel)] text-4xl md:text-5xl leading-[1.08] text-[#0d1b3e] [text-shadow:0_1px_12px_rgba(255,255,255,0.8)]">{title}</h1>
            {subtitle && <p className="mt-4 text-[15px] md:text-base text-[#2b3550] max-w-xl leading-relaxed [text-shadow:0_1px_10px_rgba(255,255,255,0.9)]">{subtitle}</p>}
          </div>
          {aside && <div className="animate-fade-blur [animation-delay:150ms]">{aside}</div>}
        </div>
      </section>
      <div className="relative flex-1 -mt-14">
        <Glow />
        <div className={`relative ${width} mx-auto px-4 md:px-6 pb-16`}>{children}</div>
      </div>
    </div>
  );
}

// Écran partagé des pages de connexion/inscription : photo et promesse à gauche, formulaire à droite.
// Sur téléphone, la photo devient un bandeau en haut et la carte du formulaire le chevauche.
export function AuthShell({
  image,
  position,
  kicker,
  title,
  subtitle,
  quote,
  benefits,
  children,
  wide = false,
}: {
  image: string;
  position?: string;
  kicker: string;
  title: string;
  subtitle?: React.ReactNode;
  quote: React.ReactNode;
  benefits: { icon: React.ReactNode; text: string }[];
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="min-h-screen bg-[#faf8f2] flex flex-col">
      <SiteHeader theme="light" />
      <div className="flex-1 grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        {/* Panneau photo */}
        <aside className="relative overflow-hidden min-h-[240px] lg:min-h-0">
          <Backdrop src={image} position={position} dark />
          <div className="relative h-full flex flex-col justify-end lg:justify-center p-6 pb-20 lg:p-12 xl:p-16 text-white">
            <div className="animate-fade-blur max-w-md">
              <Kicker light>EduConnect CI</Kicker>
              <p className="mt-5 font-[family-name:var(--font-cinzel)] text-2xl md:text-3xl xl:text-4xl leading-tight">{quote}</p>
              <ul className="hidden lg:flex flex-col gap-4 mt-10 stagger">
                {benefits.map((b, i) => (
                  <li key={b.text} style={{ "--i": i + 2 } as React.CSSProperties} className="flex items-center gap-3 text-sm text-white/90">
                    <span className="shrink-0 w-10 h-10 rounded-2xl bg-white/10 ring-1 ring-white/20 backdrop-blur flex items-center justify-center text-[#f0d58a]">
                      {b.icon}
                    </span>
                    {b.text}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </aside>

        {/* Formulaire */}
        <main className="relative -mt-14 lg:mt-0 rounded-t-[2rem] lg:rounded-none bg-[#faf8f2]">
          <Glow />
          <div className={`relative mx-auto ${wide ? "max-w-xl" : "max-w-md"} px-4 md:px-6 py-8 lg:py-16`}>
            <div className="animate-fade-blur text-center lg:text-left mb-7">
              <div className="flex justify-center lg:justify-start"><Kicker>{kicker}</Kicker></div>
              <h1 className="mt-3 font-[family-name:var(--font-cinzel)] text-3xl md:text-4xl text-[#0d1b3e]">{title}</h1>
              {subtitle && <p className="mt-2 text-sm text-gray-600">{subtitle}</p>}
            </div>
            <div className="animate-fade-blur [animation-delay:120ms]">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}

// Ancien en-tête de page centré (conservé pour les écrans simples : chargement, accès refusé)
export function PageTitle({ kicker, title, subtitle }: { kicker: string; title: string; subtitle?: React.ReactNode }) {
  return (
    <div className="text-center mb-8 animate-fade-blur">
      <div className="flex justify-center"><Kicker>{kicker}</Kicker></div>
      <h1 className="mt-4 font-[family-name:var(--font-cinzel)] text-3xl text-[#0d1b3e]">{title}</h1>
      {subtitle && <p className="text-gray-600 mt-2 text-sm">{subtitle}</p>}
    </div>
  );
}

// --- Chargement ---

export function Spinner() {
  return (
    <div className="flex justify-center py-20">
      <div className="animate-spin rounded-full h-9 w-9 border-[3px] border-[#c9951a] border-t-transparent" />
    </div>
  );
}

export function SkeletonCards({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-[1.75rem] border border-[#eee6d3] bg-white/70 p-6 space-y-3">
          <div className="skeleton h-3 w-24 rounded-full" />
          <div className="skeleton h-5 w-3/4 rounded-full" />
          <div className="skeleton h-3 w-full rounded-full" />
          <div className="skeleton h-3 w-2/3 rounded-full" />
        </div>
      ))}
    </div>
  );
}

// --- Avatar à initiales ---

export function Avatar({ name, tone = "gold", size = "md" }: { name: string; tone?: "gold" | "navy" | "sky" | "violet" | "gray"; size?: "sm" | "md" | "lg" }) {
  const initials = name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const tones = {
    gold: "from-[#c9951a] to-[#e2b94a] text-white",
    navy: "from-[#0d1b3e] to-[#2a4a6e] text-white",
    sky: "from-sky-500 to-sky-300 text-white",
    violet: "from-violet-500 to-violet-300 text-white",
    gray: "from-gray-400 to-gray-300 text-white",
  }[tone];
  const sizes = { sm: "w-9 h-9 text-xs", md: "w-11 h-11 text-sm", lg: "w-20 h-20 text-2xl" }[size];
  return (
    <span className={`shrink-0 inline-flex items-center justify-center rounded-full bg-gradient-to-br ${tones} ${sizes} font-bold ring-4 ring-white shadow-md`}>
      {initials || "?"}
    </span>
  );
}

// --- Icônes (traits, 24×24, héritent de la couleur du texte) ---

function Svg({ children, size = 20 }: { children: React.ReactNode; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}
export const Icon = {
  book: (s?: number) => <Svg size={s}><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z" /><path d="M4 19V5" /><path d="M9 7h6" /></Svg>,
  key: (s?: number) => <Svg size={s}><circle cx="8" cy="15" r="4" /><path d="M11 12l8-8" /><path d="M16 7l2 2" /><path d="M14 9l2 2" /></Svg>,
  chat: (s?: number) => <Svg size={s}><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" /><path d="M8.5 11h.01M12 11h.01M15.5 11h.01" /></Svg>,
  briefcase: (s?: number) => <Svg size={s}><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" /><path d="M3 13h18" /></Svg>,
  users: (s?: number) => <Svg size={s}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><path d="M16 4.5a3.5 3.5 0 0 1 0 7" /><path d="M18 14a6 6 0 0 1 3.5 6" /></Svg>,
  student: (s?: number) => <Svg size={s}><path d="M2 9l10-5 10 5-10 5z" /><path d="M6 11v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5" /><path d="M22 9v6" /></Svg>,
  heart: (s?: number) => <Svg size={s}><path d="M12 20s-7-4.4-9-9a4.8 4.8 0 0 1 9-3 4.8 4.8 0 0 1 9 3c-2 4.6-9 9-9 9z" /></Svg>,
  pen: (s?: number) => <Svg size={s}><path d="M4 20h4L19 9l-4-4L4 16z" /><path d="M13 7l4 4" /></Svg>,
  lock: (s?: number) => <Svg size={s}><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></Svg>,
  user: (s?: number) => <Svg size={s}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></Svg>,
  mail: (s?: number) => <Svg size={s}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></Svg>,
  pin: (s?: number) => <Svg size={s}><path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z" /><circle cx="12" cy="9" r="2.5" /></Svg>,
  clock: (s?: number) => <Svg size={s}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Svg>,
  home: (s?: number) => <Svg size={s}><path d="M3 11l9-7 9 7" /><path d="M5 10v10h14V10" /></Svg>,
  coins: (s?: number) => <Svg size={s}><ellipse cx="9" cy="7" rx="6" ry="3" /><path d="M3 7v5c0 1.7 2.7 3 6 3s6-1.3 6-3V7" /><path d="M15 11c3.3 0 6 1.3 6 3s-2.7 3-6 3" /></Svg>,
  search: (s?: number) => <Svg size={s}><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></Svg>,
  arrow: (s?: number) => <Svg size={s}><path d="M5 12h14" /><path d="M13 6l6 6-6 6" /></Svg>,
  back: (s?: number) => <Svg size={s}><path d="M19 12H5" /><path d="M11 6l-6 6 6 6" /></Svg>,
  check: (s?: number) => <Svg size={s}><path d="M5 12l5 5 9-10" /></Svg>,
  plus: (s?: number) => <Svg size={s}><path d="M12 5v14M5 12h14" /></Svg>,
  flag: (s?: number) => <Svg size={s}><path d="M5 21V4" /><path d="M5 4h11l-2 4 2 4H5" /></Svg>,
  trash: (s?: number) => <Svg size={s}><path d="M4 7h16" /><path d="M9 7V4h6v3" /><path d="M6 7l1 13h10l1-13" /></Svg>,
  logout: (s?: number) => <Svg size={s}><path d="M15 4h4v16h-4" /><path d="M10 17l5-5-5-5" /><path d="M15 12H3" /></Svg>,
  sparkle: (s?: number) => <Svg size={s}><path d="M12 3v4M12 17v4M3 12h4M17 12h4" /><path d="M6 6l2.5 2.5M15.5 15.5L18 18M18 6l-2.5 2.5M8.5 15.5L6 18" /></Svg>,
};

// Lien « retour » discret
export function BackLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#8a6510] hover:gap-2.5 transition-all">
      {Icon.back(16)} {children}
    </Link>
  );
}

// --- Compte connecté ---

export type AccountRole = "ELEVE" | "PARENT" | "INSTRUCTEUR";

export interface AccountUser {
  id: string;
  email: string;
  role: AccountRole;
  firstName: string;
  lastName: string;
  classe: string | null;
  createdAt: string;
  instructorStatus: "PENDING" | "APPROVED" | "SUSPENDED" | null;
  isApprovedInstructor: boolean;
  instructorEditPath: string | null;
}

export const ROLE_LABELS: Record<AccountRole, string> = {
  ELEVE: "Élève",
  PARENT: "Parent",
  INSTRUCTEUR: "Instructeur",
};

// Compte connecté (null si personne), chargé une fois au montage de la page
export function useAccount() {
  const [user, setUser] = useState<AccountUser | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch("/api/compte/moi")
      .then((r) => r.json())
      .then((d) => setUser(d.user ?? null))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);
  return { user, setUser, loading };
}
