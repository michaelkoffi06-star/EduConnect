import SiteHeader from "@/components/SiteHeader";
import HomeHero from "@/components/home/HomeHero";
import ServicesBento from "@/components/home/ServicesBento";
import TechEnglishSection from "@/components/home/TechEnglishSection";
import HowItWorks from "@/components/home/HowItWorks";
import AppSection from "@/components/home/AppSection";
import FinalCta from "@/components/home/FinalCta";
import HomeFooter from "@/components/home/HomeFooter";
import { prisma } from "@/lib/prisma";
import { CONTACT_EMAIL, CONTACT_PHONES } from "@/lib/contact";

export const metadata = {
  title: "EduConnect - Trouvez le tuteur idéal pour votre enfant",
  description:
    "EduConnect connecte les élèves du système scolaire (CP1 à Terminale) avec des instructeurs qualifiés et vérifiés, à domicile ou en ligne.",
};

export const dynamic = "force-dynamic";

// Accueil refondu en novembre 2026 (§7tervicies de docs/documentation.md) : les sections sont dans
// src/components/home/. Cette page garde les requêtes, les métadonnées et les données structurées.

export default async function HomePage() {
  const [instructors, approvedCount, subjectCount, doneMatchesCount] = await Promise.all([
    prisma.instructor.findMany({
      where: { status: "APPROVED" },
      take: 4,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        photoUrl: true,
        subjects: { include: { subject: true } },
      },
    }),
    prisma.instructor.count({ where: { status: "APPROVED" } }),
    prisma.subject.count(),
    prisma.matchRequest.count({ where: { status: "DONE" } }),
  ]);
  const stats = { approvedCount, subjectCount, doneMatchesCount };

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: "EduConnect CI",
    alternateName: "EduConnect",
    url: "https://educonnect-ci.org",
    logo: "https://educonnect-ci.org/marketing/images/logo-light.png",
    description:
      "Plateforme de mise en relation entre familles et instructeurs particuliers vérifiés, du primaire à la terminale, en Côte d'Ivoire.",
    areaServed: {
      "@type": "Country",
      name: "Côte d'Ivoire",
    },
    email: CONTACT_EMAIL,
    contactPoint: CONTACT_PHONES.map((p) => ({
      "@type": "ContactPoint",
      telephone: p.tel,
      contactType: "customer service",
      areaServed: "CI",
      availableLanguage: "French",
    })),
    sameAs: [
      "https://www.facebook.com/profile.php?id=100090481355986",
    ],
  };

  return (
    // font-sans : Geist pour le texte courant (accueil uniquement). overflow-x-clip plutôt que
    // overflow-hidden : coupe les décors qui débordent sans empêcher l'en-tête de rester collant.
    <div className="min-h-screen overflow-x-clip bg-white font-sans text-navy-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <SiteHeader theme="light" />

      <main>
        <HomeHero instructors={instructors} stats={stats} />
        <ServicesBento instructors={instructors} />
        <TechEnglishSection />
        <HowItWorks />
        <AppSection />
        <FinalCta />
      </main>

      <HomeFooter />
    </div>
  );
}