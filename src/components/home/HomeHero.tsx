import Image from "next/image";
import Link from "next/link";
import AnimatedCounter from "@/components/AnimatedCounter";
import { IconCheck } from "./icons";
import type { HomeInstructor, HomeStats } from "./types";

// Section 1 de l'accueil (§7tervicies). Composant serveur : le titre et la photo arrivent dans le
// HTML, les apparitions sont de simples animations CSS (aucun JavaScript à attendre pour lire la
// page). Seuls les compteurs (AnimatedCounter) s'exécutent dans le navigateur.

// Titre découpé en mots : chacun apparaît un peu après le précédent (order = rang du mot)
const TITLE_LINES = [
  { words: ["Le", "bon", "tuteur,"], className: "" },
  { words: ["au", "bon", "moment."], className: "text-gold-700" },
].map((line, li, all) => ({
  ...line,
  words: line.words.map((text, wi) => ({
    text,
    order: all.slice(0, li).reduce((n, l) => n + l.words.length, 0) + wi,
  })),
}));

const TRUST = ["Instructeurs vérifiés par notre équipe", "À domicile ou en ligne", "Du primaire à la terminale"];

export default function HomeHero({ instructors, stats }: { instructors: HomeInstructor[]; stats: HomeStats }) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white via-cream-50 to-white">
      {/* Décor fixe : halo doré et trame de points (aucun mouvement) */}
      <div aria-hidden="true" className="pointer-events-none absolute -right-40 -top-40 h-[34rem] w-[34rem] rounded-full bg-gold-500/10 blur-3xl" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{ backgroundImage: "radial-gradient(circle, #0d1b3e 1px, transparent 1px)", backgroundSize: "24px 24px" }}
      />

      <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-5 pb-20 pt-12 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:pb-28 lg:pt-20">
        <div>
          <p className="animate-fade-blur flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-gold-700">
            <span aria-hidden="true" className="h-px w-8 bg-gold-500" />
            Innovation for Academic Success
          </p>

          <h1 className="mt-6 font-[family-name:var(--font-cinzel)] text-[2.6rem] leading-[1.06] text-navy-900 sm:text-5xl lg:text-[3.7rem]">
            {TITLE_LINES.map((line, li) => (
              <span key={li} className={`block ${line.className}`}>
                {line.words.map((word) => (
                  <span key={word.order}>
                    <span className="animate-fade-blur inline-block" style={{ animationDelay: `${120 + word.order * 90}ms` }}>
                      {word.text}
                    </span>{" "}
                  </span>
                ))}
              </span>
            ))}
          </h1>

          <p className="animate-fade-blur mt-6 max-w-xl text-base leading-relaxed text-gray-600 md:text-lg" style={{ animationDelay: "650ms" }}>
            EduConnect vous accompagne dans votre parcours scolaire en vous mettant en relation avec des instructeurs
            qualifiés et en vous donnant accès à des ressources pédagogiques adaptées à vos besoins.
          </p>

          <div className="animate-fade-blur mt-9 flex flex-wrap gap-3" style={{ animationDelay: "780ms" }}>
            <Link
              href="/trouver-un-tuteur"
              className="rounded-full bg-gold-500 px-7 py-3.5 font-semibold text-navy-900 shadow-[0_10px_30px_-10px_rgba(201,149,26,0.7)] transition hover:-translate-y-0.5 hover:bg-gold-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-900"
            >
              Trouver un tuteur
            </Link>
            <Link
              href="/register-instructor"
              className="rounded-full border border-navy-900/20 bg-white/60 px-7 py-3.5 font-semibold text-navy-900 transition hover:-translate-y-0.5 hover:border-navy-900/40 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-900"
            >
              Devenir instructeur
            </Link>
          </div>

          <ul className="animate-fade-blur mt-9 flex flex-col gap-2.5 text-sm text-navy-900/80 sm:flex-row sm:flex-wrap sm:gap-x-6" style={{ animationDelay: "900ms" }}>
            {TRUST.map((t) => (
              <li key={t} className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gold-500/15 text-gold-700">
                  <IconCheck className="h-3.5 w-3.5" />
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>

        {/* Visuel : photo dans un cadre, arc doré du logo, carte de statistiques flottante */}
        <div className="animate-fade-blur relative mx-auto w-full max-w-md pb-10 sm:pb-6 lg:max-w-none lg:pb-0 lg:pl-6" style={{ animationDelay: "350ms" }}>
          <svg aria-hidden="true" viewBox="0 0 400 220" className="pointer-events-none absolute -top-10 left-1/2 w-[118%] -translate-x-1/2 text-gold-500" fill="none">
            <path d="M14 214 A186 186 0 0 1 386 214" stroke="currentColor" strokeWidth="1.4" pathLength={1} className="animate-draw" />
          </svg>

          <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-[#f1ecdd] shadow-[0_30px_80px_-30px_rgba(13,27,62,0.45)] ring-1 ring-navy-900/5 sm:aspect-[5/4] lg:aspect-[4/5]">
            <Image
              src="/images/comptes/connexion.jpg"
              alt="Des élèves concentrés sur leurs exercices"
              fill
              preload
              sizes="(min-width: 1024px) 460px, (min-width: 640px) 448px, 100vw"
              className="object-cover"
            />
            <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-navy-950/45 via-transparent to-transparent" />
          </div>

          <div className="absolute -right-2 -top-3 flex h-14 w-14 items-center justify-center rounded-full bg-gold-500 text-navy-900 shadow-lg ring-4 ring-white sm:-right-4">
            <IconCheck className="h-7 w-7" />
          </div>

          {/* Statistiques réelles (base de données), comme avant la refonte */}
          <div className="absolute -bottom-2 left-3 w-[min(19rem,88%)] sm:-left-6 lg:-left-10 lg:bottom-8">
            <div className="animate-float-y rounded-3xl border border-line bg-white p-5 shadow-[0_20px_60px_-15px_rgba(13,27,62,0.25)]">
              <div className="flex items-center">
                {instructors.slice(0, 4).map((inst, i) => (
                  <div
                    key={inst.id}
                    className="-ml-2.5 h-10 w-10 overflow-hidden rounded-full border-2 border-white bg-[#f1ecdd] first:ml-0"
                    style={{ zIndex: 10 - i }}
                  >
                    {inst.photoUrl ? (
                      // Photos hébergées sur R2 : balise img simple (pas de domaine distant configuré pour next/image)
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={inst.photoUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-gold-700">
                        {inst.firstName[0]}
                      </div>
                    )}
                  </div>
                ))}
                {stats.approvedCount > 4 && (
                  <div className="-ml-2.5 flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-navy-900 text-[11px] font-semibold text-white">
                    +{stats.approvedCount - 4}
                  </div>
                )}
              </div>

              <div className="mt-4 flex items-end gap-3">
                <span className="font-[family-name:var(--font-cinzel)] text-4xl leading-none text-navy-900">
                  <AnimatedCounter value={stats.approvedCount} suffix="+" />
                </span>
                <span className="pb-0.5 text-sm leading-tight text-gray-600">instructeurs vérifiés par notre équipe</span>
              </div>

              <div className="mt-4 flex gap-5 border-t border-line pt-4 text-sm">
                <p>
                  <span className="font-semibold text-navy-900">
                    <AnimatedCounter value={stats.subjectCount} />
                  </span>
                  <span className="ml-1 text-gray-600">matières</span>
                </p>
                <p>
                  <span className="font-semibold text-navy-900">
                    <AnimatedCounter value={stats.doneMatchesCount} suffix="+" />
                  </span>
                  <span className="ml-1 text-gray-600">mises en relation</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
