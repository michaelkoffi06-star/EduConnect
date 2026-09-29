import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Mode développement uniquement : autorise un téléphone du même réseau local (Wi-Fi) à
  // charger les scripts de `next dev` via l'adresse « Network » affichée au démarrage.
  // Sans ça, la page s'affiche mais sans JavaScript (menu inactif, contenus manquants).
  // Jokers plutôt qu'une IP fixe : l'adresse du PC change d'un réseau à l'autre.
  // N'a aucun effet sur le site en production.
  allowedDevOrigins: ["10.*.*.*", "192.168.*.*", "172.*.*.*"],

  // Qualités autorisées pour next/image. Depuis Next.js 16, seule 75 l'est par défaut : les fonds
  // photo (étagère de la bibliothèque, pages de comptes et forum) demandent 70 et étaient refusés
  // (erreur 400), d'où l'affichage du décor de secours à la place de la photo.
  images: {
    qualities: [70, 75],
  },
};

export default nextConfig;
