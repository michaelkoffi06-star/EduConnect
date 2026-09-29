import type { Metadata } from "next";
import MonCompteClient from "./MonCompteClient";

// Page privée (protégée par le middleware) : exclue du sitemap et bloquée dans robots.txt
export const metadata: Metadata = {
  title: "Mon compte",
  robots: { index: false },
};

export default function Page() {
  return <MonCompteClient />;
}
