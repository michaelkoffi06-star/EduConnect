'use client';

import React, { useEffect, useState } from 'react';

// Onglet "Marché" des panneaux /bleSseD et /administratif : l'équipe publie les besoins des
// familles sous forme d'annonces anonymes, voit les instructeurs qui se positionnent, et
// retient l'un d'eux (email automatique). Voir §7quindecies de la doc.

type Level = 'PRIMAIRE' | 'COLLEGE' | 'LYCEE' | 'ALL';
type Mode = 'DOMICILE' | 'EN_LIGNE' | 'LES_DEUX';
type OfferStatus = 'OPEN' | 'FILLED' | 'CLOSED';
type InterestStatus = 'PENDING' | 'SELECTED' | 'DECLINED';

interface Subject { id: string; name: string; }
interface Interest {
  id: string;
  status: InterestStatus;
  message: string | null;
  createdAt: string;
  instructor: { id: string; firstName: string; lastName: string; email: string; whatsapp: string; status: string; commune: string | null };
}
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
  status: OfferStatus;
  createdAt: string;
  subject: Subject;
  interests: Interest[];
}

const LEVEL_LABELS: Record<Level, string> = { PRIMAIRE: 'Primaire', COLLEGE: 'Collège', LYCEE: 'Lycée', ALL: 'Tous niveaux' };
const MODE_LABELS: Record<Mode, string> = { DOMICILE: 'À domicile', EN_LIGNE: 'En ligne', LES_DEUX: 'Les deux' };
const OFFER_STATUS_LABELS: Record<OfferStatus, string> = { OPEN: 'Ouverte', FILLED: 'Pourvue', CLOSED: 'Retirée' };
const OFFER_STATUS_STYLES: Record<OfferStatus, string> = {
  OPEN: 'bg-emerald-900/40 text-emerald-300 border-emerald-500/40',
  FILLED: 'bg-sky-900/40 text-sky-300 border-sky-500/40',
  CLOSED: 'bg-gray-700/40 text-gray-400 border-gray-500/40',
};
const INTEREST_LABELS: Record<InterestStatus, string> = { PENDING: 'En attente', SELECTED: 'Retenu', DECLINED: 'Écarté' };

const card = 'bg-[#112240] rounded-2xl border border-[#2a4a6e] p-5';
const input = 'w-full px-3 py-2 bg-[#0d1f38] border border-[#2a4a6e] rounded-lg text-sm text-white focus:outline-none focus:border-[#c9951a]';
const label = 'block text-xs text-gray-400 mb-1';
const primaryBtn = 'px-4 py-2.5 bg-[#c9951a] hover:bg-[#d4a820] disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition';
const dangerBtn = 'px-3 py-1.5 text-xs font-semibold bg-red-900/40 hover:bg-red-900/70 disabled:opacity-50 text-red-300 rounded-lg transition';
const ghostBtn = 'px-3 py-1.5 text-xs font-semibold bg-[#0d1f38] hover:bg-[#1e3a5f] border border-[#2a4a6e] disabled:opacity-50 text-gray-200 rounded-lg transition';

const EMPTY_FORM = {
  title: '', subjectId: '', level: 'COLLEGE' as Level, classe: '', mode: 'DOMICILE' as Mode,
  city: 'Abidjan', commune: '', schedule: '', budget: '', description: '',
};

