import Image from "next/image";
import Link from "next/link";
import ScrollReveal from "@/components/ScrollReveal";
import { IconArrowRight, IconBook, IconChat, IconClipboardCheck, IconSearchUser, IconTeacher } from "./icons";
import type { HomeInstructor } from "./types";

// Section 2 de l'accueil (§7tervicies) : les cinq services en grille « bento » (cartes de tailles
// différentes). Les cinq sont en ligne : aucun badge « Bientôt disponible » ici. Le badge de chaque
// carte dit seulement qui peut y accéder. Ancres conservées : #decouvrir (section) et
// #instructeurs (grande carte, menu « Nos instructeurs »).

const CARD =
  "group relative flex h-full flex-col overflow-hidden rounded-3xl border border-line bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-gold-500/50 hover:shadow-[0_24px_50px_-20px_rgba(13,27,62,0.3)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-700";

const SEARCH_FILTERS = ["Matière", "Niveau", "Ville et commune", "À domicile ou en ligne"];

function Tag({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${
        dark ? "bg-white/10 text-gold-300" : "bg-cream-50 text-gold-700 ring-1 ring-line"
      }`}
    >
      {children}
    </span>
  );
}

function More({ label, dark = false }: { label: string; dark?: boolean }) {
  return (
    <span className={`mt-auto inline-flex items-center gap-1.5 pt-4 text-sm font-semibold ${dark ? "text-gold-300" : "text-gold-700"}`}>
      {label}
      <IconArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
    </span>
  );
}

function IconChip({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <span
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
        dark ? "bg-gold-500 text-navy-900" : "bg-gold-500/12 text-gold-700"
      }`}
    >
      {children}
    </span>
  );
}

