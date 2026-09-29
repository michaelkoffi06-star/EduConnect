import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const SITE_URL = "https://educonnect-ci.org";

// Régénéré au plus une fois par heure : les nouvelles ressources de la bibliothèque
// y apparaissent sans redéploiement.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes = [
    { path: "", priority: 1, changeFrequency: "daily" as const },
    { path: "/trouver-un-tuteur", priority: 0.9, changeFrequency: "daily" as const },
    { path: "/bibliotheque", priority: 0.8, changeFrequency: "weekly" as const },
    { path: "/bibliotheque/corriges", priority: 0.6, changeFrequency: "weekly" as const },
    { path: "/forum", priority: 0.7, changeFrequency: "daily" as const },
    { path: "/inscription", priority: 0.6, changeFrequency: "monthly" as const },
    { path: "/connexion", priority: 0.4, changeFrequency: "monthly" as const },
    { path: "/register-instructor", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/suggestions", priority: 0.5, changeFrequency: "monthly" as const },
    { path: "/soutenir", priority: 0.5, changeFrequency: "monthly" as const },
    { path: "/confidentialite", priority: 0.3, changeFrequency: "yearly" as const },
  ];

  const staticEntries: MetadataRoute.Sitemap = routes.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  // Une entrée par ressource de la bibliothèque (page /bibliotheque/<slug>).
  // Si la base est injoignable (build sans accès réseau, par ex.), on garde les pages fixes.
  try {
    const resources = await prisma.resource.findMany({
      select: { id: true, slug: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });
    return [
      ...staticEntries,
      ...resources.map((r) => ({
        url: `${SITE_URL}/bibliotheque/${r.slug || r.id}`,
        lastModified: r.createdAt,
        changeFrequency: "monthly" as const,
        priority: 0.6,
      })),
    ];
  } catch (error) {
    console.error("Sitemap : ressources de la bibliothèque indisponibles", error);
    return staticEntries;
  }
}
