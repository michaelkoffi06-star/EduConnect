"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { EnglishManual, EnglishPlan, EnglishSubscriptionStatus } from "@prisma/client";
import { MANUALS, PAYMENT_METHODS, formatFcfa, subscriptionLabel, type PaymentMethod } from "@/lib/english-plans";
import {
  ErrorBox,
  Icon,
  InfoBox,
  PageHero,
  SkeletonCards,
  SuccessBox,
  cardClass,
  inputClass,
  labelClass,
  smallBtn,
} from "@/components/compte/ui";

// Espace abonnement de l'anglais technique (§7novodecies) : statut, instructions de paiement
// Mobile Money, déclaration de la transaction, renouvellement et emails « nouveautés ».

interface Subscription {
  id: string;
  manual: EnglishManual;
  plan: EnglishPlan;
  status: EnglishSubscriptionStatus;
  priceFcfa: number;
  reference: string;
  paymentMethod: PaymentMethod | null;
  transactionId: string | null;
  declaredAt: string | null;
  adminNote: string | null;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
}

interface Data {
  subscriptions: Subscription[];
  paymentNumbers: { method: PaymentMethod; label: string; number: string }[];
  openPlans: EnglishPlan[];
  studyField: string;
  newsOptIn: boolean;
}

const STATUS: Record<EnglishSubscriptionStatus, { label: string; tone: string }> = {
  PENDING_PAYMENT: { label: "En attente de paiement", tone: "bg-amber-50 text-amber-800 ring-amber-200" },
  PAYMENT_DECLARED: { label: "Paiement en vérification", tone: "bg-sky-50 text-sky-800 ring-sky-200" },
  ACTIVE: { label: "Actif", tone: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  EXPIRED: { label: "Terminé", tone: "bg-gray-100 text-gray-600 ring-gray-200" },
  CANCELLED: { label: "Annulé", tone: "bg-gray-100 text-gray-600 ring-gray-200" },
};

const DAY = 24 * 60 * 60 * 1000;

function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Abidjan" });
}

function renewHref(s: Subscription) {
  return `/anglais-technique/inscription?manuel=${s.manual}&formule=${s.plan}`;
}

