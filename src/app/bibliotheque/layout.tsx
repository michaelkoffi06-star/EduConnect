import { Cormorant_Garamond, IBM_Plex_Mono } from "next/font/google";

// Typographies propres à la bibliothèque (étagère + classeur) : un serif pour les titres
// et une police à chasse fixe pour les lignes d'index façon archive.
const serif = Cormorant_Garamond({
  variable: "--font-biblio-serif",
  subsets: ["latin"],
  weight: ["500", "600"],
  style: ["normal", "italic"],
});
const mono = IBM_Plex_Mono({
  variable: "--font-biblio-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export default function BibliothequeLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${serif.variable} ${mono.variable}`}>{children}</div>;
}
