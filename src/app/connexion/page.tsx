import type { Metadata } from "next";
import ConnexionClient from "./ConnexionClient";

export const metadata: Metadata = {
  title: "Se connecter",
  description: "Connectez-vous à votre compte EduConnect : corrigés, forum et espace instructeur.",
};

export default function Page() {
  return <ConnexionClient />;
}
