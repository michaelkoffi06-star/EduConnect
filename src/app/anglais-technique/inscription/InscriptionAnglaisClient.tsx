"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { EnglishManual, EnglishPlan } from "@prisma/client";
import { MANUALS, PLANS, formatFcfa } from "@/lib/english-plans";
import {
  AuthShell,
  ErrorBox,
  Icon,
  InfoBox,
  SuccessBox,
  Spinner,
  cardClass,
  inputClass,
  labelClass,
  primaryBtn,
  secondaryBtn,
  useAccount,
} from "@/components/compte/ui";

// Inscription à la version pro de l'anglais technique (§7novodecies) : manuel + formule + études,
// puis création du compte (si besoin) et paiement Mobile Money depuis « Mon abonnement ».

const BENEFITS = [
  { icon: Icon.book(18), text: "Tous les chapitres du manuel, avec audio et corrigés" },
  { icon: Icon.coins(18), text: "Paiement par Mobile Money : Wave, Orange, MTN, Moov" },
  { icon: Icon.clock(18), text: "Rappel une semaine avant la fin de ton abonnement" },
];

const MANUAL_ICONS: Record<EnglishManual, React.ReactNode> = { A: Icon.key(22), B: Icon.pen(22) };
const SUITE = "/anglais-technique/inscription";

type State = "idle" | "loading" | "sent";

function optionClass(selected: boolean, disabled = false) {
  if (disabled) return "relative text-left rounded-2xl p-4 border border-dashed border-[#e5dcc6] bg-white/50 opacity-70 cursor-not-allowed";
  return `group relative text-left rounded-2xl p-4 border transition-all duration-300 ${
    selected
      ? "border-[#c9951a] bg-gradient-to-br from-white to-[#fbf1d8] shadow-[0_14px_30px_-14px_rgba(201,149,26,0.7)] -translate-y-0.5"
      : "border-[#eee6d3] bg-white/80 hover:border-[#c9951a]/60 hover:-translate-y-0.5 hover:shadow-md"
  }`;
}

function Check() {
  return (
    <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#c9951a] text-white flex items-center justify-center shadow animate-fade-blur">
      {Icon.check(14)}
    </span>
  );
}

