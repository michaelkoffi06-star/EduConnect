import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Mode développement uniquement : autorise un téléphone du même réseau local (Wi-Fi) à
  // charger les scripts de `next dev` via l'adresse « Network » affichée au démarrage.
  // Sans ça, la page s'affiche mais sans JavaScript (menu inactif, contenus manquants).
  // Jokers plutôt qu'une IP fixe : l'adresse du PC change d'un réseau à l'autre.
  // N'a aucun effet sur le site en production.
  allowedDevOrigins: ["10.*.*.*", "192.168.*.*", "172.*.*.*"],
};

export default nextConfig;
