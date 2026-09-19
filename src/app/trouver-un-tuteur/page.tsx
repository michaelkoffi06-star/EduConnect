import type { Metadata } from "next";
import TrouverUnTuteurClient from "./TrouverUnTuteurClient";

export const metadata: Metadata = {
  title: "Trouver un tuteur",
  description:
    "Parcourez nos instructeurs vérifiés par matière, niveau, mode d'enseignement et commune, du primaire à la terminale, à Abidjan et en Côte d'Ivoire.",
};

export default function Page() {
  return <TrouverUnTuteurClient />;
}
