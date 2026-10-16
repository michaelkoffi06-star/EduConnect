import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import type { EnglishPlan } from "@prisma/client";
import { CONTACT_EMAIL } from "@/lib/contact";
import { PLANS, formatFcfa, isPlanOpen } from "@/lib/english";

export const metadata: Metadata = {
  title: "EduConnect - Anglais technique pour l'informatique",
  description:
    "Manuels bilingues d'anglais technique pour les étudiants et professionnels de l'informatique : réseaux, cybersécurité, télécoms et génie logiciel. Chapitre 1 gratuit, avec audio et exercices corrigés.",
  alternates: { canonical: "/anglais-technique" },
};

// Les formules affichées dépendent des prix et des numéros de paiement (variables d'environnement)
export const dynamic = "force-dynamic";

// Chapitres publiés. Chaque chapitre est une page autonome dans public/lecons/<dossier>/index.html,
// ses audios dans public/lecons/<dossier>/audio/aNN.mp3 (voir docs/documentation.md §7octodecies).
const CHAPTERS = [
  {
    number: 1,
    title: "Introducing Yourself and Your IT Background",
    subtitle: "Se présenter et parler de son parcours en informatique",
    level: "A1",
    lessons: "2 leçons · ≈ 90 min",
    href: "/lecons/chapitre-01/index.html",
    free: true,
  },
];

const MANUALS = [
  { label: "Manuel A", title: "Networking, Cybersecurity and Telecommunications" },
  { label: "Manuel B", title: "Software Engineering" },
];

export default function AnglaisTechniquePage() {
  return (
    <div className="min-h-screen bg-white">
      <SiteHeader theme="light" />

      <div className="max-w-2xl mx-auto py-10 px-4">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="w-8 h-px bg-[#c9951a]" />
            <span className="text-xs font-medium text-[#8a6510] tracking-wide">Technical English</span>
            <span className="w-8 h-px bg-[#c9951a]" />
          </div>
          <h1 className="font-[family-name:var(--font-cinzel)] text-3xl text-[#0d1b3e]">
            L&apos;anglais technique pour l&apos;informatique
          </h1>
          <p className="text-gray-600 mt-3 text-sm leading-relaxed">
            Deux manuels bilingues, des bases de l&apos;anglais jusqu&apos;à la présentation de ton projet
            devant un jury. Audio, exercices corrigés et situations du quotidien ivoirien.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 mb-10">
          {MANUALS.map((m) => (
            <div key={m.label} className="bg-white rounded-3xl border border-[#eee6d3] shadow-sm p-5">
              <p className="text-xs font-medium text-[#8a6510] tracking-wide">{m.label}</p>
              <p className="mt-1 text-sm font-semibold text-[#0d1b3e]">{m.title}</p>
            </div>
          ))}
        </div>

        <h2 className="font-[family-name:var(--font-cinzel)] text-lg text-[#0d1b3e] mb-4">Chapitres disponibles</h2>
        <ul className="space-y-3">
          {CHAPTERS.map((c) => (
            <li key={c.number}>
              <a
                href={c.href}
                className="block bg-white rounded-3xl border border-[#eee6d3] shadow-sm p-6 transition hover:border-[#c9951a]"
              >
                <span className="flex flex-wrap items-center gap-2 text-xs font-medium">
                  <span className="rounded-full bg-[#f6f1e4] px-2.5 py-0.5 text-[#0d1b3e]">Chapitre {c.number}</span>
                  <span className="rounded-full bg-[#f6f1e4] px-2.5 py-0.5 text-[#8a6510]">Niveau {c.level}</span>
                  {c.free && (
                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-emerald-700">Gratuit</span>
                  )}
                </span>
                <span className="mt-3 block font-semibold text-[#0d1b3e]">{c.title}</span>
                <span className="mt-1 block text-sm text-gray-600">
                  {c.subtitle} · {c.lessons}
                </span>
                <span className="mt-3 block text-sm font-semibold text-[#c9951a]">Commencer →</span>
              </a>
            </li>
          ))}
        </ul>

        <p className="text-sm text-gray-500 mt-8 text-center">
          Les chapitres suivants arrivent bientôt. Une question ? Écris-nous à {CONTACT_EMAIL}.
        </p>

        {/* Version pro : formules à durée fixe, paiement Mobile Money (§7novodecies) */}
        <section className="mt-12">
          <h2 className="font-[family-name:var(--font-cinzel)] text-lg text-[#0d1b3e] mb-1">Version pro</h2>
          <p className="text-sm text-gray-600 mb-4">
            Tous les chapitres de ton manuel, pour la durée de ta formule. Paiement par Wave, Orange Money, MTN MoMo ou Moov Money.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {(Object.keys(PLANS) as EnglishPlan[]).map((p) => {
              const plan = PLANS[p];
              const open = isPlanOpen(p);
              return (
                <div key={p} className="bg-white rounded-3xl border border-[#eee6d3] shadow-sm p-5">
                  <p className="flex items-baseline justify-between gap-2">
                    <span className="font-semibold text-[#0d1b3e]">{plan.label}</span>
                    <span className="text-xs font-medium text-[#8a6510]">{plan.durationLabel}</span>
                  </p>
                  <p className="mt-1 text-sm text-gray-600">{plan.text}</p>
                  <p className="mt-3 text-sm font-semibold text-[#0d1b3e]">
                    {open && plan.priceFcfa !== null ? formatFcfa(plan.priceFcfa) : <span className="text-gray-400">Bientôt disponible</span>}
                  </p>
                </div>
              );
            })}
          </div>
          <div className="mt-6 flex flex-col items-center gap-2">
            <a
              href="/anglais-technique/inscription"
              className="rounded-full bg-[#c9951a] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#b5851a]"
            >
              S&apos;inscrire à la version pro
            </a>
            <a href="/anglais-technique/mon-abonnement" className="text-sm font-semibold text-[#8a6510] hover:underline">
              Déjà inscrit ? Mon abonnement
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
