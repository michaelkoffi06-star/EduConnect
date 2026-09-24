'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface MatchRequest {
  id: string;
  studentEmail: string;
  studentMessage: string;
  instructorId: string;
  instructorName: string;
  status: 'NEW' | 'CONTACTED' | 'DONE';
  createdAt: string;
}

interface Subject { id: string; name: string; }
interface InstructorSubject { subject: Subject; }
interface Instructor {
  id: string;
  firstName: string;
  lastName: string;
  status: 'PENDING' | 'APPROVED' | 'SUSPENDED';
  city: string | null;
  commune: string | null;
  subjects: InstructorSubject[];
}

interface Resource {
  id: string;
  title: string;
  type: 'DOCUMENT' | 'VIDEO' | 'EXERCICE' | 'LIEN';
  level: string;
  fileUrl: string | null;
  externalUrl: string | null;
  subject: Subject;
}

type Tab = 'requests' | 'instructors' | 'resources';

const REQUEST_STATUS_STYLES: Record<string, string> = {
  NEW: 'bg-amber-900/40 text-amber-300 border-amber-500/40',
  CONTACTED: 'bg-sky-900/40 text-sky-300 border-sky-500/40',
  DONE: 'bg-emerald-900/40 text-emerald-300 border-emerald-500/40',
};
const REQUEST_STATUS_LABELS: Record<string, string> = {
  NEW: 'Nouvelle',
  CONTACTED: 'Contacté',
  DONE: 'Terminé',
};
const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-amber-900/40 text-amber-300 border-amber-500/40',
  APPROVED: 'bg-emerald-900/40 text-emerald-300 border-emerald-500/40',
  SUSPENDED: 'bg-red-900/40 text-red-300 border-red-500/40',
};
const STATUS_LABELS: Record<string, string> = {
  PENDING: 'En attente',
  APPROVED: 'Approuvé',
  SUSPENDED: 'Suspendu',
};
const RESOURCE_TYPE_LABELS: Record<string, string> = {
  DOCUMENT: 'Document',
  VIDEO: 'Vidéo',
  EXERCICE: 'Exercice',
  LIEN: 'Lien',
};

