import type { Metadata } from "next";
import RegisterInstructorClient from "./RegisterInstructorClient";

export const metadata: Metadata = {
  title: "Devenir instructeur",
  description:
    "Rejoignez le réseau d'instructeurs EduConnect en Côte d'Ivoire. Inscription en ligne, profil examiné sous 48h.",
};

export default function Page() {
  return <RegisterInstructorClient />;
}
