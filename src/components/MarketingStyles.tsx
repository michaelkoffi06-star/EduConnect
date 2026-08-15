"use client";

import { useEffect } from "react";

const STYLESHEETS = [
  "https://fonts.googleapis.com/css2?family=Cinzel:wght@700&family=Poppins:wght@300;400;500;600;700&display=swap",
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css",
  "/marketing/css/variables.css",
  "/marketing/css/base.css",
  "/marketing/css/buttons.css",
  "/marketing/css/hero.css",
  "/marketing/css/stats.css",
  "/marketing/css/services.css",
  "/marketing/css/timeline.css",
  "/marketing/css/why-us.css",
  "/marketing/css/subjects.css",
  "/marketing/css/tutors.css",
  "/marketing/css/testimonials.css",
  "/marketing/css/faq.css",
  "/marketing/css/cta.css",
  "/marketing/css/contact.css",
  "/marketing/css/footer.css",
  "/marketing/css/animations.css",
  "/marketing/css/responsive.css",
];

/**
 * Charge les feuilles de style du site vitrine uniquement quand ce composant
 * est monté (donc uniquement sur la route "/"), et les retire au démontage
 * pour ne jamais affecter le style des autres pages (register-instructor, admin...).
 */
export default function MarketingStyles() {

  useEffect(() => {

    const addedLinks: HTMLLinkElement[] = [];

    STYLESHEETS.forEach((href) => {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      link.dataset.marketingStyle = "true";
      document.head.appendChild(link);
      addedLinks.push(link);
    });

    return () => {
      addedLinks.forEach((link) => link.remove());
    };

  }, []);

  return null;
}