export default function InscriptionAnglaisClient({ openPlans }: { openPlans: EnglishPlan[] }) {
  const { user, loading } = useAccount();
  const [manual, setManual] = useState<EnglishManual | null>(null);
  const [plan, setPlan] = useState<EnglishPlan | null>(null);
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState("");
  const [accountExists, setAccountExists] = useState(false);
  const [email, setEmail] = useState("");
  const [resent, setResent] = useState(false);

  // Lien direct : /anglais-technique/inscription?manuel=B&formule=SPRINT
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const m = params.get("manuel");
    const f = params.get("formule");
    if (m === "A" || m === "B") setManual(m);
    if (f && f in PLANS && openPlans.includes(f as EnglishPlan)) setPlan(f as EnglishPlan);
  }, [openPlans]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const values = new FormData(e.currentTarget);
    setError("");
    setAccountExists(false);
    if (!manual || !plan) {
      setError("Choisis un manuel et une formule.");
      return;
    }
    if (!user && values.get("password") !== values.get("confirm")) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setState("loading");
    try {
      const res = await fetch("/api/anglais/inscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          manual,
          plan,
          studyField: values.get("studyField"),
          newsOptIn: values.get("newsOptIn") === "on",
          ...(!user && {
            firstName: values.get("firstName"),
            lastName: values.get("lastName"),
            email: values.get("email"),
            password: values.get("password"),
          }),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erreur lors de l'inscription.");
        setAccountExists(data.code === "ACCOUNT_EXISTS");
        setState("idle");
        return;
      }
      if (data.account === "existing") {
        window.location.href = "/anglais-technique/mon-abonnement?nouveau=1";
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

  const shell = (children: React.ReactNode, title = "S'inscrire à la version pro", subtitle?: React.ReactNode) => (
    <AuthShell
      image="/images/comptes/inscription.jpg"
      position="center 30%"
      kicker="Anglais technique"
      title={title}
      subtitle={subtitle}
      quote={<>L&apos;anglais de ton <span className="text-[#f0d58a]">métier</span>, à ton rythme.</>}
      benefits={BENEFITS}
      wide
    >
      {children}
    </AuthShell>
  );

  if (state === "sent") {
    return shell(
      <div className={`${cardClass} text-center`}>
        <div className="relative w-20 h-20 mx-auto mb-6">
          <span className="absolute inset-0 rounded-full bg-[#c9951a]/20 animate-ping" />
          <span className="relative w-20 h-20 rounded-full bg-gradient-to-br from-[#c9951a] to-[#e2b94a] text-white flex items-center justify-center shadow-lg">
            {Icon.mail(34)}
          </span>
        </div>
        <p className="text-gray-600 text-sm leading-relaxed">
          Ton inscription est enregistrée. Un lien de confirmation a été envoyé à{" "}
          <span className="font-semibold text-[#0d1b3e]">{email}</span>. Clique dessus et connecte-toi : tu arriveras sur ton
          espace d&apos;abonnement avec les numéros de paiement. Pense à regarder dans les <span className="font-semibold">spams</span>.
        </p>
        <div className="mt-7 flex flex-col items-center gap-3">
          {resent ? (
            <SuccessBox>Nouvel email envoyé.</SuccessBox>
          ) : (
            <button type="button" onClick={resend} className={secondaryBtn}>
              Je n&apos;ai rien reçu, renvoyer l&apos;email
            </button>
          )}
        </div>
      </div>,
      "Vérifie ta boîte mail"
    );
  }

  if (loading) {
    return shell(<Spinner />);
  }

  const subtitle = user ? (
    <>Connecté en tant que <span className="font-semibold text-[#0d1b3e]">{user.firstName} {user.lastName}</span>.</>
  ) : (
    <>
      Déjà un compte EduConnect ?{" "}
      <Link href={`/connexion?suite=${encodeURIComponent(SUITE)}`} className="text-[#8a6510] font-semibold hover:underline">Se connecter</Link>
    </>
  );

  if (openPlans.length === 0) {
    return shell(
      <div className="space-y-5">
        <InfoBox>
          <p className="font-semibold text-[#0d1b3e]">Les inscriptions ouvrent bientôt.</p>
          <p className="mt-0.5">En attendant, le chapitre 1 est gratuit.</p>
        </InfoBox>
        <Link href="/anglais-technique" className={`${secondaryBtn} inline-block`}>Voir le chapitre gratuit</Link>
      </div>,
      undefined,
      subtitle
    );
  }

  return shell(
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <p className={labelClass}>1. Le manuel</p>
        <div className="grid sm:grid-cols-2 gap-3 stagger">
          {(Object.keys(MANUALS) as EnglishManual[]).map((m, i) => {
            const selected = manual === m;
            return (
              <button key={m} type="button" style={{ "--i": i } as React.CSSProperties} onClick={() => setManual(m)} aria-pressed={selected} className={optionClass(selected)}>
                {selected && <Check />}
                <span className={`w-10 h-10 rounded-xl flex items-center justify-center ${selected ? "bg-[#c9951a] text-white" : "bg-[#faf3e0] text-[#8a6510]"}`}>
                  {MANUAL_ICONS[m]}
                </span>
                <span className="block mt-3 font-bold text-[#0d1b3e] text-sm">{MANUALS[m].label.split(" · ")[0]}</span>
                <span className="block text-xs text-gray-600 mt-1 leading-snug">{MANUALS[m].short}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className={labelClass}>2. La formule</p>
        <div className="grid sm:grid-cols-2 gap-3 stagger">
          {(Object.keys(PLANS) as EnglishPlan[]).map((p, i) => {
            const info = PLANS[p];
            const open = openPlans.includes(p);
            const selected = plan === p;
            return (
              <button
                key={p}
                type="button"
                disabled={!open}
                style={{ "--i": i } as React.CSSProperties}
                onClick={() => setPlan(p)}
                aria-pressed={selected}
                className={optionClass(selected, !open)}
              >
                {selected && <Check />}
                <span className="flex items-baseline justify-between gap-2">
                  <span className="font-bold text-[#0d1b3e] text-sm">{info.label}</span>
                  <span className="text-[11px] font-semibold text-[#8a6510]">{info.durationLabel}</span>
                </span>
                <span className="block text-xs text-gray-600 mt-1 leading-snug">{info.text}</span>
                <span className="block mt-2 text-sm font-bold text-[#0d1b3e]">
                  {open && info.priceFcfa !== null ? formatFcfa(info.priceFcfa) : <span className="text-xs font-semibold text-gray-400">Bientôt disponible</span>}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className={`${cardClass} space-y-4`}>
        <p className="font-bold text-[#0d1b3e] text-sm">3. Toi</p>
        {!user && (
          <>
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
            <div>
              <label className={labelClass} htmlFor="email">Email</label>
              <input id="email" name="email" type="email" required maxLength={200} autoComplete="email" placeholder="exemple@email.com" className={inputClass} />
            </div>
          </>
        )}
        <div>
          <label className={labelClass} htmlFor="studyField">Tes études ou ton métier</label>
          <input
            id="studyField"
            name="studyField"
            required
            maxLength={80}
            placeholder="BTS Réseaux informatiques, Licence 2 Génie logiciel, développeur…"
            className={inputClass}
          />
        </div>
        {!user && (
          <>
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
          </>
        )}
        <label className="flex items-start gap-3 text-sm text-gray-700 cursor-pointer">
          <input type="checkbox" name="newsOptIn" defaultChecked className="mt-1 accent-[#c9951a]" />
          <span>M&apos;écrire quand de nouveaux chapitres ou ressources sont disponibles (désinscription en un clic).</span>
        </label>
      </div>

      {error && (
        <ErrorBox>
          {error}
          {accountExists && (
            <>
              {" "}
              <Link href={`/connexion?suite=${encodeURIComponent(SUITE)}`} className="font-semibold underline">Se connecter</Link>
            </>
          )}
        </ErrorBox>
      )}

      <button type="submit" disabled={state === "loading" || !manual || !plan} className={primaryBtn}>
        {state === "loading" ? "Inscription en cours..." : "S'inscrire et passer au paiement"}
      </button>
      <p className="text-xs text-gray-500 text-center">
        Le paiement se fait ensuite par Mobile Money ; ton abonnement démarre dès que l&apos;équipe a confirmé la réception.
        En t&apos;inscrivant, tu acceptes notre <Link href="/confidentialite" className="underline">politique de confidentialité</Link>.
      </p>
    </form>,
    undefined,
    subtitle
  );
}
