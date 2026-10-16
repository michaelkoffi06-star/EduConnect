'use client';

import React, { useCallback, useEffect, useState } from 'react';
import type { EnglishManual, EnglishPlan, EnglishSubscriptionStatus } from '@prisma/client';
import { PAYMENT_METHODS, formatFcfa, subscriptionLabel, type PaymentMethod } from '@/lib/english-plans';

// Onglet « Anglais technique » des panneaux /administratif et /bleSseD (§7novodecies) :
// vérification des paiements Mobile Money déclarés par les apprenants (valider / refuser avec motif /
// annuler) et envoi d'une annonce « nouveau contenu » aux apprenants qui l'ont acceptée.

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
  user: { id: string; email: string; firstName: string; lastName: string; studyField: string | null; role: string };
}
interface Announcement { id: string; title: string; link: string | null; sentCount: number; createdAt: string; }

const STATUS_LABELS: Record<EnglishSubscriptionStatus, string> = {
  PAYMENT_DECLARED: 'À vérifier',
  PENDING_PAYMENT: 'Attente paiement',
  ACTIVE: 'Actifs',
  EXPIRED: 'Terminés',
  CANCELLED: 'Annulés',
};
const STATUS_STYLES: Record<EnglishSubscriptionStatus, string> = {
  PAYMENT_DECLARED: 'bg-sky-900/40 text-sky-300 border-sky-500/40',
  PENDING_PAYMENT: 'bg-amber-900/40 text-amber-300 border-amber-500/40',
  ACTIVE: 'bg-emerald-900/40 text-emerald-300 border-emerald-500/40',
  EXPIRED: 'bg-gray-700/40 text-gray-400 border-gray-500/40',
  CANCELLED: 'bg-gray-700/40 text-gray-400 border-gray-500/40',
};
const FILTERS = Object.keys(STATUS_LABELS) as EnglishSubscriptionStatus[];

const card = 'bg-[#112240] rounded-2xl border border-[#2a4a6e] p-5';
const input = 'w-full px-3 py-2 bg-[#0d1f38] border border-[#2a4a6e] rounded-lg text-sm text-white focus:outline-none focus:border-[#c9951a]';
const label = 'block text-xs text-gray-400 mb-1';
const primaryBtn = 'px-4 py-2.5 bg-[#c9951a] hover:bg-[#d4a820] disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition';
const okBtn = 'px-3 py-1.5 text-xs font-semibold bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-lg transition';
const dangerBtn = 'px-3 py-1.5 text-xs font-semibold bg-red-900/40 hover:bg-red-900/70 disabled:opacity-50 text-red-300 rounded-lg transition';
const ghostBtn = 'px-3 py-1.5 text-xs font-semibold bg-[#0d1f38] hover:bg-[#1e3a5f] border border-[#2a4a6e] disabled:opacity-50 text-gray-200 rounded-lg transition';

function formatDate(iso: string | null, withTime = false): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('fr-FR', {
    day: 'numeric', month: 'short', year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
    timeZone: 'Africa/Abidjan',
  });
}

