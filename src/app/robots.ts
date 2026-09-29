import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/bleSseD",
        "/api",
        "/modifier-profil",
        "/mon-compte",
        "/espace-instructeur",
        "/reinitialiser-mot-de-passe",
      ],
    },
    sitemap: "https://educonnect-ci.org/sitemap.xml",
  };
}