export default function MarketManager() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<OfferStatus | 'ALL'>('OPEN');

  useEffect(() => {
    (async () => {
      try {
        const [sRes, oRes] = await Promise.all([fetch('/api/subjects'), fetch('/api/bleSseD/market-offers')]);
        if (!sRes.ok || !oRes.ok) throw new Error();
        setSubjects(await sRes.json());
        setOffers(await oRes.json());
      } catch {
        setError('Impossible de charger le marché.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const set = (k: keyof typeof EMPTY_FORM) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!form.title.trim() || !form.subjectId) {
      setFormError('Titre et matière sont obligatoires.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/bleSseD/market-offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOffers((prev) => [data, ...prev]);
      setForm(EMPTY_FORM);
      setStatusFilter('OPEN');
    } catch (err: any) {
      setFormError(err.message || "Impossible de publier l'annonce.");
    } finally {
      setSubmitting(false);
    }
  };

  const patchOffer = async (o: Offer, body: Record<string, unknown>) => {
    setBusyId(o.id);
    setError('');
    try {
      const res = await fetch(`/api/bleSseD/market-offers/${o.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOffers((prev) => prev.map((x) => (x.id === o.id ? data : x)));
    } catch (err: any) {
      setError(err.message || "Impossible de modifier l'annonce.");
    } finally {
      setBusyId(null);
    }
  };

  const deleteOffer = async (o: Offer) => {
    if (!window.confirm(`Supprimer l'annonce « ${o.title} » et ses ${o.interests.length} candidature(s) ?`)) return;
    setBusyId(o.id);
    setError('');
    try {
      const res = await fetch(`/api/bleSseD/market-offers/${o.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json()).error);
      setOffers((prev) => prev.filter((x) => x.id !== o.id));
    } catch (err: any) {
      setError(err.message || "Impossible de supprimer l'annonce.");
    } finally {
      setBusyId(null);
    }
  };

  const patchInterest = async (o: Offer, i: Interest, status: InterestStatus) => {
    if (status === 'SELECTED' && !window.confirm(`Retenir ${i.instructor.firstName} ${i.instructor.lastName} ? Un email lui sera envoyé.`)) return;
    setBusyId(i.id);
    setError('');
    try {
      const res = await fetch(`/api/bleSseD/market-interests/${i.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOffers((prev) =>
        prev.map((x) => (x.id === o.id ? { ...x, interests: x.interests.map((y) => (y.id === i.id ? { ...y, status: data.status } : y)) } : x))
      );
    } catch (err: any) {
      setError(err.message || 'Impossible de modifier la candidature.');
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#c9951a] border-t-transparent"></div>
      </div>
    );
  }

  const visible = statusFilter === 'ALL' ? offers : offers.filter((o) => o.status === statusFilter);

  return (
    <div className="space-y-6">
      {error && <div className="p-3 bg-red-900/30 border border-red-500/40 rounded-lg text-sm text-red-300">{error}</div>}

      <div className={card}>
        <h3 className="text-sm font-semibold text-white mb-1">Publier une annonce</h3>
        <p className="text-xs text-gray-400 mb-4">
          Visible par les instructeurs approuvés, dans leur espace. Ne mettez aucune coordonnée de la famille : c’est l’équipe qui fait le lien.
        </p>
        <form onSubmit={handleCreate} className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="col-span-2">
              <label className={label}>Titre *</label>
              <input value={form.title} onChange={set('title')} placeholder="Élève de 3e cherche soutien en maths" className={input} />
            </div>
            <div>
              <label className={label}>Matière *</label>
              <select value={form.subjectId} onChange={set('subjectId')} className={input}>
                <option value="">Choisir</option>
                {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className={label}>Niveau *</label>
              <select value={form.level} onChange={set('level')} className={input}>
                {(Object.keys(LEVEL_LABELS) as Level[]).map((l) => <option key={l} value={l}>{LEVEL_LABELS[l]}</option>)}
              </select>
            </div>
            <div>
              <label className={label}>Classe</label>
              <input value={form.classe} onChange={set('classe')} placeholder="3e, Tle D…" className={input} />
            </div>
            <div>
              <label className={label}>Mode *</label>
              <select value={form.mode} onChange={set('mode')} className={input}>
                {(Object.keys(MODE_LABELS) as Mode[]).map((m) => <option key={m} value={m}>{MODE_LABELS[m]}</option>)}
              </select>
            </div>
            <div>
              <label className={label}>Commune</label>
              <input value={form.commune} onChange={set('commune')} placeholder="Cocody" className={input} />
            </div>
            <div>
              <label className={label}>Ville</label>
              <input value={form.city} onChange={set('city')} className={input} />
            </div>
            <div className="col-span-2">
              <label className={label}>Rythme / créneaux</label>
              <input value={form.schedule} onChange={set('schedule')} placeholder="2 séances par semaine, en soirée" className={input} />
            </div>
            <div className="col-span-2">
              <label className={label}>Rémunération indicative</label>
              <input value={form.budget} onChange={set('budget')} placeholder="À discuter" className={input} />
            </div>
          </div>
          <div>
            <label className={label}>Description</label>
            <textarea value={form.description} onChange={set('description')} rows={3} placeholder="Besoins de l'élève, objectifs (examen, remise à niveau…)" className={`${input} resize-none`} />
          </div>
          {formError && <div className="p-2.5 bg-red-900/30 border border-red-500/40 rounded-lg text-xs text-red-300">{formError}</div>}
          <button type="submit" disabled={submitting} className={primaryBtn}>{submitting ? 'Publication…' : "Publier l'annonce"}</button>
        </form>
      </div>

      <div className="flex flex-wrap gap-2">
        {(['OPEN', 'FILLED', 'CLOSED', 'ALL'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
              statusFilter === s ? 'bg-[#c9951a] text-white border-[#c9951a]' : 'border-[#2a4a6e] text-gray-400 hover:text-white'
            }`}
          >
            {s === 'ALL' ? 'Toutes' : OFFER_STATUS_LABELS[s]} ({s === 'ALL' ? offers.length : offers.filter((o) => o.status === s).length})
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="text-center py-16 bg-[#112240] rounded-2xl border border-[#2a4a6e]">
          <p className="text-gray-500">Aucune annonce.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((o) => {
            const pending = o.interests.filter((i) => i.status === 'PENDING').length;
            return (
              <div key={o.id} className={card}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[11px] px-2 py-0.5 rounded-full border font-semibold ${OFFER_STATUS_STYLES[o.status]}`}>{OFFER_STATUS_LABELS[o.status]}</span>
                      <span className="text-xs text-[#c9951a] font-semibold">{o.subject.name}</span>
                      <span className="text-xs text-gray-500">{new Date(o.createdAt).toLocaleDateString('fr-FR')}</span>
                    </div>
                    <p className="text-white font-semibold mt-1">{o.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {o.classe || LEVEL_LABELS[o.level]} · {MODE_LABELS[o.mode]}
                      {(o.commune || o.city) && ` · ${[o.commune, o.city].filter(Boolean).join(', ')}`}
                      {o.schedule && ` · ${o.schedule}`}
                      {o.budget && ` · ${o.budget}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      aria-label="Statut de l'annonce"
                      value={o.status}
                      disabled={busyId === o.id}
                      onChange={(e) => patchOffer(o, { status: e.target.value })}
                      className={`${input} w-32`}
                    >
                      {(Object.keys(OFFER_STATUS_LABELS) as OfferStatus[]).map((s) => <option key={s} value={s}>{OFFER_STATUS_LABELS[s]}</option>)}
                    </select>
                    <button onClick={() => setOpenId(openId === o.id ? null : o.id)} className={ghostBtn}>
                      Candidats ({o.interests.length}{pending > 0 ? `, ${pending} en attente` : ''})
                    </button>
                    <button disabled={busyId === o.id} onClick={() => deleteOffer(o)} className={dangerBtn}>Supprimer</button>
                  </div>
                </div>

                {openId === o.id && (
                  <div className="mt-4 border-t border-[#2a4a6e] pt-4 space-y-3">
                    {o.description && <p className="text-sm text-gray-300 whitespace-pre-line">{o.description}</p>}
                    {o.interests.length === 0 ? (
                      <p className="text-sm text-gray-500">Aucun instructeur ne s’est encore positionné.</p>
                    ) : (
                      o.interests.map((i) => (
                        <div key={i.id} className="flex flex-wrap items-start justify-between gap-3 bg-[#0d1f38] border border-[#2a4a6e] rounded-lg p-3">
                          <div className="min-w-0 text-sm">
                            <p className="text-white font-semibold">
                              {i.instructor.firstName} {i.instructor.lastName}
                              {i.instructor.commune && <span className="text-gray-500 font-normal"> · {i.instructor.commune}</span>}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              <a href={`https://wa.me/${i.instructor.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-emerald-300 hover:underline">
                                WhatsApp {i.instructor.whatsapp}
                              </a>
                              {' · '}{i.instructor.email} · le {new Date(i.createdAt).toLocaleDateString('fr-FR')}
                            </p>
                            {i.message && <p className="text-xs text-gray-300 mt-1.5 whitespace-pre-line">« {i.message} »</p>}
                          </div>
                          <select
                            aria-label={`Décision pour ${i.instructor.firstName}`}
                            value={i.status}
                            disabled={busyId === i.id}
                            onChange={(e) => patchInterest(o, i, e.target.value as InterestStatus)}
                            className={`${input} w-32`}
                          >
                            {(Object.keys(INTEREST_LABELS) as InterestStatus[]).map((s) => <option key={s} value={s}>{INTEREST_LABELS[s]}</option>)}
                          </select>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
