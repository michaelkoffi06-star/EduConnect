'use client';

import React, { useEffect, useMemo, useState } from 'react';

// Onglet "Bibliothèque" commun aux panneaux /bleSseD, /pedagogie (canEdit) et /administratif
// (lecture seule). Gère les couleurs des matières, les chapitres (classeurs) et les ressources.
// Voir §7quaterdecies de la doc.

type Level = 'PRIMAIRE' | 'COLLEGE' | 'LYCEE' | 'ALL';
type ResType = 'DOCUMENT' | 'VIDEO' | 'EXERCICE' | 'LIEN';

interface Subject { id: string; name: string; slug: string; color: string | null; }
interface Chapter {
  id: string;
  title: string;
  slug: string;
  level: Level;
  classe: string | null;
  order: number;
  subject: { id: string; name: string; slug: string };
  _count: { resources: number };
}
interface Resource {
  id: string;
  title: string;
  description: string | null;
  type: ResType;
  level: Level;
  position: number;
  fileUrl: string | null;
  externalUrl: string | null;
  viewCount: number;
  downloadCount: number;
  ref: string;
  urlKey: string;
  subject: { id: string; name: string; slug: string; color: string };
  chapter: { id: string; title: string; classe: string | null } | null;
}

const TYPE_LABELS: Record<ResType, string> = { DOCUMENT: 'Document', VIDEO: 'Vidéo', EXERCICE: 'Exercice', LIEN: 'Lien' };
const LEVEL_LABELS: Record<Level, string> = { PRIMAIRE: 'Primaire', COLLEGE: 'Collège', LYCEE: 'Lycée', ALL: 'Tous niveaux' };

const card = 'bg-[#112240] rounded-2xl border border-[#2a4a6e] p-5';
const input = 'w-full px-3 py-2 bg-[#0d1f38] border border-[#2a4a6e] rounded-lg text-sm text-white focus:outline-none focus:border-[#c9951a]';
const label = 'block text-xs text-gray-400 mb-1';
const primaryBtn = 'px-4 py-2.5 bg-[#c9951a] hover:bg-[#d4a820] disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition';
const dangerBtn = 'px-3 py-1.5 text-xs font-semibold bg-red-900/40 hover:bg-red-900/70 disabled:opacity-50 text-red-300 rounded-lg transition';
const ghostBtn = 'px-3 py-1.5 text-xs font-semibold bg-[#0d1f38] hover:bg-[#1e3a5f] border border-[#2a4a6e] disabled:opacity-50 text-gray-200 rounded-lg transition';

function chapterLabel(c: { title: string; classe: string | null }) {
  return c.classe ? `${c.title} (${c.classe})` : c.title;
}

