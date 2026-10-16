import type { Metadata } from "next";
import NouveautesClient from "./NouveautesClient";

// Désinscription des emails « nouveautés » de l'anglais technique (lien signé dans l'email), §7novodecies
export const metadata: Metadata = {
  title: "Emails nouveautés — Anglais technique",
  robots: { index: false },
};

export default function Page() {
  return <NouveautesClient />;
}
