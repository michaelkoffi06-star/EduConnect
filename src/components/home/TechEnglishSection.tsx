import Link from "next/link";
import ScrollReveal from "@/components/ScrollReveal";
import { CHAPTERS } from "@/lib/english-chapters";
import AudioSample, { type AudioWord } from "./AudioSample";
import { IconArrowRight, IconCode, IconGift, IconHeadphones, IconLanguages, IconNetwork, IconPhone, IconStairs } from "./icons";

// Section 3 de l'accueil (§7tervicies) : l'anglais technique pour l'informatique.
// Uniquement ce qui existe : les chapitres en ligne viennent de CHAPTERS (src/lib/english-chapters.ts,
// lu sans être modifié). Le bouton « chapitre gratuit » et l'extrait audio n'apparaissent que si le
// chapitre 1 est en ligne et gratuit. Le chapitre 1 est commun aux deux manuels.

const MANUALS = [
  {
    label: "Manuel A",
    title: "Réseaux informatiques, cybersécurité et télécommunications",
    english: "Technical English for Networking, Cybersecurity and Telecommunications",
    icon: IconNetwork,
  },
  {
    label: "Manuel B",
    title: "Génie logiciel",
    english: "Technical English for Software Engineering",
    icon: IconCode,
  },
];

// Mots du vocabulaire de la leçon 1, avec leurs enregistrements (mêmes identifiants que data-id)
const SAMPLE_WORDS: AudioWord[] = [
  { id: "a07", term: "networking", translation: "réseaux informatiques", example: "I study networking." },
  { id: "a06", term: "computer science", translation: "informatique", example: "Computer science is my subject." },
  { id: "a09", term: "web developer", translation: "développeur web", example: "Yao is a web developer." },
];

