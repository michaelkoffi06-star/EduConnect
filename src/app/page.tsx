import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import ScrollReveal from "@/components/ScrollReveal";
import AnimatedCounter from "@/components/AnimatedCounter";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "EduConnect - Trouvez le tuteur ideal pour votre enfant",
  description:
    "EduConnect connecte les eleves du systeme scolaire (6e a Terminale) avec des instructeurs qualifies et verifies, a domicile ou en ligne.",
};

export const dynamic = "force-dynamic";

const HOW_IT_WORKS = [
  { title: "Parcourez les profils", desc: "Consultez les instructeurs disponibles par matiere." },
  { title: "Faites votre choix", desc: "Selectionnez celui qui correspond aux besoins de votre enfant." },
  { title: "On s'occupe du reste", desc: "L'equipe EduConnect organise la mise en relation." },
];

export default async function HomePage() {
  const [instructors, approvedCount, subjectCount, doneMatchesCount] = await Promise.all([
    prisma.instructor.findMany({
      where: { status: "APPROVED" },
      take: 4,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        photoUrl: true,
        subjects: { include: { subject: true } },
      },
    }),
    prisma.instructor.count({ where: { status: "APPROVED" } }),
    prisma.subject.count(),
    prisma.matchRequest.count({ where: { status: "DONE" } }),
  ]);

  return (
    <div className="min-h-screen bg-white text-[#0d1b3e] overflow-hidden">
      <SiteHeader theme="light" />

      <section className="relative max-w-6xl mx-auto px-6 pt-16 pb-20 lg:pt-24 lg:pb-28">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <ScrollReveal>
            <div className="flex items-center gap-2 mb-6">
              <span className="w-8 h-px bg-[#c9951a]" />
              <span className="text-xs font-medium text-[#8a6510] tracking-wide">
                Soutien scolaire, du college a la terminale
              </span>
            </div>
            <h1 className="font-[family-name:var(--font-cinzel)] text-4xl md:text-5xl lg:text-6xl leading-[1.05] mb-6">
              Le bon tuteur,<br /><span className="text-[#c9951a]">au bon moment</span>
            </h1>
            <p className="text-gray-600 text-base md:text-lg max-w-md mb-9 leading-relaxed">
              EduConnect met les familles en relation avec des instructeurs verifies, choisis pour leur pedagogie autant que pour leurs resultats.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/trouver-un-tuteur" className="px-7 py-3 rounded-full bg-gradient-to-r from-[#c9951a] to-[#d4a820] text-white font-semibold shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all">
                Trouver un tuteur
              </Link>
              <Link href="/register-instructor" className="px-7 py-3 rounded-full border border-[#0d1b3e]/15 text-[#0d1b3e] font-semibold hover:bg-[#0d1b3e]/5 hover:-translate-y-0.5 transition-all">
                Devenir instructeur
              </Link>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={150}>
            <div className="relative max-w-sm mx-auto lg:mx-0">
              <div className="relative bg-white border border-[#eee6d3] rounded-[2rem] p-8 shadow-[0_20px_60px_-15px_rgba(13,27,62,0.15)] -rotate-1">
                <div className="flex items-center mb-6">
                  {instructors.slice(0, 4).map((inst, i) => (
                    <div
                      key={inst.id}
                      className="w-12 h-12 rounded-full border-2 border-white overflow-hidden bg-[#f1ecdd] -ml-3 first:ml-0"
                      style={{ zIndex: 10 - i }}
                    >
                      {inst.photoUrl ? (
                        <img src={inst.photoUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#c9951a] font-semibold text-sm">
                          {inst.firstName[0]}
                        </div>
                      )}
                    </div>
                  ))}
                  {approvedCount > 4 && (
                    <div className="w-12 h-12 rounded-full border-2 border-white bg-[#0d1b3e] text-white text-xs font-semibold flex items-center justify-center -ml-3">
                      +{approvedCount - 4}
                    </div>
                  )}
                </div>

                <div className="font-[family-name:var(--font-cinzel)] text-5xl text-[#0d1b3e] leading-none">
                  <AnimatedCounter value={approvedCount} suffix="+" />
                </div>
                <p className="text-sm text-gray-500 mt-2 mb-6">instructeurs verifies par notre equipe</p>

                <div className="flex gap-6 pt-6 border-t border-[#eee6d3] text-sm">
                  <div>
                    <span className="font-semibold text-[#0d1b3e]"><AnimatedCounter value={subjectCount} /></span>
                    <span className="text-gray-500 ml-1">matieres</span>
                  </div>
                  <div>
                    <span className="font-semibold text-[#0d1b3e]"><AnimatedCounter value={doneMatchesCount} suffix="+" /></span>
                    <span className="text-gray-500 ml-1">mises en relation</span>
                  </div>
                </div>
              </div>

              <div className="absolute -top-4 -right-4 w-14 h-14 rounded-full bg-[#c9951a] text-white flex items-center justify-center rotate-6 shadow-lg">
                <span className="text-xl">✓</span>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <section id="instructeurs" className="py-16 bg-[#faf8f2] border-y border-[#eee6d3]">
        <div className="max-w-6xl mx-auto px-6">
          <ScrollReveal>
            <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
              <div>
                <h2 className="font-[family-name:var(--font-cinzel)] text-2xl md:text-3xl">Nos instructeurs</h2>
                <p className="text-gray-600 text-sm mt-1">Une selection de profils deja valides par notre equipe.</p>
              </div>
              <Link href="/trouver-un-tuteur" className="text-sm font-semibold text-[#c9951a] hover:underline whitespace-nowrap">
                Voir tous les instructeurs
              </Link>
            </div>
          </ScrollReveal>

          {instructors.length === 0 ? (
            <p className="text-gray-500 text-sm">Aucun instructeur disponible pour le moment.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {instructors.map((inst, i) => (
                <ScrollReveal key={inst.id} delay={i * 100}>
                  <div className="group relative aspect-[3/4] rounded-3xl overflow-hidden bg-[#f1ecdd] shadow-sm hover:shadow-xl transition-shadow duration-300">
                    {inst.photoUrl ? (
                      <img
                        src={inst.photoUrl}
                        alt={`${inst.firstName} ${inst.lastName}`}
                        className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#c9951a] font-bold text-4xl">
                        {inst.firstName[0]}{inst.lastName[0]}
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent p-4 pt-14">
                      <h3 className="text-white font-semibold text-sm">{inst.firstName} {inst.lastName}</h3>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {inst.subjects.slice(0, 2).map((s) => (
                          <span key={s.subject.id} className="text-[10px] bg-white/20 backdrop-blur-sm text-white px-2 py-0.5 rounded-full">
                            {s.subject.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 py-20">
        <ScrollReveal>
          <h2 className="font-[family-name:var(--font-cinzel)] text-2xl md:text-3xl text-center mb-14">Comment ca marche</h2>
        </ScrollReveal>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
          {HOW_IT_WORKS.map((step, i) => (
            <ScrollReveal key={step.title} delay={i * 150}>
              <div className="relative text-center px-4">
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 font-[family-name:var(--font-cinzel)] text-7xl text-[#c9951a]/10 select-none pointer-events-none">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="relative">
                  <h3 className="font-semibold text-sm mb-1.5">{step.title}</h3>
                  <p className="text-gray-600 text-sm">{step.desc}</p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      <section className="relative bg-[#0d1b3e] py-16 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: "radial-gradient(circle, #c9951a 1.5px, transparent 1.5px)", backgroundSize: "26px 26px" }}
        />
        <ScrollReveal>
          <div className="relative max-w-3xl mx-auto px-6 text-center">
            <h2 className="font-[family-name:var(--font-cinzel)] text-2xl md:text-3xl text-white mb-3">
              Pret a trouver le bon tuteur ?
            </h2>
            <p className="text-gray-300 text-sm mb-7">
              Quelques minutes suffisent pour lancer votre demande.
            </p>
            <Link href="/trouver-un-tuteur" className="inline-block px-8 py-3 rounded-full bg-gradient-to-r from-[#c9951a] to-[#d4a820] text-white font-semibold hover:shadow-lg hover:-translate-y-0.5 transition-all">
              Trouver un tuteur
            </Link>
          </div>
        </ScrollReveal>
      </section>

      <footer id="contact" className="max-w-6xl mx-auto px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div>
            <div className="font-[family-name:var(--font-cinzel)] text-lg mb-2">
              Edu<span className="text-[#c9951a]">Connect</span>
            </div>
            <p className="text-gray-600 text-sm">Connecting learners with excellence.</p>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-[#c9951a] uppercase tracking-widest mb-3">Contact</h4>
            <ul className="text-sm text-gray-600 space-y-1.5">
              <li>+225 07 58 52 93 23</li>
              <li>+225 01 01 68 09 71</li>
              <li>+225 05 75 53 52 97</li>
              <li>jk4177234@gmail.com</li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-[#c9951a] uppercase tracking-widest mb-3">Suivez-nous</h4>
            <ul className="text-sm text-gray-600 space-y-1.5">
              <li>
                <a href="https://facebook.com/educonnect.ci" target="_blank" rel="noopener noreferrer" className="hover:text-[#c9951a]">Facebook</a>
              </li>
              <li>
                <a href="https://wa.me/2250000000000" target="_blank" rel="noopener noreferrer" className="hover:text-[#c9951a]">WhatsApp</a>
              </li>
              <li>
                <a href="/suggestions" className="hover:text-[#c9951a]">Suggestions</a>
              </li>
              <li>
                <a href="/soutenir" className="hover:text-[#c9951a]">Soutenir le projet</a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-[#eee6d3] mt-10 pt-6 text-center text-xs text-gray-500">
          (c) 2026 EduConnect. Tous droits reserves.
        </div>
      </footer>
    </div>
  );
}