export default function ServicesBento({ instructors }: { instructors: HomeInstructor[] }) {
  return (
    <section id="decouvrir" className="scroll-mt-20 border-y border-line bg-cream-50 py-20 lg:py-24">
      <div className="mx-auto max-w-6xl px-5 sm:px-6">
        <ScrollReveal>
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-700">Nos services</p>
            <h2 className="mt-3 font-[family-name:var(--font-cinzel)] text-3xl text-navy-900 md:text-4xl">
              Plus qu&apos;une mise en relation
            </h2>
            <p className="mt-4 text-gray-600">
              Un instructeur pour avancer, et tout ce qu&apos;il faut entre deux cours : des ressources pour réviser,
              des corrigés pour s&apos;entraîner et une communauté pour s&apos;entraider.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* 1. Trouver un tuteur : grande carte, avec les derniers instructeurs validés */}
          <ScrollReveal className="sm:col-span-2 lg:row-span-2">
            <div
              id="instructeurs"
              className="relative flex h-full scroll-mt-24 flex-col overflow-hidden rounded-3xl bg-navy-900 p-6 text-white shadow-[0_30px_70px_-30px_rgba(13,27,62,0.6)] sm:p-8"
            >
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 opacity-[0.08]"
                style={{ backgroundImage: "radial-gradient(circle, #e2a349 1.2px, transparent 1.2px)", backgroundSize: "22px 22px" }}
              />
              <div className="relative flex items-start justify-between gap-4">
                <IconChip dark>
                  <IconSearchUser className="h-6 w-6" />
                </IconChip>
                <Tag dark>Service principal</Tag>
              </div>
              <h3 className="relative mt-5 font-[family-name:var(--font-cinzel)] text-2xl md:text-3xl">Trouver un tuteur</h3>
              <p className="relative mt-2 max-w-md text-sm leading-relaxed text-white/75 md:text-base">
                Des instructeurs vérifiés, du primaire à la terminale, à domicile ou en ligne. Filtrez par matière,
                niveau, ville et mode d&apos;enseignement, puis l&apos;équipe EduConnect organise la mise en relation.
              </p>

              <div className="relative mt-6">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-gold-300">Nos instructeurs</p>
                {instructors.length === 0 ? (
                  <p className="rounded-2xl bg-white/5 px-4 py-3 text-sm text-white/70">Aucun instructeur disponible pour le moment.</p>
                ) : (
                  <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {instructors.map((inst) => (
                      <li key={inst.id} className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-navy-700">
                        {inst.photoUrl ? (
                          // Photos hébergées sur R2 : balise img simple (pas de domaine distant configuré pour next/image)
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={inst.photoUrl}
                            alt={`${inst.firstName} ${inst.lastName}`}
                            loading="lazy"
                            className="h-full w-full object-cover object-top"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-gold-300">
                            {inst.firstName[0]}
                            {inst.lastName[0]}
                          </div>
                        )}
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-2.5 pt-10">
                          <p className="truncate text-xs font-semibold text-white">
                            {inst.firstName} {inst.lastName}
                          </p>
                          {inst.subjects[0] && (
                            <p className="mt-0.5 truncate text-[10px] text-white/80">
                              {inst.subjects
                                .slice(0, 2)
                                .map((s) => s.subject.name)
                                .join(" · ")}
                            </p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Les filtres réels de /trouver-un-tuteur */}
              <div className="relative mt-6">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-gold-300">Rechercher par</p>
                <ul className="flex flex-wrap gap-2 text-xs">
                  {SEARCH_FILTERS.map((f) => (
                    <li key={f} className="rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 text-white/85">
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="relative mt-auto flex flex-wrap items-center gap-x-5 gap-y-3 pt-7">
                <Link
                  href="/trouver-un-tuteur"
                  className="rounded-full bg-gold-500 px-6 py-3 text-sm font-semibold text-navy-900 transition hover:-translate-y-0.5 hover:bg-gold-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-300"
                >
                  Trouver un tuteur
                </Link>
                <Link href="/trouver-un-tuteur" className="group inline-flex items-center gap-1.5 text-sm font-semibold text-gold-300 hover:text-white">
                  Voir tous les instructeurs
                  <IconArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </ScrollReveal>

          {/* 2. Bibliothèque : carte large, photo à gauche */}
          <ScrollReveal className="sm:col-span-2" delay={100}>
            <Link href="/bibliotheque" className={`${CARD} sm:flex-row`}>
              <div className="relative aspect-[16/9] shrink-0 bg-[#f1ecdd] sm:aspect-auto sm:w-[42%]">
                <Image src="/images/vitrine/bibliotheque.jpg" alt="" fill sizes="(min-width: 1024px) 230px, (min-width: 640px) 40vw, 100vw" className="object-cover" />
              </div>
              <div className="flex flex-1 flex-col p-5 sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <IconChip>
                    <IconBook className="h-5 w-5" />
                  </IconChip>
                  <Tag>Accès libre</Tag>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-navy-900">Bibliothèque</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-gray-600">
                  Cours, exercices et vidéos rangés par matière et par niveau, à lire sur téléphone ou à télécharger.
                </p>
                <More label="Ouvrir la bibliothèque" />
              </div>
            </Link>
          </ScrollReveal>

          {/* 3. Exercices et corrigés */}
          <ScrollReveal delay={180}>
            <Link href="/bibliotheque/corriges" className={CARD}>
              <div className="relative aspect-[16/9] bg-[#f1ecdd]">
                <Image src="/images/vitrine/corriges.jpg" alt="" fill sizes="(min-width: 1024px) 270px, (min-width: 640px) 50vw, 100vw" className="object-cover" />
              </div>
              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-center justify-between gap-3">
                  <IconChip>
                    <IconClipboardCheck className="h-5 w-5" />
                  </IconChip>
                  <Tag>Avec un compte</Tag>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-navy-900">Exercices et corrigés</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-gray-600">
                  Les corrigés des exercices de la bibliothèque, pour s&apos;entraîner et vérifier son travail en autonomie.
                </p>
                <More label="Voir les corrigés" />
              </div>
            </Link>
          </ScrollReveal>

          {/* 4. Forum */}
          <ScrollReveal delay={260}>
            <Link href="/forum" className={CARD}>
              <div className="relative aspect-[16/9] bg-[#f1ecdd]">
                <Image src="/images/vitrine/forum.jpg" alt="" fill sizes="(min-width: 1024px) 270px, (min-width: 640px) 50vw, 100vw" className="object-cover" />
              </div>
              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-center justify-between gap-3">
                  <IconChip>
                    <IconChat className="h-5 w-5" />
                  </IconChip>
                  <Tag>Lecture libre</Tag>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-navy-900">Forum d&apos;entraide</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-gray-600">
                  Élèves, parents et instructeurs posent leurs questions et s&apos;entraident, matière par matière.
                </p>
                <More label="Aller au forum" />
              </div>
            </Link>
          </ScrollReveal>

          {/* 5. Espace instructeur : bandeau sur toute la largeur */}
          <ScrollReveal className="sm:col-span-2 lg:col-span-4" delay={120}>
            <div className="relative flex h-full flex-col gap-6 overflow-hidden rounded-3xl border border-line bg-white p-6 shadow-sm sm:p-8 lg:flex-row lg:items-center">
              <div className="relative hidden h-36 w-56 shrink-0 overflow-hidden rounded-2xl bg-[#f1ecdd] lg:block">
                <Image src="/images/vitrine/espace-instructeur.jpg" alt="" fill sizes="224px" className="object-cover" />
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <IconChip>
                    <IconTeacher className="h-5 w-5" />
                  </IconChip>
                  <Tag>Instructeurs validés</Tag>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-navy-900 md:text-xl">Espace instructeur</h3>
                <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-gray-600">
                  Les annonces des familles et la salle des profs, pour les instructeurs dont le profil est validé par
                  l&apos;équipe EduConnect.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 lg:flex-col lg:items-stretch">
                <Link
                  href="/espace-instructeur"
                  className="rounded-full bg-navy-900 px-6 py-3 text-center text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-navy-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-900"
                >
                  Accéder à l&apos;espace
                </Link>
                <Link
                  href="/register-instructor"
                  className="rounded-full border border-navy-900/20 px-6 py-3 text-center text-sm font-semibold text-navy-900 transition hover:bg-navy-900/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-900"
                >
                  Devenir instructeur
                </Link>
              </div>
            </div>
          </ScrollReveal>
        </div>

        <ScrollReveal>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 text-center text-sm md:flex-row">
            <span className="text-gray-600">Un compte gratuit suffit pour accéder aux corrigés et au forum.</span>
            <div className="flex gap-3">
              <Link
                href="/inscription"
                className="whitespace-nowrap rounded-full bg-navy-900 px-5 py-2 font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                Créer un compte
              </Link>
              <Link href="/connexion" className="whitespace-nowrap rounded-full border border-navy-900/15 px-5 py-2 font-semibold text-navy-900 transition hover:bg-navy-900/5">
                Se connecter
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
