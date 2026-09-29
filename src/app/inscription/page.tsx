import type { Metadata } from "next";
import InscriptionClient from "./InscriptionClient";

export const metadata: Metadata = {
  title: "Créer un compte",
  description:
    "Créez votre compte EduConnect (élève, parent ou instructeur) : corrigés de la bibliothèque, forum d'entraide et espace instructeur.",
};

export default function Page() {
  return <InscriptionClient />;
}
