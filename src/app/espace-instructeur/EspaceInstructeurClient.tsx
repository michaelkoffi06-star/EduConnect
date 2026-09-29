"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BackLink,
  ErrorBox,
  Icon,
  InfoBox,
  Page,
  PageHero,
  SkeletonCards,
  cardClass,
  inputClass,
  smallBtn,
  useAccount,
} from "@/components/compte/ui";

// Espace instructeur : le marché des annonces publiées par l'équipe (besoins des familles,
// sans leurs coordonnées). L'instructeur se positionne ; l'équipe choisit et le contacte.
// Voir §7quindecies de la doc.

type Level = "PRIMAIRE" | "COLLEGE" | "LYCEE" | "ALL";
type Mode = "DOMICILE" | "EN_LIGNE" | "LES_DEUX";
type InterestStatus = "PENDING" | "SELECTED" | "DECLINED";

interface Offer {
  id: string;
  title: string;
  level: Level;
  classe: string | null;
  mode: Mode;
  city: string | null;
  commune: string | null;
  schedule: string | null;
  budget: string | null;
  description: string | null;
  status: "OPEN" | "FILLED" | "CLOSED";
  createdAt: string;
  subject: { id: string; name: string };
  interestCount: number;
  myInterest: { id: string; status: InterestStatus; message: string | null; createdAt: string } | null;
}

const LEVEL_LABELS: Record<Level, string> = { PRIMAIRE: "Primaire", COLLEGE: "Collège", LYCEE: "Lycée", ALL: "Tous niveaux" };
const MODE_LABELS: Record<Mode, string> = { DOMICILE: "À domicile", EN_LIGNE: "En ligne", LES_DEUX: "Domicile ou en ligne" };
const INTEREST_LABELS: Record<InterestStatus, { text: string; cls: string }> = {
  PENDING: { text: "Candidature envoyée", cls: "bg-amber-50 text-amber-800 border-amber-300" },
  SELECTED: { text: "Vous avez été retenu(e) !", cls: "bg-emerald-50 text-emerald-800 border-emerald-300" },
  DECLINED: { text: "Non retenu(e) cette fois", cls: "bg-gray-50 text-gray-600 border-gray-300" },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
}

const GOLD_PILL =
  "inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#c9951a] to-[#d4a820] text-white text-sm font-semibold shadow-[0_10px_24px_-12px_rgba(201,149,26,0.9)] hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 transition-all";

