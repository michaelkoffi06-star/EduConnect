'use client';

import { useCallback, useEffect, useState } from 'react';

// Onglet « Utilisateurs du site » du panneau /bleSseD (SUPER_ADMIN) : chiffres des comptes
// (élèves, parents, instructeurs, apprenants), liste filtrable avec les emails, copie des
// adresses et export CSV. Voir §7vicies de la doc.

type Role = 'ELEVE' | 'PARENT' | 'INSTRUCTEUR' | 'APPRENANT';

interface SiteUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  classe: string | null;
  studyField: string | null;
  emailVerifiedAt: string | null;
  englishNewsOptIn: boolean;
  createdAt: string;
  instructor: { status: string } | null;
  _count: { englishSubscriptions: number; forumThreads: number; forumPosts: number };
}

interface Stats {
  total: number;
  verified: number;
  last30Days: number;
  roles: Record<Role, number>;
}

const ROLE_LABELS: Record<Role, string> = {
  ELEVE: 'Élève',
  PARENT: 'Parent',
  INSTRUCTEUR: 'Instructeur',
  APPRENANT: 'Apprenant',
};
const ROLE_STYLES: Record<Role, string> = {
  ELEVE: 'bg-sky-900/40 text-sky-300 border-sky-500/30',
  PARENT: 'bg-violet-900/40 text-violet-300 border-violet-500/30',
  INSTRUCTEUR: 'bg-[#c9951a]/15 text-[#e0b84a] border-[#c9951a]/30',
  APPRENANT: 'bg-emerald-900/40 text-emerald-300 border-emerald-500/30',
};
const INSTRUCTOR_STATUS: Record<string, string> = { PENDING: 'fiche en attente', APPROVED: 'fiche approuvée', SUSPENDED: 'fiche suspendue' };

