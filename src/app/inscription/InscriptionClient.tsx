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
  secondaryBtn,
  type AccountRole,
} from "@/components/compte/ui";

const PROFILES: { role: AccountRole; title: string; text: string; icon: React.ReactNode }[] = [
  { role: "ELEVE", title: "Élève", text: "Corrigés et forum pour poser tes questions.", icon: Icon.student(22) },
  { role: "PARENT", title: "Parent", text: "Corrigés pour accompagner votre enfant.", icon: Icon.heart(22) },
  { role: "INSTRUCTEUR", title: "Instructeur", text: "Marché des annonces et salle des profs.", icon: Icon.briefcase(22) },
];

const BENEFITS = [
  { icon: Icon.key(18), text: "Tous les corrigés de la bibliothèque, à lire ou télécharger" },
  { icon: Icon.chat(18), text: "Un forum pour poser ses questions aux instructeurs" },
  { icon: Icon.briefcase(18), text: "Pour les instructeurs : les annonces des familles" },
];

type State = "idle" | "loading" | "sent";

export default function InscriptionClient() {
  const [role, setRole] = useState<AccountRole | null>(null);
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState("");
  const [noInstructor, setNoInstructor] = useState(false);
  const [email, setEmail] = useState("");
  const [resent, setResent] = useState(false);

  // Lien direct vers un profil : /inscription?profil=instructeur
  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get("profil");
    if (p === "eleve") setRole("ELEVE");
    if (p === "parent") setRole("PARENT");
    if (p === "instructeur") setRole("INSTRUCTEUR");
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const values = new FormData(e.currentTarget);
    setError("");
    setNoInstructor(false);

    if (values.get("password") !== values.get("confirm")) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setState("loading");
    try {
      const res = await fetch("/api/compte/inscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          firstName: values.get("firstName"),
          lastName: values.get("lastName"),
          classe: values.get("classe"),
          email: values.get("email"),
          password: values.get("password"),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erreur lors de l'inscription.");
        setNoInstructor(data.code === "NO_INSTRUCTOR");
        setState("idle");
        return;
      }
      setEmail(String(values.get("email") || ""));
      setState("sent");
    } catch {
      setError("Impossible de contacter le serveur. Réessaie.");
      setState("idle");
    }
  };

  const resend = async () => {
    await fetch("/api/compte/renvoyer-confirmation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    }).catch(() => {});
    setResent(true);
  };

  if (state === "sent") {
    return (
      <AuthShell
        image="/images/comptes/inscription.jpg"
        kicker="Presque terminé"
        title="Vérifie ta boîte mail"
        quote={<>Bienvenue dans la <span className="text-[#f0d58a]">communauté</span> EduConnect.</>}
        benefits={BENEFITS}
      >
        <div className={`${cardClass} text-center`}>
          <div className="relative w-20 h-20 mx-auto mb-6">
            <span className="absolute inset-0 rounded-full bg-[#c9951a]/20 animate-ping" />
            <span className="relative w-20 h-20 rounded-full bg-gradient-to-br from-[#c9951a] to-[#e2b94a] text-white flex items-center justify-center shadow-lg">
              {Icon.mail(34)}
            </span>
          </div>
          <p className="text-gray-600 text-sm leading-relaxed">
            Un lien de confirmation a été envoyé à <span className="font-semibold text-[#0d1b3e]">{email}</span>. Clique dessus pour
            activer ton compte. Pense à regarder dans les <span className="font-semibold">spams</span>.
          </p>
          <div className="mt-7 flex flex-col items-center gap-3">
            {resent ? (
              <SuccessBox>Nouvel email envoyé.</SuccessBox>
            ) : (
              <button type="button" onClick={resend} className={secondaryBtn}>
                Je n&apos;ai rien reçu, renvoyer l&apos;email
              </button>
            )}
            <Link href="/connexion" className="text-sm font-semibold text-[#8a6510] hover:underline">
              Aller à la connexion
            </Link>
          </div>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      image="/images/comptes/inscription.jpg"
      position="center 30%"
      kicker="Rejoindre EduConnect"
      title="Créer un compte"
      subtitle={
        <>
          Gratuit, en une minute. Déjà inscrit ?{" "}
          <Link href="/connexion" className="text-[#8a6510] font-semibold hover:underline">Se connecter</Link>
        </>
      }
      quote={<>Apprendre ensemble, <span className="text-[#f0d58a]">progresser</span> plus vite.</>}
      benefits={BENEFITS}
      wide
    >
      <p className={labelClass}>Je suis…</p>
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3 mb-6 stagger">
        {PROFILES.map((p, i) => {
          const selected = role === p.role;
          return (
            <button
              key={p.role}
              type="button"
              style={{ "--i": i } as React.CSSProperties}
              onClick={() => { setRole(p.role); setError(""); setNoInstructor(false); }}
              aria-pressed={selected}
              className={`group relative text-left rounded-2xl p-3 sm:p-4 border transition-all duration-300 ${
                selected
                  ? "border-[#c9951a] bg-gradient-to-br from-white to-[#fbf1d8] shadow-[0_14px_30px_-14px_rgba(201,149,26,0.7)] -translate-y-0.5"
                  : "border-[#eee6d3] bg-white/80 hover:border-[#c9951a]/60 hover:-translate-y-0.5 hover:shadow-md"
              }`}
            >
              {selected && (
                <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#c9951a] text-white flex items-center justify-center shadow animate-fade-blur">
                  {Icon.check(14)}
                </span>
              )}
              <span className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${selected ? "bg-[#c9951a] text-white" : "bg-[#faf3e0] text-[#8a6510] group-hover:bg-[#c9951a]/15"}`}>
                {p.icon}
              </span>
              <span className="block mt-3 font-bold text-[#0d1b3e] text-sm">{p.title}</span>
              <span className="hidden sm:block text-xs text-gray-600 mt-1 leading-snug">{p.text}</span>
            </button>
          );
        })}
      </div>

      {!role && (
        <p className="text-center text-sm text-gray-500 py-6 animate-fade-blur">Choisis ton profil pour continuer.</p>
      )}

      {role === "INSTRUCTEUR" && (
        <div key="info-instructeur" className="mb-5">
          <InfoBox>
            <p className="font-semibold text-[#0d1b3e]">Pas encore inscrit comme instructeur ?</p>
            <p className="mt-0.5">
              <Link href="/register-instructor" className="text-[#8a6510] font-semibold hover:underline">Déposez votre candidature</Link>{" "}
              (photo, CNI, CV) : votre compte est créé en même temps. Déjà inscrit ? Créez votre accès ci-dessous avec{" "}
              <span className="font-semibold">l&apos;email de votre fiche instructeur</span>.
            </p>
          </InfoBox>
        </div>
      )}

      {role && (
        <form key={role} onSubmit={handleSubmit} className="space-y-5 animate-fade-blur">
          <div className={`${cardClass} space-y-4`}>
            {role !== "INSTRUCTEUR" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass} htmlFor="firstName">Prénom</label>
                  <input id="firstName" name="firstName" required maxLength={60} autoComplete="given-name" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass} htmlFor="lastName">Nom</label>
                  <input id="lastName" name="lastName" required maxLength={60} autoComplete="family-name" className={inputClass} />
                </div>
              </div>
            )}
            {role === "ELEVE" && (
              <div>
                <label className={labelClass} htmlFor="classe">
                  Classe <span className="text-gray-400 font-normal">(optionnel)</span>
                </label>
                <input id="classe" name="classe" maxLength={30} placeholder="3e, Tle D, CM2…" className={inputClass} />
              </div>
            )}
            <div>
              <label className={labelClass} htmlFor="email">
                Email{role === "INSTRUCTEUR" && <span className="text-gray-400 font-normal"> (celui de votre fiche instructeur)</span>}
              </label>
              <input id="email" name="email" type="email" required autoComplete="email" placeholder="exemple@email.com" className={inputClass} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass} htmlFor="password">Mot de passe</label>
                <input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" className={inputClass} />
              </div>
              <div>
                <label className={labelClass} htmlFor="confirm">Confirmation</label>
                <input id="confirm" name="confirm" type="password" required minLength={8} autoComplete="new-password" className={inputClass} />
              </div>
            </div>
            <p className="text-xs text-gray-500">8 caractères minimum.</p>
          </div>

          {error && (
            <ErrorBox>
              {error}
              {noInstructor && (
                <>
                  {" "}
                  <Link href="/register-instructor" className="font-semibold underline">Devenir instructeur</Link>
                </>
              )}
            </ErrorBox>
          )}

          <button type="submit" disabled={state === "loading"} className={primaryBtn}>
            {state === "loading" ? "Création en cours..." : "Créer mon compte"}
          </button>
          <p className="text-xs text-gray-500 text-center">
            En créant un compte, tu acceptes notre{" "}
            <Link href="/confidentialite" className="underline">politique de confidentialité</Link>.
          </p>
        </form>
      )}
    </AuthShell>
  );
}
