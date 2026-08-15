"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/**
 * Enveloppe chaque page d'une transition de flou → net + fondu,
 * pour adoucir le passage entre la vitrine et les différentes
 * interfaces de l'app (au lieu d'un changement de page brutal).
 *
 * Important : la toute première page chargée (chargement complet du
 * navigateur, ou premier rendu serveur) s'affiche directement nette —
 * on ne rejoue la transition que sur les navigations client suivantes,
 * pour éviter qu'une page lente à compiler/s'hydrater ne reste visible
 * floutée plus longtemps que prévu.
 */
export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [visible, setVisible] = useState(true);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setVisible(false);
    const frame = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frame);
  }, [pathname]);

  return (
    <div
      style={{
        filter: visible ? "blur(0px)" : "blur(10px)",
        opacity: visible ? 1 : 0,
        transition: "filter 450ms ease, opacity 450ms ease",
      }}
    >
      {children}
    </div>
  );
}