export default function EnglishSubscriptionsManager() {
  const [status, setStatus] = useState<EnglishSubscriptionStatus>('PAYMENT_DECLARED');
  const [query, setQuery] = useState('');
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [counts, setCounts] = useState<Partial<Record<EnglishSubscriptionStatus, number>>>({});
  const [optInCount, setOptInCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [note, setNote] = useState('');

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [news, setNews] = useState({ title: '', message: '', link: '' });
  const [sending, setSending] = useState(false);
  const [newsMsg, setNewsMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ status });
      if (query.trim()) params.set('q', query.trim());
      const res = await fetch(`/api/bleSseD/english-subscriptions?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Chargement impossible.');
      setSubs(data.subscriptions);
      setCounts(data.counts);
      setOptInCount(data.optInCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chargement impossible.');
    } finally {
      setLoading(false);
    }
  }, [status, query]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    fetch('/api/bleSseD/english-announcements')
      .then((r) => (r.ok ? r.json() : []))
      .then(setAnnouncements)
      .catch(() => {});
  }, []);

  const act = async (sub: Subscription, action: 'validate' | 'reject' | 'cancel', actionNote = '') => {
    if (action === 'validate' && !window.confirm(`Confirmer la réception de ${formatFcfa(sub.priceFcfa)} (réf. ${sub.reference}) ? Un email d'activation part tout de suite.`)) return;
    if (action === 'cancel' && !window.confirm(`Annuler l'abonnement ${sub.reference} ? (aucun email envoyé)`)) return;
    setBusyId(sub.id);
    setError('');
    try {
      const res = await fetch(`/api/bleSseD/english-subscriptions/${sub.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, note: actionNote }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Action impossible.');
      setRejectId(null);
      setNote('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action impossible.');
    } finally {
      setBusyId(null);
    }
  };

  const sendNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!window.confirm(`Envoyer cette annonce à ${optInCount} apprenant(s) ?`)) return;
    setSending(true);
    setNewsMsg(null);
    try {
      const res = await fetch('/api/bleSseD/english-announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(news),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Envoi impossible.');
      setNewsMsg({ ok: true, text: `Annonce envoyée : ${data.sentCount} email(s) acceptés sur ${data.recipients}.` });
      setAnnouncements((a) => [data, ...a]);
      setNews({ title: '', message: '', link: '' });
    } catch (err) {
      setNewsMsg({ ok: false, text: err instanceof Error ? err.message : 'Envoi impossible.' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className={card}>
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {FILTERS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition ${
                status === s ? 'bg-[#c9951a] border-[#c9951a] text-white' : 'border-[#2a4a6e] text-gray-300 hover:border-[#c9951a]'
              }`}
            >
              {STATUS_LABELS[s]} ({counts[s] ?? 0})
            </button>
          ))}
          <form
            onSubmit={(e) => { e.preventDefault(); load(); }}
            className="ml-auto flex gap-2 w-full sm:w-auto"
          >
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Référence, email, nom, transaction…"
              maxLength={80}
              className={`${input} sm:w-64`}
            />
          </form>
        </div>

        {error && <p className="mb-3 text-sm text-red-300">{error}</p>}
        {loading ? (
          <p className="text-sm text-gray-400">Chargement…</p>
        ) : subs.length === 0 ? (
          <p className="text-sm text-gray-400">Aucun abonnement dans cette catégorie.</p>
        ) : (
          <ul className="space-y-3">
            {subs.map((s) => (
              <li key={s.id} className="rounded-xl border border-[#2a4a6e] bg-[#0d1f38] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-white">
                      {s.user.firstName} {s.user.lastName}{' '}
                      <span className="font-normal text-gray-400 text-sm">· {s.user.email}</span>
                    </p>
                    <p className="text-sm text-gray-300 mt-0.5">
                      {subscriptionLabel(s.manual, s.plan)} · <span className="font-semibold text-[#e2b94a]">{formatFcfa(s.priceFcfa)}</span>
                    </p>
                    {s.user.studyField && <p className="text-xs text-gray-400 mt-0.5">Études / métier : {s.user.studyField}</p>}
                  </div>
                  <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${STATUS_STYLES[s.status]}`}>
                    {STATUS_LABELS[s.status]}
                  </span>
                </div>

                <dl className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1 text-xs">
                  <div><dt className="text-gray-500">Référence</dt><dd className="font-mono text-gray-200">{s.reference}</dd></div>
                  <div>
                    <dt className="text-gray-500">Transaction</dt>
                    <dd className="font-mono text-gray-200 break-all">
                      {s.transactionId ? `${s.transactionId} (${s.paymentMethod ? PAYMENT_METHODS[s.paymentMethod] : '?'})` : '—'}
                    </dd>
                  </div>
                  <div><dt className="text-gray-500">{s.declaredAt ? 'Déclaré le' : 'Inscrit le'}</dt><dd className="text-gray-200">{formatDate(s.declaredAt ?? s.createdAt, true)}</dd></div>
                  <div><dt className="text-gray-500">Accès</dt><dd className="text-gray-200">{s.startsAt ? `${formatDate(s.startsAt)} → ${formatDate(s.endsAt)}` : '—'}</dd></div>
                </dl>
                {s.adminNote && <p className="mt-2 text-xs text-amber-300">Note : {s.adminNote}</p>}

                {(s.status === 'PAYMENT_DECLARED' || s.status === 'PENDING_PAYMENT' || s.status === 'ACTIVE') && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(s.status === 'PAYMENT_DECLARED' || s.status === 'PENDING_PAYMENT') && (
                      <>
                        <button type="button" disabled={busyId === s.id} onClick={() => act(s, 'validate')} className={okBtn}>
                          Paiement reçu : activer
                        </button>
                        <button type="button" disabled={busyId === s.id} onClick={() => { setRejectId(rejectId === s.id ? null : s.id); setNote(''); }} className={ghostBtn}>
                          Paiement introuvable…
                        </button>
                      </>
                    )}
                    <button type="button" disabled={busyId === s.id} onClick={() => act(s, 'cancel')} className={dangerBtn}>
                      Annuler
                    </button>
                  </div>
                )}

                {rejectId === s.id && (
                  <form
                    onSubmit={(e) => { e.preventDefault(); act(s, 'reject', note); }}
                    className="mt-3 flex flex-col sm:flex-row gap-2"
                  >
                    <input
                      required
                      maxLength={300}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Motif envoyé à l'apprenant (ex. aucune transaction reçue avec cet identifiant)"
                      className={input}
                    />
                    <button type="submit" disabled={busyId === s.id} className={dangerBtn}>Envoyer le refus</button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className={card}>
        <h3 className="font-semibold text-white">Annoncer un nouveau contenu</h3>
        <p className="text-xs text-gray-400 mt-1 mb-4">
          Email envoyé aux {optInCount} apprenant(s) inscrits qui ont accepté les nouveautés. Chaque email contient un lien de désinscription.
        </p>
        <form onSubmit={sendNews} className="space-y-3">
          <div>
            <label className={label} htmlFor="news-title">Titre</label>
            <input id="news-title" required maxLength={120} value={news.title} onChange={(e) => setNews({ ...news, title: e.target.value })} placeholder="Chapitre 2 disponible" className={input} />
          </div>
          <div>
            <label className={label} htmlFor="news-message">Message</label>
            <textarea id="news-message" required maxLength={2000} rows={4} value={news.message} onChange={(e) => setNews({ ...news, message: e.target.value })} className={input} />
          </div>
          <div>
            <label className={label} htmlFor="news-link">Lien (facultatif) : chemin du site ou adresse https</label>
            <input id="news-link" maxLength={300} value={news.link} onChange={(e) => setNews({ ...news, link: e.target.value })} placeholder="/anglais-technique" className={input} />
          </div>
          {newsMsg && <p className={`text-sm ${newsMsg.ok ? 'text-emerald-300' : 'text-red-300'}`}>{newsMsg.text}</p>}
          <button type="submit" disabled={sending || optInCount === 0} className={primaryBtn}>
            {sending ? 'Envoi…' : 'Envoyer l’annonce'}
          </button>
        </form>

        {announcements.length > 0 && (
          <div className="mt-5 pt-4 border-t border-[#2a4a6e]">
            <p className="text-xs text-gray-400 mb-2">Dernières annonces</p>
            <ul className="space-y-1 text-sm text-gray-300">
              {announcements.map((a) => (
                <li key={a.id}>
                  {formatDate(a.createdAt)} · <span className="text-white">{a.title}</span> · {a.sentCount} email(s)
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
