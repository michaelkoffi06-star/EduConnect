import Link from "next/link";
import ScrollReveal from "@/components/ScrollReveal";
import StepsTimeline, { type Step } from "./StepsTimeline";
import { IconArrowRight } from "./icons";

// Section 4 de l'accueil (§7tervicies). L'étape 03 reflète le vrai fonctionnement : la demande part
// vers l'équipe EduConnect, qui fait l'intermédiaire avec l'instructeur (/trouver-un-tuteur).

const STEPS: Step[] = [
  {
    title: "Exprimez votre besoin",
    text: "Choisissez votre niveau, votre matière et le type d'accompagnement recherché : à domicile ou en ligne.",
  },
  {
    title: "Trouvez votre instructeur",
    text: "Consultez les profils et identifiez l'instructeur qui correspond à vos besoins.",
  },
  {
    title: "Commencez à progresser",
    text: "L'équipe EduConnect vous met en relation avec l'instructeur choisi, et vous organisez ensemble l'accompagnement.",
  },
];

export default function HowItWorks() {
  return (
    <section className="bg-white py-20 lg:py-24">
      <div className="mx-auto max-w-5xl px-5 sm:px-6">
        <ScrollReveal>
          <div className="mx-auto mb-14 max-w-xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-700">En trois étapes</p>
            <h2 className="mt-3 font-[family-name:var(--font-cinzel)] text-3xl text-navy-900 md:text-4xl">Comment ça marche</h2>
          </div>
        </ScrollReveal>

        <StepsTimeline steps={STEPS} />

        <div className="mt-14 text-center">
          <Link
            href="/trouver-un-tuteur"
            className="group inline-flex items-center gap-2 rounded-full bg-navy-900 px-7 py-3.5 font-semibold text-white transition hover:-translate-y-0.5 hover:bg-navy-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-900"
          >
            Faire ma demande
            <IconArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}
