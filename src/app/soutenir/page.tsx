import type { Metadata } from "next";
import SoutenirClient from "./SoutenirClient";

export const metadata: Metadata = {
  title: "Soutenir le projet",
  description: "Découvrez comment soutenir EduConnect et son développement en Côte d'Ivoire.",
};

export default function Page() {
  return <SoutenirClient />;
}
