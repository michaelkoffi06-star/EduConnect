'use client';

import { useEffect, useState } from 'react';
import SiteHeader from '@/components/SiteHeader';

interface Subject { id: string; name: string; }
interface InstructorSubject { subject: Subject; }
interface Instructor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  whatsapp: string;
  type: string;
  status: 'PENDING' | 'APPROVED' | 'SUSPENDED';
  levels: string;
  photoUrl?: string | null;
  cniUrl?: string | null;
  cvUrl?: string | null;
  subjects: InstructorSubject[];
}

interface MatchRequest {
  id: string;
  studentEmail: string;
  studentMessage: string;
  instructorId: string;
  instructorName: string;
  status: 'NEW' | 'CONTACTED' | 'DONE';
  createdAt: string;
}

type FilterOption = 'ALL' | 'PENDING' | 'APPROVED' | 'SUSPENDED';
type AdminTab = 'instructors' | 'requests';

const REQUEST_STATUS_STYLES: Record<string, string> = {
  NEW:       'bg-amber-900/40 text-amber-300 border-amber-500/40',
  CONTACTED: 'bg-sky-900/40 text-sky-300 border-sky-500/40',
  DONE:      'bg-emerald-900/40 text-emerald-300 border-emerald-500/40',
};

const REQUEST_STATUS_LABELS: Record<string, string> = {
  NEW:       'Nouvelle',
  CONTACTED: 'Contacté',
  DONE:      'Terminé',
};

const STATUS_STYLES: Record<string, string> = {
  PENDING:   'bg-amber-900/40 text-amber-300 border-amber-500/40',
  APPROVED:  'bg-emerald-900/40 text-emerald-300 border-emerald-500/40',
  SUSPENDED: 'bg-red-900/40 text-red-300 border-red-500/40',
};

const STATUS_LABELS: Record<string, string> = {
  PENDING:   'En attente',
  APPROVED:  'Approuvé',
  SUSPENDED: 'Suspendu',
};

