import type { Metadata } from "next";
import BibliothequeClient from "./BibliothequeClient";

export const metadata: Metadata = {
  title: "Bibliothèque de ressources pédagogiques",
  description:
    "Documents, vidéos, exercices et liens utiles pour réviser, classés par matière et par niveau, du primaire à la terminale.",
};

export default function Page() {
  return <BibliothequeClient />;
}
