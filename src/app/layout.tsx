import type { Metadata } from "next";
import { Geist, Geist_Mono, Cinzel } from "next/font/google";
import "./globals.css";
import PageTransition from "@/components/PageTransition";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const cinzel = Cinzel({ variable: "--font-cinzel", subsets: ["latin"], weight: ["700"] });

const SITE_URL = "https://educonnect-ci.org";
const SITE_TITLE = "EduConnect CI - Trouvez votre instructeur idéal";
const SITE_DESCRIPTION =
  "EduConnect connecte les élèves du système scolaire ivoirien (primaire à terminale) avec des instructeurs qualifiés et vérifiés, à domicile ou en ligne.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: "%s | EduConnect CI",
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "cours particuliers Abidjan",
    "soutien scolaire Côte d'Ivoire",
    "tuteur Abidjan",
    "répétiteur Abidjan",
    "instructeur particulier",
    "EduConnect",
  ],
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: "EduConnect CI",
    images: [
      {
        url: "/marketing/images/logo-light.png",
        width: 1254,
        height: 1254,
        alt: "EduConnect CI",
      },
    ],
    locale: "fr_CI",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/marketing/images/logo-light.png"],
  },
  icons: {
    icon: [{ url: "/marketing/images/logo-light.png?v=2", type: "image/png" }],
    shortcut: "/marketing/images/logo-light.png?v=2",
    apple: "/marketing/images/logo-light.png?v=2",
  },
  other: {
    "msvalidate.01": "5E263431EF1F40B6170D0BF052B9DE84",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" data-scroll-behavior="smooth" className={`${geistSans.variable} ${geistMono.variable} ${cinzel.variable} h-full`}>
      <body className="min-h-full flex flex-col">
        <PageTransition>{children}</PageTransition>
      </body>
    </html>
  );
}
