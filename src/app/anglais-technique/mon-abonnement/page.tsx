import type { Metadata } from "next";
import MonAbonnementClient from "./MonAbonnementClient";

// Page privée (protégée par le middleware), §7novodecies
export const metadata: Metadata = {
  title: "Mon abonnement — Anglais technique",
  robots: { index: false },
};

export default function Page() {
  return <MonAbonnementClient />;
}
