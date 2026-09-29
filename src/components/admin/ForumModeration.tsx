'use client';

import { useEffect, useState } from 'react';

// Onglet "Forum" des panneaux /bleSseD et /pedagogie : signalements à traiter et derniers
// sujets publiés, avec masquage/rétablissement. Voir §7quindecies de la doc.

interface TeamAuthor { firstName: string; lastName: string; email: string; role: string; }
interface Report {
  id: string;
  reason: string | null;
  createdAt: string;
  reporter: { firstName: string; lastName: string; email: string };
  thread: { id: string; title: string; body: string; space: string; hidden: boolean; author: TeamAuthor };
  post: { id: string; body: string; hidden: boolean; author: TeamAuthor } | null;
}
interface ThreadRow {
  id: string;
  title: string;
  space: string;
  hidden: boolean;
  replyCount: number;
  createdAt: string;
  author: TeamAuthor;
  subject: { name: string } | null;
}

const card = 'bg-[#112240] rounded-2xl border border-[#2a4a6e] p-5';
const dangerBtn = 'px-3 py-1.5 text-xs font-semibold bg-red-900/40 hover:bg-red-900/70 disabled:opacity-50 text-red-300 rounded-lg transition';
const ghostBtn = 'px-3 py-1.5 text-xs font-semibold bg-[#0d1f38] hover:bg-[#1e3a5f] border border-[#2a4a6e] disabled:opacity-50 text-gray-200 rounded-lg transition';
const SPACE_LABELS: Record<string, string> = { QUESTIONS: 'Questions', SALLE_DES_PROFS: 'Salle des profs' };

function who(a: TeamAuthor) {
  return `${a.firstName} ${a.lastName} (${a.role.toLowerCase()}, ${a.email})`;
}

export default function ForumModeration() {
  const [reports, setReports] = useState<Report[]>([]);
  const [threads, setThreads] = useState<ThreadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    try {
      const res = await fetch('/api/bleSseD/forum');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setReports(data.reports);
      setThreads(data.threads);
    } catch (err: any) {
      setError(err.message || 'Impossible de charger le forum.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const act = async (key: string, body: Record<string, unknown>) => {
    setBusy(key);
    setError('');
    try {
      const res = await fetch('/api/bleSseD/forum', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      await load();
    } catch (err: any) {
      setError(err.message || 'Action impossible.');
    } finally {
      setBusy(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#c9951a] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && <div className="p-3 bg-red-900/30 border border-red-500/40 rounded-lg text-sm text-red-300">{error}</div>}

      <div className={card}>
        <h3 className="text-sm font-semibold text-white mb-1">Signalements à traiter ({reports.length})</h3>
        <p className="text-xs text-gray-400 mb-4">Masquer retire le message du site (il reste en base et peut être rétabli). Classer sans suite ferme le signalement.</p>
        {reports.length === 0 ? (
          <p className="text-sm text-gray-500">Aucun signalement en attente.</p>
        ) : (
          <div className="space-y-3">
            {reports.map((r) => {
              const target = r.post ?? r.thread;
              const hidden = r.post ? r.post.hidden : r.thread.hidden;
              return (
                <div key={r.id} className="bg-[#0d1f38] border border-[#2a4a6e] rounded-lg p-4 space-y-2">
                  <p className="text-xs text-gray-400">
                    {r.post ? 'Réponse' : 'Sujet'} dans <a href={`/forum/${r.thread.id}`} target="_blank" rel="noopener noreferrer" className="text-[#c9951a] hover:underline">« {r.thread.title} »</a>
                    {' · '}{SPACE_LABELS[r.thread.space]} · signalé le {new Date(r.createdAt).toLocaleDateString('fr-FR')} par {r.reporter.firstName} {r.reporter.lastName}
                  </p>
                  {r.reason && <p className="text-xs text-amber-300">Motif : {r.reason}</p>}
                  <p className="text-sm text-gray-200 whitespace-pre-line break-words border-l-2 border-[#2a4a6e] pl-3">{target.body}</p>
                  <p className="text-xs text-gray-500">Auteur : {who(target.author)}</p>
                  <div className="flex gap-2">
                    {hidden ? (
                      <span className="text-xs text-gray-400">Déjà masqué</span>
                    ) : (
                      <button
                        disabled={busy === r.id}
                        onClick={() => act(r.id, { action: 'hide', threadId: r.thread.id, postId: r.post?.id })}
                        className={dangerBtn}
                      >
                        Masquer
                      </button>
                    )}
                    <button disabled={busy === r.id} onClick={() => act(r.id, { action: 'dismiss', reportId: r.id })} className={ghostBtn}>
                      Classer sans suite
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-[#112240] rounded-2xl border border-[#2a4a6e] overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-[#2a4a6e]">
            <tr className="text-xs text-gray-400 uppercase tracking-wide">
              <th className="text-left px-4 py-3 font-semibold">Derniers sujets</th>
              <th className="text-left px-4 py-3 font-semibold">Espace</th>
              <th className="text-left px-4 py-3 font-semibold">Auteur</th>
              <th className="text-left px-4 py-3 font-semibold">Rép.</th>
              <th className="text-right px-4 py-3 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e3a5f]">
            {threads.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">Aucun sujet pour le moment.</td></tr>
            ) : (
              threads.map((t) => (
                <tr key={t.id} className={t.hidden ? 'opacity-50' : ''}>
                  <td className="px-4 py-3 max-w-sm">
                    <a href={`/forum/${t.id}`} target="_blank" rel="noopener noreferrer" className="text-[#c9951a] hover:underline font-semibold">{t.title}</a>
                    <div className="text-[11px] text-gray-500">{t.subject?.name || 'Général'} · {new Date(t.createdAt).toLocaleDateString('fr-FR')}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">{SPACE_LABELS[t.space]}</td>
                  <td className="px-4 py-3 text-xs text-gray-400">{t.author.firstName} {t.author.lastName}</td>
                  <td className="px-4 py-3 text-xs text-gray-400">{t.replyCount}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      disabled={busy === t.id}
                      onClick={() => act(t.id, { action: t.hidden ? 'unhide' : 'hide', threadId: t.id })}
                      className={t.hidden ? ghostBtn : dangerBtn}
                    >
                      {t.hidden ? 'Rétablir' : 'Masquer'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
