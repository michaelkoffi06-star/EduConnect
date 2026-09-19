import type { MetadataRoute } from "next";

const SITE_URL = "https://educonnect-ci.org";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    { path: "", priority: 1, changeFrequency: "daily" as const },
    { path: "/trouver-un-tuteur", priority: 0.9, changeFrequency: "daily" as const },
    { path: "/bibliotheque", priority: 0.8, changeFrequency: "weekly" as const },
    { path: "/register-instructor", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/suggestions", priority: 0.5, changeFrequency: "monthly" as const },
    { path: "/soutenir", priority: 0.5, changeFrequency: "monthly" as const },
    { path: "/confidentialite", priority: 0.3, changeFrequency: "yearly" as const },
  ];

  return routes.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
