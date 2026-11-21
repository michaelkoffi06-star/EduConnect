"use client";

import { useEffect, useRef, useState } from "react";

// Étapes de « Comment ça marche » (§7tervicies) : une ligne dorée se dessine entre les étapes à
// mesure que l'on fait défiler la page, et chaque pastille s'allume quand la ligne l'atteint.
// La ligne ne revient jamais en arrière (plus calme), et l'écoute du défilement s'arrête une fois
// la ligne complète. Mouvements réduits : tout est affiché d'emblée.
// Le texte reste visible sans JavaScript ; seule la ligne en dépend.

export interface Step {
  title: string;
  text: string;
}

export default function StepsTimeline({ steps }: { steps: Step[] }) {
  const listRef = useRef<HTMLOListElement>(null);
  const [reached, setReached] = useState(0); // nombre de pastilles allumées

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const last = steps.length - 1;

    let progress = 0;
    let frame = 0;
    const apply = (p: number) => {
      progress = p;
      // Variable CSS lue par les deux lignes (horizontale sur ordinateur, verticale sur téléphone)
      list.style.setProperty("--p", String(p));
      setReached(p >= 0.999 ? steps.length : Math.min(last, Math.floor(p * last + 0.02)) + (p > 0.01 ? 1 : 0));
    };

    // Premier calcul à l'image suivante (pas de mise à jour d'état directement dans l'effet)
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      frame = requestAnimationFrame(() => apply(1));
      return () => cancelAnimationFrame(frame);
    }

    const update = () => {
      frame = 0;
      const rect = list.getBoundingClientRect();
      const vh = window.innerHeight;
      // La ligne commence quand le haut de la liste atteint 85 % de l'écran, et se termine
      // après un défilement égal à la plus grande des deux valeurs (45 % de l'écran, ou la hauteur de la liste)
      const distance = Math.max(vh * 0.45, rect.height * 0.9);
      const p = Math.min(1, Math.max(0, (vh * 0.85 - rect.top) / distance));
      if (p > progress) apply(p);
      if (progress >= 1) window.removeEventListener("scroll", onScroll);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    frame = requestAnimationFrame(update);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [steps.length]);

  return (
    <ol ref={listRef} className="relative grid gap-10 md:grid-cols-3 md:gap-8">
      {/* Ligne horizontale (ordinateur) : du centre de la première pastille au centre de la dernière */}
      <span aria-hidden="true" className="absolute left-[16.67%] right-[16.67%] top-7 hidden h-[2px] rounded-full bg-line md:block">
        <span className="block h-full origin-left rounded-full bg-gold-500" style={{ transform: "scaleX(var(--p, 0))" }} />
      </span>
      {/* Ligne verticale (téléphone) */}
      <span aria-hidden="true" className="absolute bottom-7 left-7 top-7 w-[2px] -translate-x-1/2 rounded-full bg-line md:hidden">
        <span className="block h-full w-full origin-top rounded-full bg-gold-500" style={{ transform: "scaleY(var(--p, 0))" }} />
      </span>

      {steps.map((step, i) => {
        const lit = i < reached;
        return (
          <li key={step.title} className="relative flex gap-5 md:flex-col md:items-center md:text-center">
            <span
              className={`relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 font-[family-name:var(--font-cinzel)] text-lg transition-colors duration-500 ${
                lit ? "border-gold-500 bg-gold-500 text-navy-900" : "border-line bg-white text-gold-700"
              }`}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <div className="pt-2 md:pt-0">
              <h3 className="text-lg font-semibold text-navy-900">{step.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-gray-600 md:mx-auto md:max-w-xs">{step.text}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
