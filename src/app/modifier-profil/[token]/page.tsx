'use client';

import { useEffect, useState, use } from 'react';
import SiteHeader from '@/components/SiteHeader';
import FileDropzone from '@/components/FileDropzone';
import { getImageDimensionsFromFile } from '@/lib/image-utils';

interface Subject { id: string; name: string; }
interface InstructorData {
  firstName: string;
  lastName: string;
  whatsapp: string;
  bio: string;
  type: string;
  levels: string;
  status: string;
  photoUrl?: string | null;
  subjects: { subject: Subject }[];
}

type LoadState = 'loading' | 'ready' | 'not-found';
type SubmitState = 'idle' | 'loading' | 'success' | 'error';

const MAX_PHOTO_SIZE = 5 * 1024 * 1024;
const MAX_DOC_SIZE = 10 * 1024 * 1024;

async function uploadDirect(token: string, kind: 'photo' | 'cni' | 'cv', file: File) {
  const presignRes = await fetch(`/api/instructors/edit/${token}/files/presign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ kind, contentType: file.type }),
  });
  const presignData = await presignRes.json();
  if (!presignRes.ok) throw new Error(presignData.error || `Échec de la présignature (${kind}).`);

  const putRes = await fetch(presignData.uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });
  if (!putRes.ok) throw new Error(`Échec de l'envoi du fichier (${kind}).`);
}

export default function EditProfile({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);

  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [bio, setBio] = useState('');
  const [type, setType] = useState('ETUDIANT');
  const [levels, setLevels] = useState('ALL');
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState<string | null>(null);

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [cniFile, setCniFile] = useState<File | null>(null);
  const [cvFile, setCvFile] = useState<File | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [profileRes, subjectsRes] = await Promise.all([
          fetch(`/api/instructors/edit/${token}`),
          fetch('/api/subjects'),
        ]);

        if (!profileRes.ok) {
          setLoadState('not-found');
          return;
        }

        const profile: InstructorData = await profileRes.json();
        const subjectsList: Subject[] = await subjectsRes.json();

        setFirstName(profile.firstName);
        setLastName(profile.lastName);
        setWhatsapp(profile.whatsapp);
        setBio(profile.bio || '');
        setType(profile.type);
        setLevels(profile.levels);
        setCurrentPhotoUrl(profile.photoUrl || null);
        setSelectedSubjects(profile.subjects.map((s) => s.subject.id));
        setAllSubjects(Array.isArray(subjectsList) ? subjectsList : []);
        setLoadState('ready');
      } catch {
        setLoadState('not-found');
      }
    }
    load();
  }, [token]);

  const toggleSubject = (id: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitState('loading');
    setErrorMsg('');

    if (!bio.trim()) {
      setErrorMsg('La bio est obligatoire.');
      setSubmitState('error');
      return;
    }
    if (selectedSubjects.length === 0) {
      setErrorMsg('Sélectionne au moins une matière.');
      setSubmitState('error');
      return;
    }
    if (photoFile && photoFile.size > MAX_PHOTO_SIZE) {
      setErrorMsg('Photo trop lourde (5 Mo max).');
      setSubmitState('error');
      return;
    }
    if (cniFile && cniFile.size > MAX_DOC_SIZE) {
      setErrorMsg('CNI trop lourde (10 Mo max).');
      setSubmitState('error');
      return;
    }
    if (cvFile && cvFile.size > MAX_DOC_SIZE) {
      setErrorMsg('CV trop lourd (10 Mo max).');
      setSubmitState('error');
      return;
    }

    if (photoFile) {
      const dimensions = await getImageDimensionsFromFile(photoFile);
      if (!dimensions || dimensions.width < 800 || dimensions.height < 800) {
        setErrorMsg(`Photo trop petite${dimensions ? ` (${dimensions.width}x${dimensions.height}px)` : ''}, minimum 800x800px.`);
        setSubmitState('error');
        return;
      }
    }

    try {
      const res = await fetch(`/api/instructors/edit/${token}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, whatsapp, bio, type, levels, subjects: selectedSubjects }),
      });
      const result = await res.json();
      if (!res.ok) {
        setErrorMsg(result.error || 'Erreur lors de la mise à jour.');
        setSubmitState('error');
        return;
      }

      if (photoFile || cniFile || cvFile) {
        try {
          await Promise.all([
            photoFile ? uploadDirect(token, 'photo', photoFile) : Promise.resolve(),
            cniFile ? uploadDirect(token, 'cni', cniFile) : Promise.resolve(),
            cvFile ? uploadDirect(token, 'cv', cvFile) : Promise.resolve(),
          ]);

          const finalizeRes = await fetch(`/api/instructors/edit/${token}/files`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              photoType: photoFile ? photoFile.type : undefined,
              cniType: cniFile ? cniFile.type : undefined,
              cvType: cvFile ? cvFile.type : undefined,
            }),
          });
          const finalizeResult = await finalizeRes.json();
          if (!finalizeRes.ok) {
            setErrorMsg(finalizeResult.error || "Les infos ont été enregistrées, mais l'envoi des fichiers a échoué. Réessaie juste l'envoi des fichiers.");
            setSubmitState('error');
            return;
          }
        } catch (uploadError: any) {
          setErrorMsg(uploadError.message || "Les infos ont été enregistrées, mais l'envoi des fichiers a échoué. Réessaie juste l'envoi des fichiers.");
          setSubmitState('error');
          return;
        }
      }

      setSubmitState('success');
    } catch {
      setErrorMsg('Impossible de contacter le serveur. Réessaie.');
      setSubmitState('error');
    }
  };

  const inputClass = "w-full rounded-lg px-4 py-2.5 text-sm text-[#0d1b3e] bg-white border border-gray-300 placeholder-gray-400 focus:outline-none focus:border-[#c9951a] focus:ring-1 focus:ring-[#c9951a] transition";
  const selectClass = "w-full rounded-lg px-4 py-2.5 text-sm text-[#0d1b3e] bg-white border border-gray-300 focus:outline-none focus:border-[#c9951a] focus:ring-1 focus:ring-[#c9951a] transition";
  const cardClass = "bg-white rounded-3xl border border-[#eee6d3] shadow-sm p-6 space-y-4";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  if (loadState === 'loading') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#c9951a] border-t-transparent"></div>
      </div>
    );
  }

  if (loadState === 'not-found') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold text-[#0d1b3e] mb-3">Lien invalide</h1>
          <p className="text-gray-600 text-sm">
            Ce lien de modification n'existe pas ou n'est plus valide.
          </p>
        </div>
      </div>
    );
  }

  if (submitState === 'success') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 bg-[#c9951a]/10 border border-[#c9951a]/40 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl text-[#c9951a]">✓</span>
          </div>
          <h1 className="text-2xl font-bold text-[#0d1b3e] mb-3">Profil mis à jour !</h1>
          <p className="text-gray-600 text-sm leading-relaxed">
            Vos modifications ont été enregistrées. Votre profil repasse en{' '}
            <span className="font-semibold text-[#c9951a]">attente de validation</span> le temps que notre équipe le revérifie.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader theme="light" />

      <div className="max-w-2xl mx-auto py-10 px-4">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="w-8 h-px bg-[#c9951a]" />
            <span className="text-xs font-medium text-[#8a6510] tracking-wide">Espace instructeur</span>
            <span className="w-8 h-px bg-[#c9951a]" />
          </div>
          <h1 className="font-[family-name:var(--font-cinzel)] text-3xl text-[#0d1b3e]">Modifier mon profil</h1>
          <p className="text-gray-600 mt-2 text-sm">
            Toute modification repasse ton profil en attente de validation par l'équipe.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {currentPhotoUrl && (
            <div className="flex justify-center -mb-2">
              <img
                src={currentPhotoUrl}
                alt="Photo actuelle"
                className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md ring-1 ring-[#eee6d3]"
              />
            </div>
          )}

          <div className={cardClass}>
            <h2 className="text-xs font-semibold text-[#c9951a] uppercase tracking-widest">Identité</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Prénom *</label>
                <input value={firstName} onChange={(e) => setFirstName(e.target.value)} required className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Nom *</label>
                <input value={lastName} onChange={(e) => setLastName(e.target.value)} required className={inputClass} />
              </div>
            </div>
            <div>
              <label className={labelClass}>WhatsApp * <span className="text-gray-500 font-normal normal-case">(indicatif pays, sans le 0)</span></label>
              <input
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                required
                pattern="[0-9+ ]{8,15}"
                className={inputClass}
              />
            </div>
          </div>

          <div className={cardClass}>
            <h2 className="text-xs font-semibold text-[#c9951a] uppercase tracking-widest">Profil pédagogique</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Type d'instructeur *</label>
                <select value={type} onChange={(e) => setType(e.target.value)} required className={selectClass}>
                  <option value="ETUDIANT">Étudiant</option>
                  <option value="PROF_COLLEGE">Professeur (Collège)</option>
                  <option value="PROF_LYCEE">Professeur (Lycée)</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Niveaux enseignés *</label>
                <select value={levels} onChange={(e) => setLevels(e.target.value)} required className={selectClass}>
                  <option value="COLLEGE">Collège</option>
                  <option value="LYCEE">Lycée</option>
                  <option value="ALL">Collège &amp; Lycée</option>
                </select>
              </div>
            </div>
            <div>
              <label className={labelClass}>Bio / Présentation *</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                required
                className={`${inputClass} resize-none`}
              />
            </div>
          </div>

          <div className={cardClass}>
            <h2 className="text-xs font-semibold text-[#c9951a] uppercase tracking-widest">Matières enseignées *</h2>
            <div className="flex flex-wrap gap-2">
              {allSubjects.map((subject) => (
                <button
                  key={subject.id}
                  type="button"
                  onClick={() => toggleSubject(subject.id)}
                  className={
                    selectedSubjects.includes(subject.id)
                      ? "px-3 py-1.5 rounded-lg text-xs font-semibold border bg-[#c9951a] text-white border-[#c9951a] transition"
                      : "px-3 py-1.5 rounded-lg text-xs font-semibold border bg-transparent text-gray-600 border-gray-300 hover:border-[#c9951a]/60 hover:text-[#0d1b3e] transition"
                  }
                >
                  {subject.name}
                </button>
              ))}
            </div>
          </div>

          <div className={cardClass}>
            <h2 className="text-xs font-semibold text-[#c9951a] uppercase tracking-widest">Fichiers</h2>
            <p className="text-xs text-gray-500 -mt-2">
              Laisse un champ vide pour garder le fichier actuel. Renseigne-le uniquement si tu veux le remplacer.
            </p>

            <FileDropzone
              label="Photo de profil (JPEG/PNG/WebP, min. 800×800px, 5 Mo max)"
              hint="Laisse vide pour garder la photo actuelle"
              accept="image/jpeg,image/png,image/webp"
              file={photoFile}
              onChange={setPhotoFile}
              showImagePreview
              emptyLabel="Cliquez ou glissez pour remplacer la photo"
            />

            <FileDropzone
              label="CNI (JPEG/PNG/PDF, 10 Mo max)"
              hint="Laisse vide pour garder le fichier actuel"
              accept="image/jpeg,image/png,application/pdf"
              file={cniFile}
              onChange={setCniFile}
              emptyLabel="Cliquez ou glissez pour remplacer la CNI"
            />

            <FileDropzone
              label="CV (JPEG/PNG/PDF, 10 Mo max)"
              hint="Laisse vide pour garder le fichier actuel"
              accept="image/jpeg,image/png,application/pdf"
              file={cvFile}
              onChange={setCvFile}
              emptyLabel="Cliquez ou glissez pour remplacer le CV"
            />
          </div>

          {submitState === 'error' && errorMsg && (
            <div className="bg-red-50 border border-red-300 rounded-lg px-4 py-3 text-sm text-red-700">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={submitState === 'loading'}
            className="w-full py-3 bg-gradient-to-r from-[#c9951a] to-[#d4a820] hover:brightness-105 disabled:opacity-60 text-white font-bold rounded-xl transition text-sm tracking-wide"
          >
            {submitState === 'loading' ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </button>
        </form>
      </div>
    </div>
  );
}
