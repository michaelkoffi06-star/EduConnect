import type { Metadata } from "next";
import CorrigesClient from "./CorrigesClient";

export const metadata: Metadata = {
  title: "Corrigés — Bibliothèque",
  description:
    "Les corrigés des exercices et documents de la bibliothèque EduConnect, réservés aux élèves, parents et instructeurs inscrits (inscription gratuite).",
  alternates: { canonical: "/bibliotheque/corriges" },
};

export default function Page() {
  return <CorrigesClient />;
}