export default function AdminPage() {
  const [tab, setTab] = useState<AdminTab>('instructors');

  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [filter, setFilter] = useState<FilterOption>('PENDING');
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const [requests, setRequests] = useState<MatchRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [updatingRequestId, setUpdatingRequestId] = useState<string | null>(null);

  const fetchInstructors = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/admin/instructors');
      if (!res.ok) throw new Error();
      setInstructors(await res.json());
    } catch {
      setErrorMsg("Impossible de charger les instructeurs.");
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async () => {
    setRequestsLoading(true);
    try {
      const res = await fetch('/api/admin/match-requests');
      if (!res.ok) throw new Error();
      setRequests(await res.json());
    } catch {
      setErrorMsg("Impossible de charger les demandes.");
    } finally {
      setRequestsLoading(false);
    }
  };

  useEffect(() => { fetchInstructors(); fetchRequests(); }, []);

  const updateRequestStatus = async (id: string, newStatus: string) => {
    setUpdatingRequestId(id);
    try {
      const res = await fetch(`/api/admin/match-requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setRequests((prev) => prev.map((r) => (r.id === id ? updated : r)));
    } catch {
      setErrorMsg("Impossible de mettre à jour la demande.");
    } finally {
      setUpdatingRequestId(null);
    }
  };

  const newRequestsCount = requests.filter((r) => r.status === 'NEW').length;

  const updateStatus = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/admin/instructors/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setInstructors((prev) => prev.map((i) => (i.id === id ? updated : i)));
    } catch {
      setErrorMsg("Impossible de mettre à jour le statut.");
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = filter === 'ALL' ? instructors : instructors.filter((i) => i.status === filter);
  const count = (s: FilterOption) => s === 'ALL' ? instructors.length : instructors.filter((i) => i.status === s).length;

  const filters: { value: FilterOption; label: string }[] = [
    { value: 'PENDING',   label: 'En attente' },
    { value: 'APPROVED',  label: 'Approuvés' },
    { value: 'SUSPENDED', label: 'Suspendus' },
    { value: 'ALL',       label: 'Tous' },
  ];

  return (
    <div className="min-h-screen bg-[#0a1628] text-white">

      <SiteHeader active="admin" />

      <div className="bg-[#0d1f38] border-b border-[#2a4a6e] px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs bg-[#c9951a]/20 text-[#c9951a] border border-[#c9951a]/40 px-2 py-0.5 rounded-full font-semibold">Admin</span>
            <p className="text-gray-400 text-sm">Validation et gestion des instructeurs inscrits.</p>
          </div>
          <div className="text-right">
            <span className="text-lg font-bold text-[#c9951a]">{count('PENDING')}</span>
            <span className="text-xs text-gray-400 ml-1.5">en attente</span>
            {newRequestsCount > 0 && (
              <>
                <span className="text-gray-600 mx-2">·</span>
                <span className="text-lg font-bold text-sky-400">{newRequestsCount}</span>
                <span className="text-xs text-gray-400 ml-1.5">nouvelle{newRequestsCount > 1 ? 's' : ''} demande{newRequestsCount > 1 ? 's' : ''}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-6 py-8">

        <div className="flex gap-2 mb-6 border-b border-[#2a4a6e]">
          <button
            onClick={() => setTab('instructors')}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition ${
              tab === 'instructors' ? 'border-[#c9951a] text-[#c9951a]' : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            Instructeurs
          </button>
          <button
            onClick={() => setTab('requests')}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition ${
              tab === 'requests' ? 'border-[#c9951a] text-[#c9951a]' : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            Demandes {newRequestsCount > 0 && `(${newRequestsCount})`}
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-900/30 border border-red-500/40 rounded-lg text-sm text-red-300">
            {errorMsg}
          </div>
        )}

        {tab === 'instructors' && (
          <>

        <div className="flex flex-wrap gap-2 mb-6">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold border transition ${
                filter === f.value
                  ? 'bg-[#c9951a] text-[#0a1628] border-[#c9951a]'
                  : 'bg-transparent text-gray-300 border-[#2a4a6e] hover:border-[#c9951a]/60 hover:text-white'
              }`}
            >
              {f.label} ({count(f.value)})
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#c9951a] border-t-transparent"></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-[#112240] rounded-2xl border border-[#2a4a6e]">
            <p className="text-gray-500">Aucun instructeur dans cette catégorie.</p>
          </div>
        ) : (
          <div className="bg-[#112240] rounded-2xl border border-[#2a4a6e] overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-[#2a4a6e]">
                <tr className="text-xs text-gray-400 uppercase tracking-wide">
                  <th className="text-left px-4 py-3 font-semibold">Nom</th>
                  <th className="text-left px-4 py-3 font-semibold">Contact</th>
                  <th className="text-left px-4 py-3 font-semibold">Matières</th>
                  <th className="text-left px-4 py-3 font-semibold">Documents</th>
                  <th className="text-left px-4 py-3 font-semibold">Statut</th>
                  <th className="text-right px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e3a5f]">
                {filtered.map((inst) => (
                  <tr key={inst.id} className="hover:bg-[#0d1f38] transition">
                    <td className="px-4 py-3 align-top">
                      <div className="flex items-center gap-3">
                        {inst.photoUrl ? (
                          <img
                            src={inst.photoUrl}
                            alt={`${inst.firstName} ${inst.lastName}`}
                            className="w-9 h-9 rounded-full object-cover border border-[#2a4a6e]"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-[#c9951a]/20 text-[#c9951a] flex items-center justify-center text-xs font-bold border border-[#c9951a]/30">
                            {inst.firstName[0]}{inst.lastName[0]}
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-white">{inst.firstName} {inst.lastName}</div>
                          <div className="text-xs text-gray-400 mt-0.5">{inst.type.replace('_', ' ')}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="text-gray-300">{inst.email}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{inst.whatsapp}</div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {inst.subjects.length === 0 ? (
                          <span className="text-xs text-gray-500">—</span>
                        ) : (
                          inst.subjects.map((s) => (
                            <span key={s.subject.id} className="bg-[#c9951a]/10 text-[#c9951a] text-xs px-2 py-0.5 rounded border border-[#c9951a]/30">
                              {s.subject.name}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex flex-col gap-1 text-xs">
                        {inst.cniUrl ? (
                          
                            href={`/api/admin/instructors/${inst.id}/document?type=cni`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#c9951a] hover:underline"
                          >
                            Voir la CNI
                          </a>
                        ) : (
                          <span className="text-gray-500">CNI manquante</span>
                        )}
                        {inst.cvUrl ? (
                          
                            href={`/api/admin/instructors/${inst.id}/document?type=cv`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#c9951a] hover:underline"
                          >
                            Voir le CV
                          </a>
                        ) : (
                          <span className="text-gray-500">CV manquant</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full border ${STATUS_STYLES[inst.status]}`}>
                        {STATUS_LABELS[inst.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex justify-end gap-2 flex-wrap">
                        {inst.status !== 'APPROVED' && (
                          <button
                            disabled={updatingId === inst.id}
                            onClick={() => updateStatus(inst.id, 'APPROVED')}
                            className="px-3 py-1.5 text-xs font-semibold bg-[#c9951a] hover:bg-[#d4a820] disabled:opacity-50 text-[#0a1628] rounded-lg transition"
                          >
                            Approuver
                          </button>
                        )}
                        {inst.status !== 'SUSPENDED' && (
                          <button
                            disabled={updatingId === inst.id}
                            onClick={() => updateStatus(inst.id, 'SUSPENDED')}
                            className="px-3 py-1.5 text-xs font-semibold bg-transparent border border-red-500/50 hover:bg-red-900/30 disabled:opacity-50 text-red-300 rounded-lg transition"
                          >
                            Suspendre
                          </button>
                        )}
                        {inst.status !== 'PENDING' && (
                          <button
                            disabled={updatingId === inst.id}
                            onClick={() => updateStatus(inst.id, 'PENDING')}
                            className="px-3 py-1.5 text-xs font-semibold bg-transparent border border-[#2a4a6e] hover:bg-[#0d1f38] disabled:opacity-50 text-gray-300 rounded-lg transition"
                          >
                            Remettre en attente
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

          </>
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
                        <a href={`mailto:${req.studentEmail}`} className="text-[#c9951a] hover:underline">
                          {req.studentEmail}
                        </a>
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
      </main>
    </div>
  );
}
