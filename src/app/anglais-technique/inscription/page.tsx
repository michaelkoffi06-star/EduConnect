import type { Metadata } from "next";
import type { EnglishPlan } from "@prisma/client";
import { PLANS, isPlanOpen } from "@/lib/english";
import InscriptionAnglaisClient from "./InscriptionAnglaisClient";

export const metadata: Metadata = {
  title: "EduConnect - S'inscrire à l'anglais technique",
  description:
    "Inscription à la version pro des manuels d'anglais technique EduConnect : choisis ton manuel et ta formule, puis paie par Mobile Money.",
  alternates: { canonical: "/anglais-technique/inscription" },
};

// Les formules ouvertes dépendent des prix (english-plans.ts) et des numéros de paiement
// (variable ENGLISH_PAYMENT_NUMBERS) : calculées à chaque requête.
export const dynamic = "force-dynamic";

export default function Page() {
  const openPlans = (Object.keys(PLANS) as EnglishPlan[]).filter((p) => isPlanOpen(p));
  return <InscriptionAnglaisClient openPlans={openPlans} />;
}
