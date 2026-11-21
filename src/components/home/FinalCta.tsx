import Link from "next/link";
import ScrollReveal from "@/components/ScrollReveal";

// Section 6 de l'accueil (§7tervicies) : appel à l'action final, trois actions principales.

export default function FinalCta() {
  return (
    <section className="bg-white px-5 py-20 sm:px-6 lg:py-24">
      <ScrollReveal>
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[2rem] bg-navy-900 px-6 py-14 text-center text-white shadow-[0_40px_90px_-40px_rgba(13,27,62,0.8)] sm:px-12">
          {/* Décor fixe : trame de points et arc doré du logo */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.08]"
            style={{ backgroundImage: "radial-gradient(circle, #e2a349 1.3px, transparent 1.3px)", backgroundSize: "24px 24px" }}
          />
          <svg aria-hidden="true" viewBox="0 0 400 220" className="pointer-events-none absolute -bottom-[27rem] left-1/2 w-[60rem] max-w-none -translate-x-1/2 text-gold-500/40" fill="none">
            <path d="M14 214 A186 186 0 0 1 386 214" stroke="currentColor" strokeWidth="1" />
          </svg>

          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-300">Innovation for Academic Success</p>
            <h2 className="mt-4 font-[family-name:var(--font-cinzel)] text-3xl md:text-4xl">Rejoignez EduConnect</h2>
            <p className="mx-auto mt-4 max-w-xl leading-relaxed text-white/75">
              Familles, élèves et instructeurs : trouvez le bon accompagnement, partagez votre savoir, et accédez aux
              ressources avec un compte gratuit.
            </p>

            <div className="mt-9 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
              <Link
                href="/trouver-un-tuteur"
                className="rounded-full bg-gold-500 px-7 py-3.5 font-semibold text-navy-900 transition hover:-translate-y-0.5 hover:bg-gold-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-300"
              >
                Trouver un tuteur
              </Link>
              <Link
                href="/register-instructor"
                className="rounded-full border border-white/30 px-7 py-3.5 font-semibold text-white transition hover:-translate-y-0.5 hover:border-white/60 hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Devenir instructeur
              </Link>
              <Link
                href="/inscription"
                className="rounded-full bg-white px-7 py-3.5 font-semibold text-navy-900 transition hover:-translate-y-0.5 hover:bg-cream-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Créer un compte
              </Link>
            </div>
            <p className="mt-6 text-sm text-white/70">
              Déjà inscrit ?{" "}
              <Link href="/connexion" className="font-semibold text-gold-300 hover:underline">
                Se connecter
              </Link>
            </p>
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}
