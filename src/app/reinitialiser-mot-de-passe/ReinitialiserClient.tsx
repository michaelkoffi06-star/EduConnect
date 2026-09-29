"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AuthShell, ErrorBox, Icon, cardClass, inputClass, labelClass, primaryBtn } from "@/components/compte/ui";

export default function ReinitialiserClient() {
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setToken(new URLSearchParams(window.location.search).get("jeton") || "");
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/compte/reinitialiser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Impossible de changer le mot de passe.");
        return;
      }
      window.location.href = "/mon-compte";
    } catch {
      setError("Impossible de contacter le serveur. Réessaie.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      image="/images/comptes/connexion.jpg"
      position="center 40%"
      kicker="Mon compte EduConnect"
      title="Nouveau mot de passe"
      subtitle="Choisis un mot de passe d'au moins 8 caractères."
      quote={<>Un nouveau départ, <span className="text-[#f0d58a]">en toute sécurité</span>.</>}
      benefits={[
        { icon: Icon.lock(18), text: "Ton mot de passe est chiffré, personne ne peut le lire" },
        { icon: Icon.clock(18), text: "Le lien reçu par email est valable une heure" },
      ]}
    >
      <form onSubmit={handleSubmit} className={`${cardClass} space-y-4`}>
        <div>
          <label className={labelClass} htmlFor="password">Nouveau mot de passe</label>
          <input id="password" type="password" required minLength={8} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="confirm">Confirmation</label>
          <input id="confirm" type="password" required minLength={8} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputClass} />
        </div>
        {error && (
          <ErrorBox>
            {error}{" "}
            <Link href="/connexion" className="font-semibold underline">Connexion</Link>
          </ErrorBox>
        )}
        <button type="submit" disabled={loading || !token} className={primaryBtn}>
          {loading ? "Enregistrement..." : "Enregistrer et me connecter"}
        </button>
      </form>
    </AuthShell>
  );
}