const card = 'bg-[#112240] rounded-2xl border border-[#2a4a6e] p-4';
const input = 'bg-[#0d1f38] border border-[#2a4a6e] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#c9951a]';
const ghostBtn = 'px-3 py-2 text-xs font-semibold bg-[#0d1f38] hover:bg-[#1e3a5f] border border-[#2a4a6e] disabled:opacity-50 text-gray-200 rounded-lg transition';
const primaryBtn = 'px-3 py-2 text-xs font-semibold bg-[#c9951a] hover:bg-[#d4a820] disabled:opacity-50 text-[#0a1628] rounded-lg transition';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function SiteUsersManager() {
  const [users, setUsers] = useState<SiteUser[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [truncated, setTruncated] = useState(false);
  const [role, setRole] = useState<'' | Role>('');
  const [verified, setVerified] = useState<'' | 'yes' | 'no'>('');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');

  const params = useCallback(() => {
    const p = new URLSearchParams();
    if (role) p.set('role', role);
    if (verified) p.set('verified', verified);
    if (query) p.set('q', query);
    return p;
  }, [role, verified, query]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`/api/bleSseD/site-users?${params().toString()}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        if (cancelled) return;
        setUsers(data.users);
        setStats(data.stats);
        setTruncated(data.truncated);
      } catch (err: any) {
        if (!cancelled) setError(err.message || 'Impossible de charger les comptes.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [params]);

  const copyEmails = async () => {
    const list = users.map((u) => u.email).join(', ');
    try {
      await navigator.clipboard.writeText(list);
      setCopied(`${users.length} adresse(s) copiée(s). Colle-les dans le champ « Cci » de ton email.`);
    } catch {
      // Navigateur sans accès au presse-papiers : on affiche la liste à sélectionner à la main
      window.prompt('Copie les adresses ci-dessous :', list);
    }
    setTimeout(() => setCopied(''), 6000);
  };

  const csvHref = () => {
    const p = params();
    p.set('format', 'csv');
    return `/api/bleSseD/site-users?${p.toString()}`;
  };

  const tiles: { label: string; value: number | string; hint?: string }[] = stats
    ? [
        { label: 'Comptes', value: stats.total, hint: `+${stats.last30Days} sur 30 jours` },
        { label: 'Élèves', value: stats.roles.ELEVE },
        { label: 'Parents', value: stats.roles.PARENT },
        { label: 'Instructeurs', value: stats.roles.INSTRUCTEUR },
        { label: 'Apprenants', value: stats.roles.APPRENANT, hint: 'anglais technique' },
        { label: 'Emails confirmés', value: `${stats.verified} / ${stats.total}` },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {tiles.map((t) => (
          <div key={t.label} className={card}>
            <p className="text-xs text-gray-400">{t.label}</p>
            <p className="text-2xl font-semibold text-white mt-1">{t.value}</p>
            {t.hint && <p className="text-[11px] text-gray-500 mt-0.5">{t.hint}</p>}
          </div>
        ))}
      </div>

      <div className={`${card} flex flex-wrap items-end gap-3`}>
        <label className="text-xs text-gray-400">
          Type de compte
          <select value={role} onChange={(e) => setRole(e.target.value as '' | Role)} className={`${input} block mt-1`}>
            <option value="">Tous</option>
            {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
              <option key={r} value={r}>{ROLE_LABELS[r]}</option>
            ))}
          </select>
        </label>
        <label className="text-xs text-gray-400">
          Email
          <select value={verified} onChange={(e) => setVerified(e.target.value as '' | 'yes' | 'no')} className={`${input} block mt-1`}>
            <option value="">Tous</option>
            <option value="yes">Confirmés</option>
            <option value="no">Non confirmés</option>
          </select>
        </label>
        <form
          className="flex items-end gap-2 flex-1 min-w-[220px]"
          onSubmit={(e) => {
            e.preventDefault();
            setQuery(search.trim());
          }}
        >
          <label className="text-xs text-gray-400 flex-1">
            Recherche
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nom ou email"
              maxLength={100}
              className={`${input} block mt-1 w-full`}
            />
          </label>
          <button type="submit" className={ghostBtn}>Chercher</button>
        </form>
        <div className="flex gap-2">
          <button onClick={copyEmails} disabled={users.length === 0} className={primaryBtn}>
            Copier les emails ({users.length})
          </button>
          <a href={csvHref()} className={ghostBtn}>Exporter en CSV</a>
        </div>
      </div>

      {copied && <p className="text-sm text-emerald-300">{copied}</p>}
      {error && <p className="text-sm text-red-300">{error}</p>}
      <p className="text-xs text-gray-500">
        La copie et l&apos;export portent sur la liste affichée (filtres compris). Un email non confirmé n&apos;a pas été
        vérifié : il peut être faux. Pour écrire à plusieurs personnes, mets les adresses en « Cci » pour ne pas les
        révéler aux autres destinataires.
      </p>

      <div className="overflow-x-auto rounded-2xl border border-[#2a4a6e]">
        <table className="w-full text-sm">
          <thead className="bg-[#0d1f38] text-gray-400 text-xs">
            <tr>
              <th className="text-left px-4 py-3 font-semibold">Nom</th>
              <th className="text-left px-4 py-3 font-semibold">Email</th>
              <th className="text-left px-4 py-3 font-semibold">Type</th>
              <th className="text-left px-4 py-3 font-semibold">Classe / études</th>
              <th className="text-left px-4 py-3 font-semibold">Activité</th>
              <th className="text-left px-4 py-3 font-semibold">Inscrit le</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e3a5f]">
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-500">Chargement…</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-500">Aucun compte ne correspond.</td></tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="hover:bg-[#0d1f38]/60">
                  <td className="px-4 py-3 text-white whitespace-nowrap">{u.firstName} {u.lastName}</td>
                  <td className="px-4 py-3">
                    <a href={`mailto:${u.email}`} className="text-[#e0b84a] hover:underline break-all">{u.email}</a>
                    {!u.emailVerifiedAt && <span className="block text-[11px] text-gray-500">non confirmé</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full border ${ROLE_STYLES[u.role]}`}>
                      {ROLE_LABELS[u.role]}
                    </span>
                    {u.instructor && (
                      <span className="block text-[11px] text-gray-500 mt-0.5">{INSTRUCTOR_STATUS[u.instructor.status] ?? u.instructor.status}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-300">{u.classe || u.studyField || '—'}</td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {u._count.forumThreads + u._count.forumPosts > 0 && (
                      <span className="block">Forum : {u._count.forumThreads + u._count.forumPosts} message(s)</span>
                    )}
                    {u._count.englishSubscriptions > 0 && (
                      <span className="block">Anglais : {u._count.englishSubscriptions} inscription(s)</span>
                    )}
                    {u._count.forumThreads + u._count.forumPosts + u._count.englishSubscriptions === 0 && '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{formatDate(u.createdAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {truncated && <p className="text-xs text-gray-500">Seuls les 5 000 comptes les plus récents sont affichés : affine avec les filtres.</p>}
    </div>
  );
}
