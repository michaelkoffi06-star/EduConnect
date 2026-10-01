"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AuthShell,
  ErrorBox,
  Icon,
  InfoBox,
  SuccessBox,
  cardClass,
  inputClass,
  labelClass,
  primaryBtn,
} from "@/components/compte/ui";

const CONFIRMATION_MESSAGES: Record<string, { ok: boolean; text: string }> = {
  ok: { ok: true, text: "Ton email est confirmé. Tu peux te connecter." },
  invalide: { ok: false, text: "Ce lien de confirmation est invalide. Connecte-toi pour en recevoir un nouveau." },
  expiree: { ok: false, text: "Ce lien de confirmation a expiré. Connecte-toi pour en recevoir un nouveau." },
};

// N'accepte qu'un chemin interne (évite de rediriger vers un autre site après la connexion)
function safeNext(raw: string | null): string {
  return raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : "/mon-compte";
}

export default function ConnexionClient() {
  const [mode, setMode] = useState<"login" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notVerified, setNotVerified] = useState(false);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const [next, setNext] = useState("/mon-compte");
  // Jeton du lien de confirmation d'email : l'adresse est confirmée en même temps que la
  // connexion, avec le mot de passe (voir §7sedecies de la doc)
  const [confirmToken, setConfirmToken] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setNext(safeNext(params.get("suite")));
    const c = params.get("confirmation");
    if (c && CONFIRMATION_MESSAGES[c]) setNotice(CONFIRMATION_MESSAGES[c]);
    const jeton = params.get("jeton");
    if (jeton) {
      setConfirmToken(jeton);
      setNotice({
        ok: true,
        text: "Dernière étape : connecte-toi avec ton email et ton mot de passe pour confirmer ton adresse. Tu n'as pas créé ce compte ou tu as oublié le mot de passe ? Utilise « Mot de passe oublié ».",
      });
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setNotVerified(false);
    setNotice(null);
    setLoading(true);
    try {
      const res = await fetch("/api/compte/connexion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, ...(confirmToken && { confirmationToken: confirmToken }) }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Connexion impossible.");
        setNotVerified(data.code === "EMAIL_NOT_VERIFIED");
        return;
      }
      // Rechargement complet : l'en-tête et les pages relisent la session
      window.location.href = data.confirmed ? "/mon-compte?bienvenue=1" : next;
    } catch {
      setError("Impossible de contacter le serveur. Réessaie.");
    } finally {
      setLoading(false);
    }
  };

  const resendConfirmation = async () => {
    await fetch("/api/compte/renvoyer-confirmation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    }).catch(() => {});
    setError("");
    setNotVerified(false);
    setNotice({ ok: true, text: "Nouveau lien de confirmation envoyé. Pense à regarder dans les spams." });
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/compte/mot-de-passe-oublie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erreur lors de la demande.");
        return;
      }
      setMode("login");
      setNotice({
        ok: true,
        text: "Si un compte existe avec cet email, un lien pour changer ton mot de passe vient d'être envoyé (valable 1 heure).",
      });
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
      title={mode === "login" ? "Bon retour !" : "Mot de passe oublié"}
      subtitle={
        mode === "login" ? (
          <>
            Pas encore de compte ?{" "}
            <Link href="/inscription" className="text-[#8a6510] font-semibold hover:underline">
              Créer un compte
            </Link>
          </>
        ) : (
          "Indique ton email : tu recevras un lien pour choisir un nouveau mot de passe."
        )
      }
      quote={<>Chaque effort d&apos;aujourd&apos;hui prépare la <span className="text-[#f0d58a]">réussite</span> de demain.</>}
      benefits={[
        { icon: Icon.key(18), text: "Retrouve tous les corrigés de la bibliothèque" },
        { icon: Icon.chat(18), text: "Suis tes questions sur le forum" },
        { icon: Icon.briefcase(18), text: "Instructeurs : consultez les nouvelles annonces" },
      ]}
    >
      <div className="space-y-4">
        {notice && (notice.ok ? <SuccessBox>{notice.text}</SuccessBox> : <InfoBox>{notice.text}</InfoBox>)}

        <form key={mode} onSubmit={mode === "login" ? handleLogin : handleForgot} className={`${cardClass} space-y-4 animate-fade-blur`}>
          <div>
            <label className={labelClass} htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
          </div>
          {mode === "login" && (
            <div>
              <label className={labelClass} htmlFor="password">Mot de passe</label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
              />
            </div>
          )}

          {error && (
            <ErrorBox>
              {error}
              {notVerified && (
                <button type="button" onClick={resendConfirmation} className="block mt-2 font-semibold underline">
                  Renvoyer le lien de confirmation
                </button>
              )}
            </ErrorBox>
          )}

          <button type="submit" disabled={loading} className={primaryBtn}>
            {loading ? "Patiente..." : mode === "login" ? "Se connecter" : "Recevoir le lien"}
          </button>
        </form>

        <div className="text-center">
          <button
            type="button"
            onClick={() => { setMode(mode === "login" ? "forgot" : "login"); setError(""); setNotVerified(false); }}
            className="text-sm font-semibold text-[#8a6510] hover:underline"
          >
            {mode === "login" ? "Mot de passe oublié ?" : "Retour à la connexion"}
          </button>
        </div>
      </div>
    </AuthShell>
  );
}
