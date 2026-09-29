"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/**
 * Fondu entre les pages, en deux temps :
 * 1. Sortie — au clic sur un lien interne, la page actuelle s'efface (flou + transparence),
 *    puis la navigation est lancée.
 * 2. Entrée — dès que la nouvelle page est là, elle apparaît du flou vers le net.
 *
 * Les deux temps sont des animations CSS (@keyframes pageLeave / pageEnter dans globals.css),
 * qui démarrent dès qu'elles sont appliquées. Une première version basculait des transitions
 * via requestAnimationFrame : quand le navigateur ne produit pas d'image (onglet en arrière-plan,
 * appareil chargé), la nouvelle page pouvait rester invisible.
 *
 * Les navigations complètes (rechargement, redirection après connexion via window.location)
 * sont adoucies par les « view transitions » du navigateur (@view-transition dans globals.css).
 *
 * La toute première page chargée s'affiche directement nette. Au repos, aucune animation,
 * aucun filtre ni transformation n'est appliqué : un filtre actif en permanence dérèglerait
 * les éléments `position: fixed` et `backdrop-blur` de la page.
 */

const LEAVE_MS = 220;
const ENTER_MS = 450;

type Phase = "idle" | "leaving" | "entering";

const STYLES: Record<Phase, React.CSSProperties> = {
  idle: {},
  leaving: { animation: `pageLeave ${LEAVE_MS}ms ease both`, willChange: "opacity, transform" },
  entering: { animation: `pageEnter ${ENTER_MS}ms cubic-bezier(0.22, 1, 0.36, 1) both`, willChange: "opacity, transform" },
};

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// Lien interne vers une autre page de l'application (pas une API, un fichier, un nouvel onglet,
// ni la page actuelle : un simple changement de filtre ou d'ancre ne doit pas effacer la page)
function internalTarget(e: MouseEvent): URL | null {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return null;
  const a = (e.target as Element | null)?.closest?.("a");
  if (!a || !a.href || a.hasAttribute("download")) return null;
  if (a.target && a.target !== "_self") return null;
  const url = new URL(a.href, window.location.href);
  if (url.origin !== window.location.origin) return null;
  if (url.pathname.startsWith("/api/") || /\.[a-z0-9]+$/i.test(url.pathname)) return null;
  if (url.pathname === window.location.pathname) return null;
  return url;
}

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("idle");
  const isFirstRender = useRef(true);
  const timers = useRef<number[]>([]);

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };
  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };

  // Sortie : on intercepte les clics sur les liens internes (phase de capture, avant next/link)
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const url = internalTarget(e);
      if (!url || prefersReducedMotion()) return;
      e.preventDefault();
      clearTimers();
      setPhase("leaving");
      later(() => router.push(`${url.pathname}${url.search}${url.hash}`), LEAVE_MS);
      // Filet de sécurité : si la navigation n'aboutit pas, la page réapparaît
      later(() => setPhase("idle"), 5000);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [router]);

  // Entrée : la nouvelle page part du flou et devient nette
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    clearTimers();
    if (prefersReducedMotion()) {
      setPhase("idle");
      return;
    }
    setPhase("entering");
    // Retour au repos à la fin de l'animation (onAnimationEnd). Filet de sécurité large : un
    // délai trop court couperait l'animation quand l'appareil est occupé à afficher la page.
    later(() => setPhase("idle"), ENTER_MS + 2000);
  }, [pathname]);

  useEffect(() => clearTimers, []);

  return (
    <div
      style={STYLES[phase]}
      onAnimationEnd={(e) => {
        // Les animations des éléments de la page remontent aussi jusqu'ici : on ne réagit qu'à la nôtre
        if (e.target === e.currentTarget && e.animationName === "pageEnter") setPhase("idle");
      }}
    >
      {children}
    </div>
  );
}
