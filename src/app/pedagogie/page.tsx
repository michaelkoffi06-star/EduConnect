'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Subject { id: string; name: string; }
interface InstructorSubject { subject: Subject; }
interface Instructor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  whatsapp: string;
  status: 'PENDING' | 'APPROVED' | 'SUSPENDED';
  type: string;
  levels: string;
  cniUrl: string | null;
  cvUrl: string | null;
  subjects: InstructorSubject[];
}

interface Resource {
  id: string;
  title: string;
  description: string | null;
  type: 'DOCUMENT' | 'VIDEO' | 'EXERCICE' | 'LIEN';
  level: string;
  fileUrl: string | null;
  externalUrl: string | null;
  createdAt: string;
  subject: Subject;
}

interface ContractEntry {
  id: string;
  month: string;
  studentCount: number;
  sessionCount: number;
  amountReceived: number;
}
interface Contract {
  id: string;
  instructor: { id: string; firstName: string; lastName: string };
  subject: Subject;
  level: string;
  entries: ContractEntry[];
}

type Tab = 'instructors' | 'resources' | 'contracts';
type FilterOption = 'ALL' | 'PENDING' | 'APPROVED' | 'SUSPENDED';

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

export default function PedagogiePage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('instructors');
  const [errorMsg, setErrorMsg] = useState('');

  // Instructeurs
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [instructorsLoading, setInstructorsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterOption>('PENDING');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Bibliothèque
  const [resourcesList, setResourcesList] = useState<Resource[]>([]);
  const [resourcesLoading, setResourcesLoading] = useState(true);
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [deletingResourceId, setDeletingResourceId] = useState<string | null>(null);
  const [resTitle, setResTitle] = useState('');
  const [resDescription, setResDescription] = useState('');
  const [resType, setResType] = useState<'DOCUMENT' | 'VIDEO' | 'EXERCICE' | 'LIEN'>('DOCUMENT');
  const [resSubjectId, setResSubjectId] = useState('');
  const [resLevel, setResLevel] = useState('ALL');
  const [resExternalUrl, setResExternalUrl] = useState('');
  const [resFile, setResFile] = useState<File | null>(null);
  const [resSubmitting, setResSubmitting] = useState(false);
  const [resFormError, setResFormError] = useState('');

  // Contrats
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [contractsLoading, setContractsLoading] = useState(true);
  const [newInstructorId, setNewInstructorId] = useState('');
  const [newSubjectId, setNewSubjectId] = useState('');
  const [newLevel, setNewLevel] = useState('ALL');
  const [creatingContract, setCreatingContract] = useState(false);
  const [contractFormError, setContractFormError] = useState('');
  const [openContractId, setOpenContractId] = useState<string | null>(null);
  const [entryMonth, setEntryMonth] = useState('');
  const [entryStudents, setEntryStudents] = useState('');
  const [entrySessions, setEntrySessions] = useState('');
  const [entryAmount, setEntryAmount] = useState('');
  const [addingEntry, setAddingEntry] = useState(false);

  const [showAccountPanel, setShowAccountPanel] = useState(false);
  const [accCurrentPassword, setAccCurrentPassword] = useState('');
  const [accNewUsername, setAccNewUsername] = useState('');
  const [accNewPassword, setAccNewPassword] = useState('');
  const [accSubmitting, setAccSubmitting] = useState(false);
  const [accMessage, setAccMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

  const fetchSubjectsList = async () => {
    try {
      const res = await fetch('/api/subjects');
      if (!res.ok) throw new Error();
      setAllSubjects(await res.json());
    } catch {}
  };

  const fetchContracts = async () => {
    setContractsLoading(true);
    try {
      const res = await fetch('/api/bleSseD/contracts');
      if (!res.ok) throw new Error();
      setContracts(await res.json());
    } catch {
      setErrorMsg('Impossible de charger les contrats.');
    } finally {
      setContractsLoading(false);
    }
  };

  useEffect(() => {
    fetchInstructors();
    fetchResources();
    fetchSubjectsList();
    fetchContracts();
  }, []);

  const updateInstructorStatus = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/bleSseD/instructors/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setInstructors((prev) => prev.map((i) => (i.id === id ? updated : i)));
    } catch {
      setErrorMsg("Impossible de mettre à jour cet instructeur.");
    } finally {
      setUpdatingId(null);
    }
  };

  const resetResourceForm = () => {
    setResTitle('');
    setResDescription('');
    setResType('DOCUMENT');
    setResSubjectId('');
    setResLevel('ALL');
    setResExternalUrl('');
    setResFile(null);
    setResFormError('');
  };

  const handleResourceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResFormError('');
    if (!resTitle.trim() || !resSubjectId) {
      setResFormError('Titre et matière sont obligatoires.');
      return;
    }
    const needsFile = resType === 'DOCUMENT' || resType === 'EXERCICE';
    const needsUrl = resType === 'VIDEO' || resType === 'LIEN';
    if (needsFile && !resFile) {
      setResFormError('Un fichier est requis pour ce type de ressource.');
      return;
    }
    if (needsUrl && !resExternalUrl.trim()) {
      setResFormError('Une URL est requise pour ce type de ressource.');
      return;
    }
    setResSubmitting(true);
    try {
      const resourceId = crypto.randomUUID();
      if (needsFile && resFile) {
        const presignRes = await fetch('/api/bleSseD/resources/presign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resourceId, contentType: resFile.type }),
        });
        const presignData = await presignRes.json();
        if (!presignRes.ok) throw new Error(presignData.error || 'Échec de la présignature.');
        const putRes = await fetch(presignData.uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': resFile.type },
          body: resFile,
        });
        if (!putRes.ok) throw new Error("Échec de l'envoi du fichier.");
      }
      const createRes = await fetch('/api/bleSseD/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resourceId,
          title: resTitle.trim(),
          description: resDescription.trim() || undefined,
          type: resType,
          subjectId: resSubjectId,
          level: resLevel,
          contentType: needsFile ? resFile?.type : undefined,
          externalUrl: needsUrl ? resExternalUrl.trim() : undefined,
        }),
      });
      const createResult = await createRes.json();
      if (!createRes.ok) throw new Error(createResult.error || 'Erreur lors de la création.');
      setResourcesList((prev) => [createResult, ...prev]);
      resetResourceForm();
    } catch (err: any) {
      setResFormError(err.message || 'Une erreur est survenue.');
    } finally {
      setResSubmitting(false);
    }
  };

  const handleDeleteResource = async (id: string) => {
    setDeletingResourceId(id);
    try {
      const res = await fetch(`/api/bleSseD/resources/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setResourcesList((prev) => prev.filter((r) => r.id !== id));
    } catch {
      setErrorMsg('Impossible de supprimer cette ressource.');
    } finally {
      setDeletingResourceId(null);
    }
  };

  const handleCreateContract = async (e: React.FormEvent) => {
    e.preventDefault();
    setContractFormError('');
    if (!newInstructorId || !newSubjectId) {
      setContractFormError('Instructeur et matière sont obligatoires.');
      return;
    }
    setCreatingContract(true);
    try {
      const res = await fetch('/api/bleSseD/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instructorId: newInstructorId, subjectId: newSubjectId, level: newLevel }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Erreur lors de la création.');
      setContracts((prev) => [result, ...prev]);
      setNewInstructorId('');
      setNewSubjectId('');
      setNewLevel('ALL');
    } catch (err: any) {
      setContractFormError(err.message || 'Une erreur est survenue.');
    } finally {
      setCreatingContract(false);
    }
  };

  const handleAddEntry = async (contractId: string) => {
    if (!entryMonth || !entryStudents || !entrySessions || !entryAmount) return;
    setAddingEntry(true);
    try {
      const res = await fetch(`/api/bleSseD/contracts/${contractId}/entries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month: `${entryMonth}-01`,
          studentCount: Number(entryStudents),
          sessionCount: Number(entrySessions),
          amountReceived: Number(entryAmount),
        }),
      });
      if (!res.ok) throw new Error();
      await fetchContracts();
      setEntryMonth('');
      setEntryStudents('');
      setEntrySessions('');
      setEntryAmount('');
    } catch {
      setErrorMsg("Impossible d'ajouter cette entrée mensuelle.");
    } finally {
      setAddingEntry(false);
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

  const count = (s: FilterOption) =>
    s === 'ALL' ? instructors.length : instructors.filter((i) => i.status === s).length;
  const filteredInstructors = filter === 'ALL' ? instructors : instructors.filter((i) => i.status === filter);
  const approvedInstructors = instructors.filter((i) => i.status === 'APPROVED');

  const filters: { value: FilterOption; label: string }[] = [
    { value: 'PENDING', label: 'En attente' },
    { value: 'APPROVED', label: 'Approuvés' },
    { value: 'SUSPENDED', label: 'Suspendus' },
    { value: 'ALL', label: 'Tous' },
  ];

  return (
    <div className="min-h-screen bg-[#0a1628]">
      <header className="bg-[#0d1f38] border-b border-[#2a4a6e] px-6 py-4 flex items-center justify-between">
        <div>
          <span className="inline-block px-3 py-1 rounded-full bg-[#c9951a]/15 text-[#c9951a] text-xs font-bold uppercase tracking-wide mr-3">
            Pédagogie
          </span>
          <span className="text-gray-400 text-sm">Instructeurs, bibliothèque et suivi des contrats.</span>
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
            onClick={() => setTab('instructors')}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition ${
              tab === 'instructors' ? 'border-[#c9951a] text-[#c9951a]' : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            Instructeurs
          </button>
          <button
            onClick={() => setTab('resources')}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition ${
              tab === 'resources' ? 'border-[#c9951a] text-[#c9951a]' : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            Bibliothèque
          </button>
          <button
            onClick={() => setTab('contracts')}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition ${
              tab === 'contracts' ? 'border-[#c9951a] text-[#c9951a]' : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            Contrats
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-900/30 border border-red-500/40 rounded-lg text-sm text-red-300">
            {errorMsg}
          </div>
        )}

        {tab === 'instructors' && (
          <div>
            <div className="flex gap-2 mb-4 flex-wrap">
              {filters.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition ${
                    filter === f.value
                      ? 'bg-[#c9951a] text-[#0a1628] border-[#c9951a]'
                      : 'bg-transparent text-gray-400 border-[#2a4a6e] hover:text-white'
                  }`}
                >
                  {f.label} ({count(f.value)})
                </button>
              ))}
            </div>
            {instructorsLoading ? (
              <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#c9951a] border-t-transparent"></div>
              </div>
            ) : filteredInstructors.length === 0 ? (
              <div className="text-center py-16 bg-[#112240] rounded-2xl border border-[#2a4a6e]">
                <p className="text-gray-500">Aucun instructeur dans cette catégorie.</p>
              </div>
            ) : (
              <div className="bg-[#112240] rounded-2xl border border-[#2a4a6e] overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="border-b border-[#2a4a6e]">
                    <tr className="text-xs text-gray-400 uppercase tracking-wide">
                      <th className="text-left px-4 py-3 font-semibold">Nom</th>
                      <th className="text-left px-4 py-3 font-semibold">Matières</th>
                      <th className="text-left px-4 py-3 font-semibold">Documents</th>
                      <th className="text-left px-4 py-3 font-semibold">Statut</th>
                      <th className="text-right px-4 py-3 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e3a5f]">
                    {filteredInstructors.map((inst) => (
                      <tr key={inst.id} className="hover:bg-[#0d1f38] transition align-top">
                        <td className="px-4 py-3 text-gray-300">
                          <p className="font-semibold text-white">{inst.firstName} {inst.lastName}</p>
                          <p className="text-xs text-gray-500">{inst.email}</p>
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-xs">
                          {inst.subjects.map((s) => s.subject.name).join(', ') || '—'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            {inst.cniUrl && (
                              <button
                                onClick={() => window.open(`/api/bleSseD/instructors/${inst.id}/document?type=cni`, '_blank')}
                                className="text-xs text-[#c9951a] hover:underline"
                              >
                                CNI
                              </button>
                            )}
                            {inst.cvUrl && (
                              <button
                                onClick={() => window.open(`/api/bleSseD/instructors/${inst.id}/document?type=cv`, '_blank')}
                                className="text-xs text-[#c9951a] hover:underline"
                              >
                                CV
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full border ${STATUS_STYLES[inst.status]}`}>
                            {STATUS_LABELS[inst.status]}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2 flex-wrap">
                            {inst.status !== 'APPROVED' && (
                              <button
                                disabled={updatingId === inst.id}
                                onClick={() => updateInstructorStatus(inst.id, 'APPROVED')}
                                className="px-3 py-1.5 text-xs font-semibold bg-emerald-600/80 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg transition"
                              >
                                Approuver
                              </button>
                            )}
                            {inst.status !== 'SUSPENDED' && (
                              <button
                                disabled={updatingId === inst.id}
                                onClick={() => updateInstructorStatus(inst.id, 'SUSPENDED')}
                                className="px-3 py-1.5 text-xs font-semibold bg-red-900/40 hover:bg-red-900/70 disabled:opacity-50 text-red-300 rounded-lg transition"
                              >
                                Suspendre
                              </button>
                            )}
                            <button
                              onClick={() => window.open(`/api/bleSseD/instructors/${inst.id}/export`, '_blank')}
                              className="px-3 py-1.5 text-xs font-semibold bg-[#0d1f38] hover:bg-[#1a2f4d] border border-[#2a4a6e] text-white rounded-lg transition"
                            >
                              Télécharger la fiche
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === 'resources' && (
          <div className="space-y-6">
            <div className="bg-[#112240] rounded-2xl border border-[#2a4a6e] p-5">
              <h3 className="text-sm font-semibold text-white mb-4">Ajouter une ressource</h3>
              <form onSubmit={handleResourceSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Titre *</label>
                    <input
                      value={resTitle}
                      onChange={(e) => setResTitle(e.target.value)}
                      className="w-full px-3 py-2 bg-[#0d1f38] border border-[#2a4a6e] rounded-lg text-sm text-white focus:outline-none focus:border-[#c9951a]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Matière *</label>
                    <select
                      value={resSubjectId}
                      onChange={(e) => setResSubjectId(e.target.value)}
                      className="w-full px-3 py-2 bg-[#0d1f38] border border-[#2a4a6e] rounded-lg text-sm text-white focus:outline-none focus:border-[#c9951a]"
                    >
                      <option value="">Choisir une matière</option>
                      {allSubjects.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Type *</label>
                    <select
                      value={resType}
                      onChange={(e) => setResType(e.target.value as typeof resType)}
                      className="w-full px-3 py-2 bg-[#0d1f38] border border-[#2a4a6e] rounded-lg text-sm text-white focus:outline-none focus:border-[#c9951a]"
                    >
                      <option value="DOCUMENT">Document (PDF/image)</option>
                      <option value="EXERCICE">Exercice (PDF/image)</option>
                      <option value="VIDEO">Vidéo (lien YouTube/Vimeo)</option>
                      <option value="LIEN">Lien externe</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Niveau</label>
                    <select
                      value={resLevel}
                      onChange={(e) => setResLevel(e.target.value)}
                      className="w-full px-3 py-2 bg-[#0d1f38] border border-[#2a4a6e] rounded-lg text-sm text-white focus:outline-none focus:border-[#c9951a]"
                    >
                      <option value="ALL">Tous niveaux</option>
                      <option value="PRIMAIRE">Primaire</option>
                      <option value="COLLEGE">Collège</option>
                      <option value="LYCEE">Lycée</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Description</label>
                  <textarea
                    value={resDescription}
                    onChange={(e) => setResDescription(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 bg-[#0d1f38] border border-[#2a4a6e] rounded-lg text-sm text-white focus:outline-none focus:border-[#c9951a] resize-none"
                    placeholder="Optionnel"
                  />
                </div>
                {(resType === 'DOCUMENT' || resType === 'EXERCICE') ? (
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Fichier (PDF, JPEG, PNG — 10 Mo max) *</label>
                    <input
                      type="file"
                      accept="application/pdf,image/jpeg,image/png"
                      onChange={(e) => setResFile(e.target.files?.[0] || null)}
                      className="w-full text-xs text-gray-300 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-[#c9951a] file:text-white file:text-xs file:font-semibold"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">
                      {resType === 'VIDEO' ? 'Lien YouTube/Vimeo *' : 'URL *'}
                    </label>
                    <input
                      value={resExternalUrl}
                      onChange={(e) => setResExternalUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3 py-2 bg-[#0d1f38] border border-[#2a4a6e] rounded-lg text-sm text-white focus:outline-none focus:border-[#c9951a]"
                    />
                  </div>
                )}
                {resFormError && (
                  <div className="p-2.5 bg-red-900/30 border border-red-500/40 rounded-lg text-xs text-red-300">
                    {resFormError}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={resSubmitting}
                  className="px-4 py-2.5 bg-[#c9951a] hover:bg-[#d4a820] disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition"
                >
                  {resSubmitting ? 'Ajout en cours...' : 'Ajouter la ressource'}
                </button>
              </form>
            </div>

            {resourcesLoading ? (
              <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#c9951a] border-t-transparent"></div>
              </div>
            ) : resourcesList.length === 0 ? (
              <div className="text-center py-16 bg-[#112240] rounded-2xl border border-[#2a4a6e]">
                <p className="text-gray-500">Aucune ressource pour le moment.</p>
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
                      <th className="text-right px-4 py-3 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e3a5f]">
                    {resourcesList.map((r) => (
                      <tr key={r.id} className="hover:bg-[#0d1f38] transition align-top">
                        <td className="px-4 py-3 text-gray-300 max-w-xs">
                          <button
                            onClick={() => window.open(r.fileUrl || r.externalUrl || '#', '_blank')}
                            className="text-[#c9951a] hover:underline font-semibold text-left"
                          >
                            {r.title}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-gray-300">{r.subject.name}</td>
                        <td className="px-4 py-3 text-gray-400 text-xs">{RESOURCE_TYPE_LABELS[r.type]}</td>
                        <td className="px-4 py-3 text-gray-400 text-xs">{r.level}</td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end">
                            <button
                              disabled={deletingResourceId === r.id}
                              onClick={() => handleDeleteResource(r.id)}
                              className="px-3 py-1.5 text-xs font-semibold bg-red-900/40 hover:bg-red-900/70 disabled:opacity-50 text-red-300 rounded-lg transition"
                            >
                              Supprimer
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === 'contracts' && (
          <div className="space-y-6">
            <div className="bg-[#112240] rounded-2xl border border-[#2a4a6e] p-5">
              <h3 className="text-sm font-semibold text-white mb-4">Nouveau contrat</h3>
              <form onSubmit={handleCreateContract} className="grid grid-cols-3 gap-3 items-end">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Instructeur *</label>
                  <select
                    value={newInstructorId}
                    onChange={(e) => setNewInstructorId(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0d1f38] border border-[#2a4a6e] rounded-lg text-sm text-white focus:outline-none focus:border-[#c9951a]"
                  >
                    <option value="">Choisir</option>
                    {approvedInstructors.map((i) => (
                      <option key={i.id} value={i.id}>{i.firstName} {i.lastName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Matière *</label>
                  <select
                    value={newSubjectId}
                    onChange={(e) => setNewSubjectId(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0d1f38] border border-[#2a4a6e] rounded-lg text-sm text-white focus:outline-none focus:border-[#c9951a]"
                  >
                    <option value="">Choisir</option>
                    {allSubjects.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Niveau</label>
                  <select
                    value={newLevel}
                    onChange={(e) => setNewLevel(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0d1f38] border border-[#2a4a6e] rounded-lg text-sm text-white focus:outline-none focus:border-[#c9951a]"
                  >
                    <option value="ALL">Tous niveaux</option>
                    <option value="PRIMAIRE">Primaire</option>
                    <option value="COLLEGE">Collège</option>
                    <option value="LYCEE">Lycée</option>
                  </select>
                </div>
                {contractFormError && (
                  <div className="col-span-3 p-2.5 bg-red-900/30 border border-red-500/40 rounded-lg text-xs text-red-300">
                    {contractFormError}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={creatingContract}
                  className="col-span-3 px-4 py-2.5 bg-[#c9951a] hover:bg-[#d4a820] disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition"
                >
                  {creatingContract ? 'Création...' : 'Créer le contrat'}
                </button>
              </form>
            </div>

            {contractsLoading ? (
              <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#c9951a] border-t-transparent"></div>
              </div>
            ) : contracts.length === 0 ? (
              <div className="text-center py-16 bg-[#112240] rounded-2xl border border-[#2a4a6e]">
                <p className="text-gray-500">Aucun contrat pour le moment.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {contracts.map((c) => {
                  const latest = c.entries[0];
                  const isOpen = openContractId === c.id;
                  return (
                    <div key={c.id} className="bg-[#112240] rounded-2xl border border-[#2a4a6e] overflow-hidden">
                      <div className="p-4 flex items-center justify-between flex-wrap gap-3">
                        <div>
                          <p className="text-white font-semibold text-sm">
                            {c.instructor.firstName} {c.instructor.lastName}
                          </p>
                          <p className="text-xs text-gray-400">{c.subject.name} — {c.level}</p>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-300">
                          {latest ? (
                            <>
                              <span>{latest.studentCount} élève(s)</span>
                              <span>{latest.sessionCount} séance(s)</span>
                              <span className="font-semibold text-[#c9951a]">{latest.amountReceived.toLocaleString('fr-FR')} FCFA</span>
                            </>
                          ) : (
                            <span className="text-gray-500 italic">Aucune donnée mensuelle</span>
                          )}
                          <button
                            onClick={() => setOpenContractId(isOpen ? null : c.id)}
                            className="px-3 py-1.5 text-xs font-semibold bg-[#0d1f38] hover:bg-[#1a2f4d] border border-[#2a4a6e] text-white rounded-lg transition"
                          >
                            {isOpen ? 'Fermer' : 'Détails'}
                          </button>
                        </div>
                      </div>

                      {isOpen && (
                        <div className="border-t border-[#2a4a6e] p-4 space-y-4">
                          <div>
                            <h4 className="text-xs font-semibold text-gray-400 uppercase mb-2">Historique mensuel</h4>
                            {c.entries.length === 0 ? (
                              <p className="text-xs text-gray-500 italic">Aucune entrée pour l'instant.</p>
                            ) : (
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="text-gray-400 uppercase">
                                    <th className="text-left py-1">Mois</th>
                                    <th className="text-left py-1">Élèves</th>
                                    <th className="text-left py-1">Séances</th>
                                    <th className="text-left py-1">Montant</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-[#1e3a5f]">
                                  {c.entries.map((e) => (
                                    <tr key={e.id} className="text-gray-300">
                                      <td className="py-1.5">
                                        {new Date(e.month).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                                      </td>
                                      <td className="py-1.5">{e.studentCount}</td>
                                      <td className="py-1.5">{e.sessionCount}</td>
                                      <td className="py-1.5">{e.amountReceived.toLocaleString('fr-FR')} FCFA</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </div>

                          <div>
                            <h4 className="text-xs font-semibold text-gray-400 uppercase mb-2">Ajouter / mettre à jour un mois</h4>
                            <div className="grid grid-cols-4 gap-2">
                              <input
                                type="month"
                                value={entryMonth}
                                onChange={(e) => setEntryMonth(e.target.value)}
                                className="px-2 py-1.5 bg-[#0d1f38] border border-[#2a4a6e] rounded-lg text-xs text-white focus:outline-none focus:border-[#c9951a]"
                              />
                              <input
                                type="number"
                                min="0"
                                placeholder="Élèves"
                                value={entryStudents}
                                onChange={(e) => setEntryStudents(e.target.value)}
                                className="px-2 py-1.5 bg-[#0d1f38] border border-[#2a4a6e] rounded-lg text-xs text-white focus:outline-none focus:border-[#c9951a]"
                              />
                              <input
                                type="number"
                                min="0"
                                placeholder="Séances"
                                value={entrySessions}
                                onChange={(e) => setEntrySessions(e.target.value)}
                                className="px-2 py-1.5 bg-[#0d1f38] border border-[#2a4a6e] rounded-lg text-xs text-white focus:outline-none focus:border-[#c9951a]"
                              />
                              <input
                                type="number"
                                min="0"
                                placeholder="Montant (FCFA)"
                                value={entryAmount}
                                onChange={(e) => setEntryAmount(e.target.value)}
                                className="px-2 py-1.5 bg-[#0d1f38] border border-[#2a4a6e] rounded-lg text-xs text-white focus:outline-none focus:border-[#c9951a]"
                              />
                            </div>
                            <button
                              disabled={addingEntry}
                              onClick={() => handleAddEntry(c.id)}
                              className="mt-2 px-3 py-1.5 text-xs font-semibold bg-[#c9951a] hover:bg-[#d4a820] disabled:opacity-50 text-white rounded-lg transition"
                            >
                              {addingEntry ? 'Enregistrement...' : 'Enregistrer ce mois'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
