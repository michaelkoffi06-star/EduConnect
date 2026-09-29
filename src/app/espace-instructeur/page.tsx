import type { Metadata } from "next";
import EspaceInstructeurClient from "./EspaceInstructeurClient";

// Page privée (protégée par le middleware) : exclue du sitemap et bloquée dans robots.txt
export const metadata: Metadata = {
  title: "Espace instructeur",
  robots: { index: false },
};

export default function Page() {
  return <EspaceInstructeurClient />;
}
