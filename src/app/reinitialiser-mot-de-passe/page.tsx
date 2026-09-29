import type { Metadata } from "next";
import ReinitialiserClient from "./ReinitialiserClient";

// Page privée (lien reçu par email) : exclue du sitemap et bloquée dans robots.txt
export const metadata: Metadata = {
  title: "Nouveau mot de passe",
  robots: { index: false },
};

export default function Page() {
  return <ReinitialiserClient />;
}