export default function AdministratifPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('requests');
  const [errorMsg, setErrorMsg] = useState('');

  const [requests, setRequests] = useState<MatchRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [updatingRequestId, setUpdatingRequestId] = useState<string | null>(null);

  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [instructorsLoading, setInstructorsLoading] = useState(true);

  const [resourcesList, setResourcesList] = useState<Resource[]>([]);
  const [resourcesLoading, setResourcesLoading] = useState(true);

  const [showAccountPanel, setShowAccountPanel] = useState(false);
  const [accCurrentPassword, setAccCurrentPassword] = useState('');
  const [accNewUsername, setAccNewUsername] = useState('');
  const [accNewPassword, setAccNewPassword] = useState('');
  const [accSubmitting, setAccSubmitting] = useState(false);
  const [accMessage, setAccMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchRequests = async () => {
    setRequestsLoading(true);
    try {
      const res = await fetch('/api/bleSseD/match-requests');
      if (!res.ok) throw new Error();
      setRequests(await res.json());
    } catch {
      setErrorMsg('Impossible de charger les demandes.');
    } finally {
      setRequestsLoading(false);
    }
  };

  const fetchInstructors = async () => {
    setInstructorsLoading(true);
    try {
      const res = await fetch('/api/bleSseD/instructors');
      if (!res.ok) throw new Error();
      setInstructors(await res.json());
    } catch {
      setErrorMsg('Impossible de charger les instructeurs.');
    } finally {
      setInstructorsLoading(false);
    }
  };

  const fetchResources = async () => {
    setResourcesLoading(true);
    try {
      const res = await fetch('/api/bleSseD/resources');
      if (!res.ok) throw new Error();
      setResourcesList(await res.json());
    } catch {
      setErrorMsg('Impossible de charger la bibliothèque.');
    } finally {
      setResourcesLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    fetchInstructors();
    fetchResources();
  }, []);

  const updateRequestStatus = async (id: string, newStatus: string) => {
    setUpdatingRequestId(id);
    try {
      const res = await fetch(`/api/bleSseD/match-requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setRequests((prev) => prev.map((r) => (r.id === id ? updated : r)));
    } catch {
      setErrorMsg('Impossible de mettre à jour la demande.');
    } finally {
      setUpdatingRequestId(null);
    }
  };

  const handleAccountUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setAccMessage(null);
    setAccSubmitting(true);
    try {
      const res = await fetch('/api/account', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: accCurrentPassword,
          newUsername: accNewUsername.trim() || undefined,
          newPassword: accNewPassword || undefined,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Erreur lors de la mise à jour.');
      setAccMessage({ type: 'success', text: 'Compte mis à jour avec succès.' });
      setAccCurrentPassword('');
      setAccNewUsername('');
      setAccNewPassword('');
    } catch (err: any) {
      setAccMessage({ type: 'error', text: err.message || 'Une erreur est survenue.' });
    } finally {
      setAccSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/bleSseD/logout', { method: 'POST' });
    router.push('/dev_edco_si/san_other/login');
  };

  return (
    <div className="min-h-screen bg-[#0a1628]">
      <header className="bg-[#0d1f38] border-b border-[#2a4a6e] px-6 py-4 flex items-center justify-between">
        <div>
          <span className="inline-block px-3 py-1 rounded-full bg-[#c9951a]/15 text-[#c9951a] text-xs font-bold uppercase tracking-wide mr-3">
            Administratif
          </span>
          <span className="text-gray-400 text-sm">Demandes de mise en relation, et consultation instructeurs/bibliothèque.</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAccountPanel((v) => !v)}
            className="px-4 py-2 text-sm font-semibold bg-[#112240] hover:bg-[#1a2f4d] border border-[#2a4a6e] text-white rounded-lg transition"
          >
            Mon compte
          </button>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm font-semibold bg-[#112240] hover:bg-[#1a2f4d] border border-[#2a4a6e] text-white rounded-lg transition"
          >
            Déconnexion
          </button>
        </div>
      </header>

      {showAccountPanel && (
        <div className="max-w-6xl mx-auto px-6 pt-6">
          <div className="bg-[#112240] border border-[#2a4a6e] rounded-2xl p-5 max-w-md">
            <h3 className="text-sm font-semibold text-white mb-4">Modifier mon compte</h3>
            <form onSubmit={handleAccountUpdate} className="space-y-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Mot de passe actuel *</label>
                <input
                  type="password"
                  value={accCurrentPassword}
                  onChange={(e) => setAccCurrentPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-[#0d1f38] border border-[#2a4a6e] rounded-lg text-sm text-white focus:outline-none focus:border-[#c9951a]"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Nouvel identifiant (optionnel)</label>
                <input
                  value={accNewUsername}
                  onChange={(e) => setAccNewUsername(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0d1f38] border border-[#2a4a6e] rounded-lg text-sm text-white focus:outline-none focus:border-[#c9951a]"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Nouveau mot de passe (optionnel, 6 caractères min.)</label>
                <input
                  type="password"
                  value={accNewPassword}
                  onChange={(e) => setAccNewPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0d1f38] border border-[#2a4a6e] rounded-lg text-sm text-white focus:outline-none focus:border-[#c9951a]"
                />
              </div>
              {accMessage && (
                <div
                  className={`p-2.5 rounded-lg text-xs border ${
                    accMessage.type === 'success'
                      ? 'bg-emerald-900/30 border-emerald-500/40 text-emerald-300'
                      : 'bg-red-900/30 border-red-500/40 text-red-300'
                  }`}
                >
                  {accMessage.text}
                </div>
              )}
              <button
                type="submit"
                disabled={accSubmitting}
                className="px-4 py-2 bg-[#c9951a] hover:bg-[#d4a820] disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition"
              >
                {accSubmitting ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </form>
          </div>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex gap-2 mb-6 border-b border-[#2a4a6e]">
          <button
            onClick={() => setTab('requests')}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition ${
              tab === 'requests' ? 'border-[#c9951a] text-[#c9951a]' : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            Demandes
          </button>
          <button
            onClick={() => setTab('instructors')}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition ${
              tab === 'instructors' ? 'border-[#c9951a] text-[#c9951a]' : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            Instructeurs <span className="text-gray-500 text-xs">(lecture seule)</span>
          </button>
          <button
            onClick={() => setTab('resources')}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition ${
              tab === 'resources' ? 'border-[#c9951a] text-[#c9951a]' : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            Bibliothèque <span className="text-gray-500 text-xs">(lecture seule)</span>
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-900/30 border border-red-500/40 rounded-lg text-sm text-red-300">
            {errorMsg}
          </div>
        )}

        {tab === 'requests' && (
          requestsLoading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#c9951a] border-t-transparent"></div>
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-16 bg-[#112240] rounded-2xl border border-[#2a4a6e]">
              <p className="text-gray-500">Aucune demande de mise en relation pour le moment.</p>
            </div>
          ) : (
            <div className="bg-[#112240] rounded-2xl border border-[#2a4a6e] overflow-hidden">
              <table className="w-full text-sm">
                <thead className="border-b border-[#2a4a6e]">
                  <tr className="text-xs text-gray-400 uppercase tracking-wide">
                    <th className="text-left px-4 py-3 font-semibold">Demandeur</th>
                    <th className="text-left px-4 py-3 font-semibold">Instructeur souhaité</th>
                    <th className="text-left px-4 py-3 font-semibold">Message</th>
                    <th className="text-left px-4 py-3 font-semibold">Reçue le</th>
                    <th className="text-left px-4 py-3 font-semibold">Statut</th>
                    <th className="text-right px-4 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e3a5f]">
                  {requests.map((req) => (
                    <tr key={req.id} className="hover:bg-[#0d1f38] transition align-top">
                      <td className="px-4 py-3">
                        <button
                          onClick={() => window.open(`mailto:${req.studentEmail}`)}
                          className="text-[#c9951a] hover:underline text-left"
                        >
                          {req.studentEmail}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-white font-medium">{req.instructorName}</td>
                      <td className="px-4 py-3 text-gray-300 max-w-xs">
                        <p className="line-clamp-3">{req.studentMessage}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                        {new Date(req.createdAt).toLocaleString('fr-FR')}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full border ${REQUEST_STATUS_STYLES[req.status]}`}>
                          {REQUEST_STATUS_LABELS[req.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2 flex-wrap">
                          {req.status !== 'CONTACTED' && (
                            <button
                              disabled={updatingRequestId === req.id}
                              onClick={() => updateRequestStatus(req.id, 'CONTACTED')}
                              className="px-3 py-1.5 text-xs font-semibold bg-sky-600/80 hover:bg-sky-500 disabled:opacity-50 text-white rounded-lg transition"
                            >
                              Marquer contacté
                            </button>
                          )}
                          {req.status !== 'DONE' && (
                            <button
                              disabled={updatingRequestId === req.id}
                              onClick={() => updateRequestStatus(req.id, 'DONE')}
                              className="px-3 py-1.5 text-xs font-semibold bg-[#c9951a] hover:bg-[#d4a820] disabled:opacity-50 text-[#0a1628] rounded-lg transition"
                            >
                              Marquer terminé
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {tab === 'instructors' && (
          instructorsLoading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#c9951a] border-t-transparent"></div>
            </div>
          ) : instructors.length === 0 ? (
            <div className="text-center py-16 bg-[#112240] rounded-2xl border border-[#2a4a6e]">
              <p className="text-gray-500">Aucun instructeur.</p>
            </div>
          ) : (
            <div className="bg-[#112240] rounded-2xl border border-[#2a4a6e] overflow-hidden">
              <table className="w-full text-sm">
                <thead className="border-b border-[#2a4a6e]">
                  <tr className="text-xs text-gray-400 uppercase tracking-wide">
                    <th className="text-left px-4 py-3 font-semibold">Nom</th>
                    <th className="text-left px-4 py-3 font-semibold">Matières</th>
                    <th className="text-left px-4 py-3 font-semibold">Localisation</th>
                    <th className="text-left px-4 py-3 font-semibold">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e3a5f]">
                  {instructors.map((inst) => (
                    <tr key={inst.id} className="hover:bg-[#0d1f38] transition">
                      <td className="px-4 py-3 text-white font-medium">{inst.firstName} {inst.lastName}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {inst.subjects.map((s) => s.subject.name).join(', ') || '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {inst.commune ? `${inst.commune}, ${inst.city}` : inst.city || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full border ${STATUS_STYLES[inst.status]}`}>
                          {STATUS_LABELS[inst.status]}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {tab === 'resources' && (
          resourcesLoading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#c9951a] border-t-transparent"></div>
            </div>
          ) : resourcesList.length === 0 ? (
            <div className="text-center py-16 bg-[#112240] rounded-2xl border border-[#2a4a6e]">
              <p className="text-gray-500">Aucune ressource.</p>
            </div>
          ) : (
            <div className="bg-[#112240] rounded-2xl border border-[#2a4a6e] overflow-hidden">
              <table className="w-full text-sm">
                <thead className="border-b border-[#2a4a6e]">
                  <tr className="text-xs text-gray-400 uppercase tracking-wide">
                    <th className="text-left px-4 py-3 font-semibold">Titre</th>
                    <th className="text-left px-4 py-3 font-semibold">Matière</th>
                    <th className="text-left px-4 py-3 font-semibold">Type</th>
                    <th className="text-left px-4 py-3 font-semibold">Niveau</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e3a5f]">
                  {resourcesList.map((r) => (
                    <tr key={r.id} className="hover:bg-[#0d1f38] transition">
                      <td className="px-4 py-3">
                        <button
                          onClick={() => window.open(r.fileUrl || r.externalUrl || '#', '_blank')}
                          className="text-[#c9951a] hover:underline text-left font-semibold"
                        >
                          {r.title}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-gray-300">{r.subject.name}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{RESOURCE_TYPE_LABELS[r.type]}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{r.level}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </main>
    </div>
  );
}