export default function LibraryManager({
  canEdit,
  onCountChange,
}: {
  canEdit: boolean;
  onCountChange?: (count: number) => void;
}) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  // Formulaire chapitre
  const [chSubjectId, setChSubjectId] = useState('');
  const [chTitle, setChTitle] = useState('');
  const [chLevel, setChLevel] = useState<Level>('COLLEGE');
  const [chClasse, setChClasse] = useState('');
  const [chOrder, setChOrder] = useState('0');
  const [chSubmitting, setChSubmitting] = useState(false);
  const [chError, setChError] = useState('');
  const [editingChapter, setEditingChapter] = useState<{ id: string; title: string; classe: string; order: string } | null>(null);

  // Formulaire ressource
  const [resTitle, setResTitle] = useState('');
  const [resDescription, setResDescription] = useState('');
  const [resType, setResType] = useState<ResType>('DOCUMENT');
  const [resSubjectId, setResSubjectId] = useState('');
  const [resChapterId, setResChapterId] = useState('');
  const [resPosition, setResPosition] = useState('0');
  const [resLevel, setResLevel] = useState<Level>('ALL');
  const [resExternalUrl, setResExternalUrl] = useState('');
  const [resFile, setResFile] = useState<File | null>(null);
  const [resSubmitting, setResSubmitting] = useState(false);
  const [resFormError, setResFormError] = useState('');

  // Filtre de la liste
  const [filterSubjectId, setFilterSubjectId] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [sRes, cRes, rRes] = await Promise.all([
          fetch('/api/subjects'),
          fetch('/api/bleSseD/chapters'),
          fetch('/api/bleSseD/resources'),
        ]);
        if (!sRes.ok || !cRes.ok || !rRes.ok) throw new Error();
        setSubjects(await sRes.json());
        setChapters(await cRes.json());
        setResources(await rRes.json());
      } catch {
        setError('Impossible de charger la bibliothèque.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    onCountChange?.(resources.length);
  }, [resources.length, onCountChange]);

  const chaptersBySubject = useMemo(() => {
    const map: Record<string, Chapter[]> = {};
    for (const c of chapters) (map[c.subject.id] ||= []).push(c);
    return map;
  }, [chapters]);

  const visibleResources = filterSubjectId ? resources.filter((r) => r.subject.id === filterSubjectId) : resources;

  const refreshChapterCounts = (list: Resource[]) => {
    setChapters((prev) =>
      prev.map((c) => ({ ...c, _count: { resources: list.filter((r) => r.chapter?.id === c.id).length } }))
    );
  };

  // --- Couleurs des matières ---
  const saveSubjectColor = async (subject: Subject, color: string | null) => {
    setBusyId(subject.id);
    setError('');
    try {
      const res = await fetch(`/api/bleSseD/subjects/${subject.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ color }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSubjects((prev) => prev.map((s) => (s.id === subject.id ? { ...s, color: data.color } : s)));
    } catch (err: any) {
      setError(err.message || 'Impossible de changer la couleur.');
    } finally {
      setBusyId(null);
    }
  };

  // --- Chapitres ---
  const handleCreateChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    setChError('');
    if (!chSubjectId || !chTitle.trim()) {
      setChError('Matière et titre sont obligatoires.');
      return;
    }
    setChSubmitting(true);
    try {
      const res = await fetch('/api/bleSseD/chapters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subjectId: chSubjectId, title: chTitle.trim(), level: chLevel, classe: chClasse, order: Number(chOrder) || 0 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setChapters((prev) =>
        [...prev, data].sort((a, b) =>
          a.subject.name.localeCompare(b.subject.name) || a.order - b.order || a.title.localeCompare(b.title)
        )
      );
      setChTitle('');
      setChClasse('');
      setChOrder('0');
    } catch (err: any) {
      setChError(err.message || 'Impossible de créer le chapitre.');
    } finally {
      setChSubmitting(false);
    }
  };

  const handleSaveChapter = async () => {
    if (!editingChapter) return;
    setBusyId(editingChapter.id);
    setError('');
    try {
      const res = await fetch(`/api/bleSseD/chapters/${editingChapter.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editingChapter.title, classe: editingChapter.classe, order: Number(editingChapter.order) || 0 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setChapters((prev) => prev.map((c) => (c.id === data.id ? data : c)));
      setResources((prev) =>
        prev.map((r) => (r.chapter?.id === data.id ? { ...r, chapter: { id: data.id, title: data.title, classe: data.classe } } : r))
      );
      setEditingChapter(null);
    } catch (err: any) {
      setError(err.message || 'Impossible de modifier le chapitre.');
    } finally {
      setBusyId(null);
    }
  };

  const handleDeleteChapter = async (c: Chapter) => {
    if (!window.confirm(`Supprimer le chapitre « ${chapterLabel(c)} » ? Ses ${c._count.resources} ressource(s) seront conservées mais détachées.`)) return;
    setBusyId(c.id);
    setError('');
    try {
      const res = await fetch(`/api/bleSseD/chapters/${c.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json()).error);
      setChapters((prev) => prev.filter((x) => x.id !== c.id));
      setResources((prev) => prev.map((r) => (r.chapter?.id === c.id ? { ...r, chapter: null } : r)));
    } catch (err: any) {
      setError(err.message || 'Impossible de supprimer le chapitre.');
    } finally {
      setBusyId(null);
    }
  };

  // --- Ressources ---
  const resetResourceForm = () => {
    setResTitle('');
    setResDescription('');
    setResType('DOCUMENT');
    setResChapterId('');
    setResPosition('0');
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
      const chapter = chapters.find((c) => c.id === resChapterId);
      const createRes = await fetch('/api/bleSseD/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resourceId,
          title: resTitle.trim(),
          description: resDescription.trim() || undefined,
          type: resType,
          subjectId: resSubjectId,
          chapterId: resChapterId || undefined,
          position: Number(resPosition) || 0,
          level: chapter && resLevel === 'ALL' ? chapter.level : resLevel,
          contentType: needsFile ? resFile?.type : undefined,
          externalUrl: needsUrl ? resExternalUrl.trim() : undefined,
        }),
      });
      const created = await createRes.json();
      if (!createRes.ok) throw new Error(created.error || 'Erreur lors de la création.');
      const next = [created, ...resources];
      setResources(next);
      refreshChapterCounts(next);
      resetResourceForm();
    } catch (err: any) {
      setResFormError(err.message || 'Une erreur est survenue.');
    } finally {
      setResSubmitting(false);
    }
  };

  const patchResource = async (r: Resource, body: Record<string, unknown>) => {
    setBusyId(r.id);
    setError('');
    try {
      const res = await fetch(`/api/bleSseD/resources/${r.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const next = resources.map((x) => (x.id === r.id ? data : x));
      setResources(next);
      refreshChapterCounts(next);
    } catch (err: any) {
      setError(err.message || 'Impossible de modifier la ressource.');
    } finally {
      setBusyId(null);
    }
  };

  const handleDeleteResource = async (r: Resource) => {
    if (!window.confirm(`Supprimer « ${r.title} » ? Le fichier sera aussi effacé.`)) return;
    setBusyId(r.id);
    setError('');
    try {
      const res = await fetch(`/api/bleSseD/resources/${r.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      const next = resources.filter((x) => x.id !== r.id);
      setResources(next);
      refreshChapterCounts(next);
    } catch {
      setError('Impossible de supprimer cette ressource.');
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

  const formChapters = resSubjectId ? chaptersBySubject[resSubjectId] || [] : [];

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 bg-red-900/30 border border-red-500/40 rounded-lg text-sm text-red-300">{error}</div>
      )}

      {canEdit && (
        <div className={card}>
          <h3 className="text-sm font-semibold text-white mb-1">Couleurs des matières</h3>
          <p className="text-xs text-gray-400 mb-4">Couleur des tranches de livres sur l’étagère publique. Sans couleur choisie, une couleur est attribuée automatiquement.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {subjects.map((s) => (
              <div key={s.id} className="flex items-center gap-2 bg-[#0d1f38] border border-[#2a4a6e] rounded-lg px-3 py-2">
                <input
                  type="color"
                  aria-label={`Couleur de ${s.name}`}
                  value={s.color || '#8FB3AB'}
                  disabled={busyId === s.id}
                  onChange={(e) => setSubjects((prev) => prev.map((x) => (x.id === s.id ? { ...x, color: e.target.value } : x)))}
                  onBlur={(e) => saveSubjectColor(s, e.target.value)}
                  className="h-8 w-8 shrink-0 cursor-pointer rounded border-0 bg-transparent p-0"
                />
                <span className="text-sm text-gray-200 truncate flex-1">{s.name}</span>
                {s.color && (
                  <button type="button" onClick={() => saveSubjectColor(s, null)} className="text-[11px] text-gray-400 hover:text-white" title="Revenir à la couleur automatique">
                    auto
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={card}>
        <h3 className="text-sm font-semibold text-white mb-1">Chapitres (classeurs)</h3>
        <p className="text-xs text-gray-400 mb-4">Chaque chapitre regroupe les ressources d’une matière pour une classe : il s’ouvre comme un classeur à onglets sur le site.</p>

        {canEdit && (
          <form onSubmit={handleCreateChapter} className="grid grid-cols-2 md:grid-cols-6 gap-3 items-end mb-5">
            <div className="md:col-span-1">
              <label className={label}>Matière *</label>
              <select value={chSubjectId} onChange={(e) => setChSubjectId(e.target.value)} className={input}>
                <option value="">Choisir</option>
                {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="col-span-2 md:col-span-2">
              <label className={label}>Titre *</label>
              <input value={chTitle} onChange={(e) => setChTitle(e.target.value)} placeholder="Théorème de Pythagore" className={input} />
            </div>
            <div>
              <label className={label}>Niveau *</label>
              <select value={chLevel} onChange={(e) => setChLevel(e.target.value as Level)} className={input}>
                {(['PRIMAIRE', 'COLLEGE', 'LYCEE', 'ALL'] as Level[]).map((l) => <option key={l} value={l}>{LEVEL_LABELS[l]}</option>)}
              </select>
            </div>
            <div>
              <label className={label}>Classe</label>
              <input value={chClasse} onChange={(e) => setChClasse(e.target.value)} placeholder="3e, Tle D…" className={input} />
            </div>
            <div className="flex gap-2 items-end">
              <div className="w-16">
                <label className={label}>Ordre</label>
                <input type="number" value={chOrder} onChange={(e) => setChOrder(e.target.value)} className={input} />
              </div>
              <button type="submit" disabled={chSubmitting} className={primaryBtn}>{chSubmitting ? '…' : 'Créer'}</button>
            </div>
            {chError && <div className="col-span-2 md:col-span-6 p-2.5 bg-red-900/30 border border-red-500/40 rounded-lg text-xs text-red-300">{chError}</div>}
          </form>
        )}

        {chapters.length === 0 ? (
          <p className="text-sm text-gray-500">Aucun chapitre pour le moment.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-[#2a4a6e]">
                <tr className="text-xs text-gray-400 uppercase tracking-wide">
                  <th className="text-left px-3 py-2 font-semibold">Matière</th>
                  <th className="text-left px-3 py-2 font-semibold">Chapitre</th>
                  <th className="text-left px-3 py-2 font-semibold">Niveau</th>
                  <th className="text-left px-3 py-2 font-semibold">Ordre</th>
                  <th className="text-left px-3 py-2 font-semibold">Ressources</th>
                  {canEdit && <th className="text-right px-3 py-2 font-semibold">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e3a5f]">
                {chapters.map((c) => {
                  const edit = editingChapter && editingChapter.id === c.id ? editingChapter : null;
                  return (
                    <tr key={c.id} className="align-middle">
                      <td className="px-3 py-2 text-gray-300">{c.subject.name}</td>
                      <td className="px-3 py-2 text-gray-200">
                        {edit ? (
                          <div className="flex gap-2">
                            <input aria-label="Titre du chapitre" value={edit.title} onChange={(e) => setEditingChapter({ ...edit, title: e.target.value })} className={input} />
                            <input aria-label="Classe" value={edit.classe} onChange={(e) => setEditingChapter({ ...edit, classe: e.target.value })} placeholder="Classe" className={`${input} w-24`} />
                          </div>
                        ) : chapterLabel(c)}
                      </td>
                      <td className="px-3 py-2 text-gray-400 text-xs">{LEVEL_LABELS[c.level]}</td>
                      <td className="px-3 py-2 text-gray-400 text-xs">
                        {edit ? (
                          <input aria-label="Ordre" type="number" value={edit.order} onChange={(e) => setEditingChapter({ ...edit, order: e.target.value })} className={`${input} w-16`} />
                        ) : c.order}
                      </td>
                      <td className="px-3 py-2 text-gray-400 text-xs">{c._count.resources}</td>
                      {canEdit && (
                        <td className="px-3 py-2">
                          <div className="flex justify-end gap-2">
                            {edit ? (
                              <>
                                <button disabled={busyId === c.id} onClick={handleSaveChapter} className={ghostBtn}>Enregistrer</button>
                                <button onClick={() => setEditingChapter(null)} className={ghostBtn}>Annuler</button>
                              </>
                            ) : (
                              <>
                                <button onClick={() => setEditingChapter({ id: c.id, title: c.title, classe: c.classe || '', order: String(c.order) })} className={ghostBtn}>Modifier</button>
                                <button disabled={busyId === c.id} onClick={() => handleDeleteChapter(c)} className={dangerBtn}>Supprimer</button>
                              </>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {canEdit && (
        <div className={card}>
          <h3 className="text-sm font-semibold text-white mb-4">Ajouter une ressource</h3>
          <form onSubmit={handleResourceSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={label}>Titre *</label>
                <input value={resTitle} onChange={(e) => setResTitle(e.target.value)} className={input} />
              </div>
              <div>
                <label className={label}>Matière *</label>
                <select
                  value={resSubjectId}
                  onChange={(e) => { setResSubjectId(e.target.value); setResChapterId(''); }}
                  className={input}
                >
                  <option value="">Choisir une matière</option>
                  {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="col-span-2">
                <label className={label}>Chapitre (classeur)</label>
                <select value={resChapterId} onChange={(e) => setResChapterId(e.target.value)} disabled={!resSubjectId} className={input}>
                  <option value="">{resSubjectId ? 'Aucun chapitre' : 'Choisir d’abord la matière'}</option>
                  {formChapters.map((c) => <option key={c.id} value={c.id}>{chapterLabel(c)}</option>)}
                </select>
              </div>
              <div>
                <label className={label}>Position dans le classeur</label>
                <input type="number" value={resPosition} onChange={(e) => setResPosition(e.target.value)} className={input} />
              </div>
              <div>
                <label className={label}>Niveau</label>
                <select value={resLevel} onChange={(e) => setResLevel(e.target.value as Level)} className={input}>
                  <option value="ALL">{resChapterId ? 'Celui du chapitre' : 'Tous niveaux'}</option>
                  <option value="PRIMAIRE">Primaire</option>
                  <option value="COLLEGE">Collège</option>
                  <option value="LYCEE">Lycée</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={label}>Type *</label>
                <select value={resType} onChange={(e) => setResType(e.target.value as ResType)} className={input}>
                  <option value="DOCUMENT">Document / cours (PDF ou image)</option>
                  <option value="EXERCICE">Exercice (PDF ou image)</option>
                  <option value="VIDEO">Vidéo (lien YouTube/Vimeo)</option>
                  <option value="LIEN">Lien externe</option>
                </select>
              </div>
              {(resType === 'DOCUMENT' || resType === 'EXERCICE') ? (
                <div>
                  <label className={label}>Fichier (PDF, JPEG, PNG — 10 Mo max) *</label>
                  <input
                    type="file"
                    accept="application/pdf,image/jpeg,image/png"
                    onChange={(e) => setResFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-gray-300 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-[#c9951a] file:text-white file:text-xs file:font-semibold"
                  />
                </div>
              ) : (
                <div>
                  <label className={label}>{resType === 'VIDEO' ? 'Lien YouTube/Vimeo *' : 'URL *'}</label>
                  <input value={resExternalUrl} onChange={(e) => setResExternalUrl(e.target.value)} placeholder="https://..." className={input} />
                </div>
              )}
            </div>
            <div>
              <label className={label}>Description</label>
              <textarea
                value={resDescription}
                onChange={(e) => setResDescription(e.target.value)}
                rows={2}
                placeholder="Une phrase affichée dans le classeur (optionnel)"
                className={`${input} resize-none`}
              />
            </div>
            {resFormError && (
              <div className="p-2.5 bg-red-900/30 border border-red-500/40 rounded-lg text-xs text-red-300">{resFormError}</div>
            )}
            <button type="submit" disabled={resSubmitting} className={primaryBtn}>
              {resSubmitting ? 'Ajout en cours...' : 'Ajouter la ressource'}
            </button>
          </form>
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-white">Ressources ({visibleResources.length})</h3>
        <select aria-label="Filtrer par matière" value={filterSubjectId} onChange={(e) => setFilterSubjectId(e.target.value)} className={`${input} w-56`}>
          <option value="">Toutes les matières</option>
          {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {visibleResources.length === 0 ? (
        <div className="text-center py-16 bg-[#112240] rounded-2xl border border-[#2a4a6e]">
          <p className="text-gray-500">Aucune ressource pour le moment.</p>
        </div>
      ) : (
        <div className="bg-[#112240] rounded-2xl border border-[#2a4a6e] overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-[#2a4a6e]">
              <tr className="text-xs text-gray-400 uppercase tracking-wide">
                <th className="text-left px-4 py-3 font-semibold">Titre</th>
                <th className="text-left px-4 py-3 font-semibold">Matière</th>
                <th className="text-left px-4 py-3 font-semibold">Chapitre</th>
                <th className="text-left px-4 py-3 font-semibold">Pos.</th>
                <th className="text-left px-4 py-3 font-semibold">Type</th>
                <th className="text-left px-4 py-3 font-semibold">Niveau</th>
                <th className="text-left px-4 py-3 font-semibold" title="Consultations / téléchargements">Vues / Téléch.</th>
                {canEdit && <th className="text-right px-4 py-3 font-semibold">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e3a5f]">
              {visibleResources.map((r) => (
                <tr key={r.id} className="hover:bg-[#0d1f38] transition align-middle">
                  <td className="px-4 py-3 text-gray-300 max-w-xs">
                    <a
                      href={r.fileUrl || r.externalUrl || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#c9951a] hover:underline font-semibold"
                    >
                      {r.title}
                    </a>
                    <div className="font-mono text-[11px] text-gray-500 mt-0.5">{r.ref}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-300">
                    <span className="inline-block w-2.5 h-2.5 rounded-sm mr-2 align-middle" style={{ background: r.subject.color }} />
                    {r.subject.name}
                  </td>
                  <td className="px-4 py-3 text-gray-300 text-xs">
                    {canEdit ? (
                      <select
                        aria-label={`Chapitre de ${r.title}`}
                        value={r.chapter?.id || ''}
                        disabled={busyId === r.id}
                        onChange={(e) => patchResource(r, { chapterId: e.target.value || null })}
                        className={`${input} min-w-40`}
                      >
                        <option value="">Aucun</option>
                        {(chaptersBySubject[r.subject.id] || []).map((c) => <option key={c.id} value={c.id}>{chapterLabel(c)}</option>)}
                      </select>
                    ) : r.chapter ? chapterLabel(r.chapter) : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {canEdit ? (
                      <input
                        aria-label={`Position de ${r.title}`}
                        type="number"
                        defaultValue={r.position}
                        disabled={busyId === r.id}
                        onBlur={(e) => { if (Number(e.target.value) !== r.position) patchResource(r, { position: Number(e.target.value) || 0 }); }}
                        className={`${input} w-16`}
                      />
                    ) : r.position}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{TYPE_LABELS[r.type]}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{LEVEL_LABELS[r.level]}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{r.viewCount} / {r.downloadCount}</td>
                  {canEdit && (
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <button disabled={busyId === r.id} onClick={() => handleDeleteResource(r)} className={dangerBtn}>
                          Supprimer
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