function PaymentForm({ sub, numbers, onDone }: { sub: Subscription; numbers: Data["paymentNumbers"]; onDone: () => void }) {
  const [method, setMethod] = useState<PaymentMethod | "">(sub.paymentMethod ?? (numbers.length === 1 ? numbers[0].method : ""));
  const [transactionId, setTransactionId] = useState(sub.transactionId ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await fetch(`/api/anglais/abonnements/${sub.id}/paiement`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method, transactionId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Déclaration impossible.");
        return;
      }
      onDone();
    } catch {
      setError("Impossible de contacter le serveur. Réessaie.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3 pt-4 border-t border-[#eee6d3]">
      <p className="text-sm font-semibold text-[#0d1b3e]">
        {sub.status === "PAYMENT_DECLARED" ? "Corriger ma déclaration" : "J'ai payé : je déclare ma transaction"}
      </p>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className={labelClass} htmlFor={`method-${sub.id}`}>Moyen de paiement</label>
          <select id={`method-${sub.id}`} required value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)} className={inputClass}>
            <option value="">Choisir…</option>
            {(Object.keys(PAYMENT_METHODS) as PaymentMethod[]).map((m) => (
              <option key={m} value={m}>{PAYMENT_METHODS[m]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor={`tx-${sub.id}`}>Identifiant de transaction</label>
          <input
            id={`tx-${sub.id}`}
            required
            minLength={4}
            maxLength={60}
            value={transactionId}
            onChange={(e) => setTransactionId(e.target.value)}
            placeholder="Dans le SMS de confirmation"
            className={inputClass}
          />
        </div>
      </div>
      {error && <ErrorBox>{error}</ErrorBox>}
      <button type="submit" disabled={saving} className={smallBtn}>
        {saving ? "Envoi..." : "Envoyer à l'équipe"}
      </button>
    </form>
  );
}

function SubscriptionCard({ sub, data, reload }: { sub: Subscription; data: Data; reload: () => void }) {
  const status = STATUS[sub.status];
  const waiting = sub.status === "PENDING_PAYMENT" || sub.status === "PAYMENT_DECLARED";
  const endsSoon = sub.status === "ACTIVE" && sub.endsAt && new Date(sub.endsAt).getTime() - Date.now() < 30 * DAY;
  // Déjà renouvelé : un autre abonnement au même manuel, plus récent, est actif ou en cours de paiement
  const renewed = data.subscriptions.some(
    (o) => o.id !== sub.id && o.manual === sub.manual && o.createdAt > sub.createdAt && ["ACTIVE", "PENDING_PAYMENT", "PAYMENT_DECLARED"].includes(o.status)
  );
  const canRenew = !renewed && data.openPlans.includes(sub.plan) && (endsSoon || sub.status === "EXPIRED");
  const started = sub.startsAt && new Date(sub.startsAt).getTime() <= Date.now();

  return (
    <div className={`${cardClass} space-y-4`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-bold text-[#0d1b3e]">{subscriptionLabel(sub.manual, sub.plan)}</p>
          <p className="text-xs text-gray-500 mt-0.5">{MANUALS[sub.manual].short} · {formatFcfa(sub.priceFcfa)}</p>
        </div>
        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ring-1 ${status.tone}`}>{status.label}</span>
      </div>

      {sub.status === "ACTIVE" && (
        <p className="text-sm text-gray-700">
          {started ? <>Accès ouvert jusqu&apos;au <span className="font-semibold">{formatDate(sub.endsAt)}</span>.</>
            : <>Renouvellement : démarre le <span className="font-semibold">{formatDate(sub.startsAt)}</span>, jusqu&apos;au {formatDate(sub.endsAt)}.</>}
        </p>
      )}
      {sub.status === "EXPIRED" && <p className="text-sm text-gray-600">Terminé le {formatDate(sub.endsAt)}.</p>}

      {waiting && (
        <>
          {sub.adminNote && sub.status === "PENDING_PAYMENT" && (
            <ErrorBox>Paiement non confirmé : {sub.adminNote}</ErrorBox>
          )}
          {sub.status === "PAYMENT_DECLARED" ? (
            <InfoBox>
              Transaction <span className="font-semibold">{sub.transactionId}</span> ({sub.paymentMethod && PAYMENT_METHODS[sub.paymentMethod]}) déclarée le{" "}
              {formatDate(sub.declaredAt)}. L&apos;équipe vérifie et active ton abonnement, en général sous 24 h. Tu recevras un email.
            </InfoBox>
          ) : (
            <div className="rounded-2xl bg-[#faf3e0] p-4 text-sm text-[#0d1b3e] space-y-2">
              <p>
                Envoie <span className="font-bold">{formatFcfa(sub.priceFcfa)}</span> sur l&apos;un de ces numéros, avec la référence{" "}
                <span className="font-mono font-bold tracking-wider">{sub.reference}</span> en motif :
              </p>
              {data.paymentNumbers.length > 0 ? (
                <ul className="space-y-1">
                  {data.paymentNumbers.map((n) => (
                    <li key={n.method}><span className="font-semibold">{n.label}</span> : <span className="font-mono">{n.number}</span></li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-600">Les numéros de paiement seront bientôt affichés ici.</p>
              )}
            </div>
          )}
          <PaymentForm sub={sub} numbers={data.paymentNumbers} onDone={reload} />
        </>
      )}

      {(sub.status === "ACTIVE" || canRenew) && (
        <div className="flex flex-wrap gap-2">
          {sub.status === "ACTIVE" && started && (
            <Link href="/anglais-technique" className={smallBtn}>Mes chapitres</Link>
          )}
          {canRenew && <Link href={renewHref(sub)} className={smallBtn}>Renouveler</Link>}
        </div>
      )}
    </div>
  );
}

function Preferences({ data, reload }: { data: Data; reload: () => void }) {
  const [studyField, setStudyField] = useState(data.studyField);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const save = async (body: Record<string, unknown>) => {
    setMsg(null);
    setSaving(true);
    try {
      const res = await fetch("/api/anglais/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await res.json();
      setMsg(res.ok ? { ok: true, text: "Enregistré." } : { ok: false, text: d.error || "Enregistrement impossible." });
      if (res.ok) reload();
    } catch {
      setMsg({ ok: false, text: "Impossible de contacter le serveur." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`${cardClass} space-y-4`}>
      <h2 className="flex items-center gap-2 font-bold text-[#0d1b3e]">
        <span className="text-[#c9951a]">{Icon.user(18)}</span> Mes préférences
      </h2>
      <form
        onSubmit={(e) => { e.preventDefault(); save({ studyField }); }}
        className="flex flex-col sm:flex-row gap-3 sm:items-end"
      >
        <div className="flex-1">
          <label className={labelClass} htmlFor="studyField">Mes études ou mon métier</label>
          <input id="studyField" required maxLength={80} value={studyField} onChange={(e) => setStudyField(e.target.value)} className={inputClass} />
        </div>
        <button type="submit" disabled={saving} className={smallBtn}>Enregistrer</button>
      </form>
      <label className="flex items-start gap-3 text-sm text-gray-700 cursor-pointer">
        <input
          type="checkbox"
          checked={data.newsOptIn}
          disabled={saving}
          onChange={(e) => save({ newsOptIn: e.target.checked })}
          className="mt-1 accent-[#c9951a]"
        />
        <span>Recevoir un email quand de nouveaux chapitres ou ressources sont disponibles.</span>
      </label>
      {msg && (msg.ok ? <SuccessBox>{msg.text}</SuccessBox> : <ErrorBox>{msg.text}</ErrorBox>)}
    </div>
  );
}

export default function MonAbonnementClient() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  const [isNew, setIsNew] = useState(false);

  const load = useCallback(() => {
    fetch("/api/anglais/abonnements")
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || "Chargement impossible.");
        setData(d);
        setError("");
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Chargement impossible."));
  }, []);

  useEffect(() => {
    setIsNew(new URLSearchParams(window.location.search).get("nouveau") === "1");
    load();
  }, [load]);

  const active = data?.subscriptions.filter((s) => s.status !== "CANCELLED") ?? [];
  const canSubscribe = (data?.openPlans.length ?? 0) > 0;

  return (
    <PageHero
      image="/images/comptes/mon-compte.jpg"
      position="center 22%"
      kicker="Anglais technique"
      title={<>Mon <span className="text-[#c9951a]">abonnement</span></>}
      subtitle="Ton paiement, tes dates d'accès et les nouveautés des manuels."
      width="max-w-3xl"
    >
      <div className="space-y-5">
        {isNew && <SuccessBox>Inscription enregistrée ! Les instructions de paiement t&apos;ont aussi été envoyées par email.</SuccessBox>}
        {error && <ErrorBox>{error}</ErrorBox>}
        {!data && !error && <SkeletonCards count={2} />}

        {data && active.length === 0 && (
          <div className={`${cardClass} text-center space-y-3`}>
            <p className="text-sm text-gray-600">Tu n&apos;as pas encore d&apos;abonnement.</p>
            {canSubscribe ? (
              <Link href="/anglais-technique/inscription" className={`${smallBtn} inline-block`}>Choisir une formule</Link>
            ) : (
              <p className="text-xs text-gray-500">Les inscriptions ouvrent bientôt. Le chapitre 1 est déjà gratuit.</p>
            )}
          </div>
        )}

        {data && active.map((s) => <SubscriptionCard key={s.id} sub={s} data={data} reload={load} />)}

        {data && active.length > 0 && canSubscribe && (
          <p className="text-center text-sm">
            <Link href="/anglais-technique/inscription" className="font-semibold text-[#8a6510] hover:underline">
              + Ajouter un autre manuel ou une autre formule
            </Link>
          </p>
        )}

        {data && <Preferences data={data} reload={load} />}
      </div>
    </PageHero>
  );
}
