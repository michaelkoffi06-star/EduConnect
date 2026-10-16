"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ErrorBox, Page, PageTitle, SuccessBox, cardClass, primaryBtn } from "@/components/compte/ui";

// La désinscription demande un clic (POST) plutôt qu'une simple visite du lien : certaines
// messageries ouvrent les liens des emails pour les analyser, ce qui désinscrirait sans le vouloir.
export default function NouveautesClient() {
  const [params, setParams] = useState<{ u: string; s: string } | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const u = p.get("u");
    const s = p.get("s");
    if (u && s) setParams({ u, s });
    else {
      setState("error");
      setError("Lien incomplet. Utilise le lien reçu par email, ou gère tes préférences depuis ton espace.");
    }
  }, []);

  const unsubscribe = async () => {
    if (!params) return;
    setState("loading");
    try {
      const res = await fetch("/api/anglais/nouveautes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Désinscription impossible.");
        setState("error");
        return;
      }
      setState("done");
    } catch {
      setError("Impossible de contacter le serveur. Réessaie.");
      setState("error");
    }
  };

  return (
    <Page>
      <PageTitle kicker="Anglais technique" title="Emails nouveautés" />
      <div className={`${cardClass} space-y-4 text-center`}>
        {state === "done" ? (
          <SuccessBox>C&apos;est fait : tu ne recevras plus les annonces de nouveaux contenus. Les emails liés à ton abonnement (paiement, fin d&apos;abonnement) continuent.</SuccessBox>
        ) : (
          <>
            <p className="text-sm text-gray-600">Tu ne veux plus recevoir d&apos;email quand de nouveaux chapitres ou ressources sont disponibles ?</p>
            {error && <ErrorBox>{error}</ErrorBox>}
            {params && (
              <button type="button" onClick={unsubscribe} disabled={state === "loading"} className={primaryBtn}>
                {state === "loading" ? "Un instant..." : "Ne plus recevoir ces emails"}
              </button>
            )}
          </>
        )}
        <p className="text-xs text-gray-500">
          Tu peux les réactiver à tout moment depuis{" "}
          <Link href="/anglais-technique/mon-abonnement" className="underline">ton abonnement</Link>.
        </p>
      </div>
    </Page>
  );
}