function OfferCard({ offer, onChange, index }: { offer: Offer; onChange: (o: Offer) => void; index: number }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const apply = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/espace-instructeur/annonces/${offer.id}/interet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onChange({ ...offer, myInterest: data, interestCount: offer.interestCount + 1 });
      setOpen(false);
    } catch (err: any) {
      setError(err.message || "Impossible d'envoyer votre candidature.");
    } finally {
      setBusy(false);
    }
  };

  const withdraw = async () => {
    if (!window.confirm("Retirer votre candidature pour cette annonce ?")) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/espace-instructeur/annonces/${offer.id}/interet`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error);
      onChange({ ...offer, myInterest: null, interestCount: Math.max(0, offer.interestCount - 1) });
    } catch (err: any) {
      setError(err.message || "Impossible de retirer votre candidature.");
    } finally {
      setBusy(false);
    }
  };

  const place = [offer.commune, offer.city].filter(Boolean).join(", ");

  const chips: { icon: React.ReactNode; text: string }[] = [
    { icon: Icon.student(15), text: offer.classe || LEVEL_LABELS[offer.level] },
    { icon: Icon.home(15), text: MODE_LABELS[offer.mode] },
    ...(place ? [{ icon: Icon.pin(15), text: place }] : []),
    ...(offer.schedule ? [{ icon: Icon.clock(15), text: offer.schedule }] : []),
    ...(offer.budget ? [{ icon: Icon.coins(15), text: offer.budget }] : []),
  ];

  return (
    <article
      style={{ "--i": index } as React.CSSProperties}
      className={`${cardClass} relative overflow-hidden space-y-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_30px_60px_-25px_rgba(13,27,62,0.35)]`}
    >
      <span className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-[#c9951a] to-[#e2b94a]" aria-hidden="true" />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <span className="shrink-0 w-11 h-11 rounded-2xl bg-[#faf3e0] text-[#8a6510] flex items-center justify-center">{Icon.book(20)}</span>
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-[#c9951a] uppercase tracking-[0.14em]">{offer.subject.name}</span>
            <h2 className="text-lg font-bold text-[#0d1b3e] leading-snug">{offer.title}</h2>
          </div>
        </div>
        <span className="text-xs text-gray-500 bg-[#faf8f2] border border-[#eee6d3] rounded-full px-3 py-1">Publiée le {formatDate(offer.createdAt)}</span>
      </div>

      <ul className="flex flex-wrap gap-2">
        {chips.map((c) => (
          <li key={c.text} className="inline-flex items-center gap-1.5 text-xs font-medium text-[#2b3550] bg-white border border-[#eee6d3] rounded-full px-3 py-1.5">
            <span className="text-[#c9951a]">{c.icon}</span>
            {c.text}
          </li>
        ))}
      </ul>
      {offer.description && <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{offer.description}</p>}

      <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-[#eee6d3]">
        {offer.myInterest ? (
          <>
            <span className={`text-xs font-semibold border rounded-full px-3 py-1 ${INTEREST_LABELS[offer.myInterest.status].cls}`}>
              {INTEREST_LABELS[offer.myInterest.status].text}
            </span>
            {offer.myInterest.status === "PENDING" && (
              <button type="button" disabled={busy} onClick={withdraw} className="text-xs text-gray-500 hover:text-red-600 hover:underline">
                Retirer ma candidature
              </button>
            )}
          </>
        ) : offer.status !== "OPEN" ? (
          <span className="text-xs text-gray-500">Annonce clôturée</span>
        ) : open ? (
          <div className="w-full space-y-3 animate-fade-blur">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              maxLength={1000}
              placeholder="Un mot pour l'équipe (optionnel) : disponibilités, expérience avec ce niveau…"
              className={`${inputClass} resize-none`}
            />
            <div className="flex gap-2">
              <button type="button" disabled={busy} onClick={apply} className={GOLD_PILL}>
                {busy ? "Envoi..." : "Envoyer ma candidature"}
              </button>
              <button type="button" onClick={() => setOpen(false)} className={smallBtn}>Annuler</button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => setOpen(true)} className={GOLD_PILL}>
            {Icon.sparkle(16)} Je suis intéressé(e)
          </button>
        )}
        {offer.interestCount > 0 && (
          <span className="text-xs text-gray-500 ml-auto">
            {offer.interestCount} instructeur{offer.interestCount > 1 ? "s" : ""} positionné{offer.interestCount > 1 ? "s" : ""}
          </span>
        )}
      </div>
      {error && <ErrorBox>{error}</ErrorBox>}
    </article>
  );
}

export default function EspaceInstructeurClient() {
  const { user, loading } = useAccount();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [mySubjectIds, setMySubjectIds] = useState<string[]>([]);
  const [offersLoading, setOffersLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"ouvertes" | "miennes">("ouvertes");
  const [onlyMine, setOnlyMine] = useState(true);

  useEffect(() => {
    if (!loading && !user) window.location.href = "/connexion?suite=/espace-instructeur";
  }, [loading, user]);

  useEffect(() => {
    if (!user?.isApprovedInstructor) return;
    fetch("/api/espace-instructeur/annonces")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setOffers(data.offers);
        setMySubjectIds(data.mySubjectIds);
      })
      .catch((err) => setError(err.message || "Impossible de charger les annonces."))
      .finally(() => setOffersLoading(false));
  }, [user?.isApprovedInstructor]);

  const visible = useMemo(() => {
    if (tab === "miennes") return offers.filter((o) => o.myInterest);
    return offers.filter((o) => o.status === "OPEN" && (!onlyMine || mySubjectIds.includes(o.subject.id)));
  }, [offers, tab, onlyMine, mySubjectIds]);

  const updateOffer = (o: Offer) => setOffers((prev) => prev.map((x) => (x.id === o.id ? o : x)));

  if (loading || !user) {
    return (
      <Page width="max-w-3xl">
        <SkeletonCards count={3} />
      </Page>
    );
  }

  if (!user.isApprovedInstructor) {
    return (
      <PageHero
        image="/images/comptes/espace-instructeur.jpg"
        position="center 35%"
        kicker="Espace instructeur"
        title="Marché des annonces"
        width="max-w-3xl"
      >
        <InfoBox>
          {user.role !== "INSTRUCTEUR" ? (
            <>
              Cet espace est réservé aux instructeurs EduConnect.{" "}
              <Link href="/register-instructor" className="font-semibold text-[#8a6510] hover:underline">Devenir instructeur</Link>
            </>
          ) : user.instructorStatus === "SUSPENDED" ? (
            "Votre profil instructeur est suspendu : le marché des annonces vous est fermé. Contactez l'équipe EduConnect."
          ) : (
            "Votre profil instructeur est en attente de validation. Le marché des annonces s'ouvrira dès que l'équipe l'aura approuvé."
          )}
        </InfoBox>
        <p className="text-center mt-6">
          <BackLink href="/mon-compte">Mon compte</BackLink>
        </p>
      </PageHero>
    );
  }

  const openCount = offers.filter((o) => o.status === "OPEN").length;
  const mineCount = offers.filter((o) => o.myInterest).length;
  const selectedCount = offers.filter((o) => o.myInterest?.status === "SELECTED").length;

  return (
    <PageHero
      image="/images/comptes/espace-instructeur.jpg"
      position="center 35%"
      kicker="Espace instructeur"
      title={<>Marché des <span className="text-[#c9951a]">annonces</span></>}
      subtitle="Des familles cherchent un instructeur. Positionnez-vous : l'équipe EduConnect choisit et vous contacte par WhatsApp."
      width="max-w-4xl"
      aside={
        <div className="animate-float-y bg-white/90 backdrop-blur-xl border border-white rounded-[2rem] px-6 py-5 shadow-[0_20px_60px_-15px_rgba(13,27,62,0.3)] grid grid-cols-3 gap-5 text-center">
          {[
            [openCount, "ouvertes"],
            [mineCount, "candidatures"],
            [selectedCount, "retenu(e)"],
          ].map(([n, label]) => (
            <div key={label as string}>
              <div className="font-[family-name:var(--font-cinzel)] text-3xl text-[#0d1b3e] leading-none">{n}</div>
              <div className="text-[11px] text-gray-500 mt-1.5">{label}</div>
            </div>
          ))}
        </div>
      }
    >
      <div className="flex flex-wrap items-center gap-3 mb-6 bg-white/80 backdrop-blur-xl border border-[#eee6d3] rounded-full p-1.5 pr-4 shadow-sm w-full sm:w-auto sm:inline-flex">
        {([
          ["ouvertes", `Annonces ouvertes (${openCount})`],
          ["miennes", `Mes candidatures (${mineCount})`],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            type="button"
            aria-pressed={tab === value}
            onClick={() => setTab(value)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
              tab === value ? "bg-[#0d1b3e] text-white shadow-md" : "text-gray-600 hover:text-[#0d1b3e]"
            }`}
          >
            {label}
          </button>
        ))}
        {tab === "ouvertes" && mySubjectIds.length > 0 && (
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input type="checkbox" checked={onlyMine} onChange={(e) => setOnlyMine(e.target.checked)} className="accent-[#c9951a] w-4 h-4" />
            Mes matières
          </label>
        )}
      </div>

      {error && <ErrorBox>{error}</ErrorBox>}

      {offersLoading ? (
        <SkeletonCards count={3} />
      ) : visible.length === 0 ? (
        <div key={`vide-${tab}`} className="animate-fade-blur text-center py-16 px-6 bg-white/70 backdrop-blur border border-dashed border-[#e2d5b4] rounded-[2rem]">
          <span className="mx-auto mb-4 w-14 h-14 rounded-2xl bg-[#faf3e0] text-[#c9951a] flex items-center justify-center">{Icon.briefcase(26)}</span>
          <p className="text-gray-600 text-sm">
            {tab === "miennes"
              ? "Vous ne vous êtes encore positionné(e) sur aucune annonce."
              : onlyMine && openCount > 0
                ? "Aucune annonce ouverte dans vos matières pour le moment."
                : "Aucune annonce ouverte pour le moment. Revenez bientôt !"}
          </p>
          {tab === "ouvertes" && onlyMine && openCount > 0 && (
            <button type="button" onClick={() => setOnlyMine(false)} className="mt-3 text-sm text-[#8a6510] hover:underline">
              Voir toutes les annonces
            </button>
          )}
        </div>
      ) : (
        <div key={`liste-${tab}-${onlyMine}`} className="space-y-5 stagger">
          {visible.map((o, i) => (
            <OfferCard key={o.id} offer={o} onChange={updateOffer} index={i} />
          ))}
        </div>
      )}

      <p className="text-center mt-10">
        <BackLink href="/mon-compte">Mon compte</BackLink>
      </p>
    </PageHero>
  );
}