export default function TechEnglishSection() {
  const online = CHAPTERS.filter((c) => c.href !== null);
  const freeChapter = online.find((c) => c.number === 1 && c.free);
  // /lecons/chapitre-01/index.html → /lecons/chapitre-01/audio/
  const audioBase = freeChapter?.href ? freeChapter.href.replace(/index\.html$/, "audio/") : null;

  const facts = [
    { icon: IconStairs, title: "Progression de A1 à B2", text: `Parcours conçu sur les niveaux européens (CECRL). En ligne : ${online.length > 1 ? `${online.length} chapitres` : "le chapitre 1"}, niveau ${online[0]?.level ?? "A1"}.` },
    { icon: IconLanguages, title: "Bilingue anglais-français", text: "Explications en français, pratique en anglais, situations du quotidien ivoirien." },
    { icon: IconHeadphones, title: "Leçons audio", text: "Enregistrées par de vraies voix, sans synthèse vocale." },
    ...(freeChapter ? [{ icon: IconGift, title: "Premier chapitre gratuit", text: "Exercices corrigés, et progression enregistrée avec un compte gratuit." }] : []),
    { icon: IconPhone, title: "Application en février 2027", text: "Pour apprendre partout, même hors connexion." },
  ];

  return (
    <section id="anglais-technique" aria-labelledby="anglais-technique-titre" className="relative scroll-mt-20 overflow-hidden bg-navy-950 py-20 text-white lg:py-24">
      {/* Décor fixe : trame de points et arc doré */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{ backgroundImage: "radial-gradient(circle, #e2a349 1.2px, transparent 1.2px)", backgroundSize: "26px 26px" }}
      />
      <svg aria-hidden="true" viewBox="0 0 400 220" className="pointer-events-none absolute -bottom-24 -left-24 w-[34rem] text-gold-500/30" fill="none">
        <path d="M14 214 A186 186 0 0 1 386 214" stroke="currentColor" strokeWidth="1.2" />
      </svg>

      <div className="relative mx-auto max-w-6xl px-5 sm:px-6">
        <ScrollReveal>
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-300" lang="en">
              English for IT
            </p>
            <h2 id="anglais-technique-titre" className="mt-3 font-[family-name:var(--font-cinzel)] text-3xl md:text-4xl">
              L&apos;anglais technique pour l&apos;informatique
            </h2>
            <p className="mt-4 leading-relaxed text-white/75">
              Deux manuels bilingues pour les étudiants et les professionnels de l&apos;informatique, des bases de
              l&apos;anglais jusqu&apos;à la présentation d&apos;un projet devant un jury.
            </p>
          </div>
        </ScrollReveal>

        <div className="mt-12 grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12">
          <div>
            <div className="grid gap-4 sm:grid-cols-2">
              {MANUALS.map((m, i) => (
                <ScrollReveal key={m.label} delay={i * 120} className="h-full">
                  <article className="flex h-full flex-col rounded-3xl border border-white/10 bg-white/[0.04] p-6 transition duration-300 hover:-translate-y-1 hover:border-gold-300/50 hover:bg-white/[0.07]">
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gold-500 text-navy-900">
                        <m.icon className="h-5 w-5" />
                      </span>
                      <span className="text-xs font-semibold text-gold-300">{m.label}</span>
                    </div>
                    <h3 className="mt-5 text-lg font-semibold leading-snug">{m.title}</h3>
                    <p className="mt-1.5 text-sm italic text-white/60" lang="en">
                      {m.english}
                    </p>
                    <p className="mt-auto pt-5 text-xs leading-relaxed text-white/70">
                      {freeChapter ? "Chapitre 1 disponible gratuitement, commun aux deux parcours. " : ""}
                      Chapitres suivants en préparation.
                    </p>
                  </article>
                </ScrollReveal>
              ))}
            </div>

            {/* div plutôt que ul/li : ScrollReveal ajoute une div autour de chaque élément */}
            <div className="mt-8 grid gap-x-6 gap-y-5 sm:grid-cols-2">
              {facts.map((f, i) => (
                <ScrollReveal key={f.title} delay={i * 80}>
                  <div className="flex gap-3">
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-gold-300 ring-1 ring-white/10">
                      <f.icon className="h-[18px] w-[18px]" />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold">{f.title}</span>
                      <span className="mt-0.5 block text-sm leading-relaxed text-white/65">{f.text}</span>
                    </span>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>

          <ScrollReveal delay={150}>
            <div className="rounded-[2rem] bg-white p-6 text-navy-900 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.6)] sm:p-7">
              {freeChapter && audioBase ? (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-700">Extrait du chapitre 1</p>
                      <p className="mt-1.5 font-semibold leading-snug" lang="en">
                        {freeChapter.title}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-navy-900 px-2.5 py-1 text-xs font-semibold text-gold-300">{freeChapter.level}</span>
                  </div>
                  <p className="mt-2 text-sm text-gray-600">Écoutez trois mots du vocabulaire de la leçon 1.</p>
                  <div className="mt-5 rounded-2xl border border-line bg-cream-50 p-4">
                    <AudioSample words={SAMPLE_WORDS} audioBase={audioBase} />
                  </div>
                  <div className="mt-6 flex flex-col gap-3 sm:flex-row lg:flex-col">
                    <a
                      href={freeChapter.href!}
                      className="inline-flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-gold-500 px-6 py-3 text-sm font-semibold text-navy-900 transition hover:-translate-y-0.5 hover:bg-gold-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-900"
                    >
                      Commencer le chapitre 1 gratuit
                      <IconArrowRight className="h-4 w-4" />
                    </a>
                    <Link
                      href="/anglais-technique"
                      className="inline-flex flex-1 items-center justify-center whitespace-nowrap rounded-full border border-navy-900/20 px-6 py-3 text-sm font-semibold text-navy-900 transition hover:bg-navy-900/5"
                    >
                      Découvrir les manuels
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <p className="font-semibold">Les premiers chapitres arrivent bientôt.</p>
                  <Link
                    href="/anglais-technique"
                    className="mt-5 inline-flex items-center justify-center rounded-full bg-gold-500 px-6 py-3 text-sm font-semibold text-navy-900"
                  >
                    Découvrir les manuels
                  </Link>
                </>
              )}
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
