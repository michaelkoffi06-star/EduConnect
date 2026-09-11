'use client';

import { useEffect, useState } from 'react';
import SiteHeader from '@/components/SiteHeader';
import FileDropzone from '@/components/FileDropzone';
import { getImageDimensionsFromFile } from '@/lib/image-utils';

interface Subject {
  id: string;
  name: string;
}

type SubmitState = 'idle' | 'loading' | 'success' | 'error';

const MIN_PHOTO_DIMENSION = 800;
const MAX_PHOTO_SIZE = 5 * 1024 * 1024;
const MAX_DOC_SIZE = 10 * 1024 * 1024;

async function uploadDirect(instructorId: string, kind: 'photo' | 'cni' | 'cv', file: File) {
  const presignRes = await fetch('/api/register-instructor/presign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ kind, contentType: file.type, instructorId }),
  });
  const presignData = await presignRes.json();
  if (!presignRes.ok) throw new Error(presignData.error || `Échec de la présignature (${kind}).`);

  const putRes = await fetch(presignData.uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });
  if (!putRes.ok) throw new Error(`Échec de l'envoi du fichier (${kind}). Vérifie ta connexion et réessaie.`);
}

export default function RegisterInstructor() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [cniFile, setCniFile] = useState<File | null>(null);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [editLink, setEditLink] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/api/subjects')
      .then((res) => res.json())
      .then((data) => setSubjects(Array.isArray(data) ? data : []))
      .catch(() => setSubjects([]));
  }, []);

  const toggleSubject = (id: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget; // capturé avant tout `await` : e.currentTarget devient null après
    setSubmitState('loading');
    setErrorMsg('');

    if (selectedSubjects.length === 0) {
      setErrorMsg('Veuillez sélectionner au moins une matière.');
      setSubmitState('error');
      return;
    }
    if (!photoFile || !cniFile || !cvFile) {
      setErrorMsg('Photo, CNI et CV sont tous les trois obligatoires.');
      setSubmitState('error');
      return;
    }
    if (photoFile.size > MAX_PHOTO_SIZE) {
      setErrorMsg('Photo trop lourde (5 Mo max).');
      setSubmitState('error');
      return;
    }
    if (cniFile.size > MAX_DOC_SIZE || cvFile.size > MAX_DOC_SIZE) {
      setErrorMsg('CNI ou CV trop lourd (10 Mo max chacun).');
      setSubmitState('error');
      return;
    }

    const dimensions = await getImageDimensionsFromFile(photoFile);
    if (!dimensions || dimensions.width < MIN_PHOTO_DIMENSION || dimensions.height < MIN_PHOTO_DIMENSION) {
      setErrorMsg(
        `Photo trop petite${dimensions ? ` (${dimensions.width}×${dimensions.height}px)` : ''}, minimum ${MIN_PHOTO_DIMENSION}×${MIN_PHOTO_DIMENSION}px requis.`
      );
      setSubmitState('error');
      return;
    }

    const formValues = new FormData(form);
    const bioValue = formValues.get('bio') as string;
    if (!bioValue || !bioValue.trim()) {
      setErrorMsg('La bio est obligatoire.');
      setSubmitState('error');
      return;
    }

    const instructorId = crypto.randomUUID();

    try {
      await Promise.all([
        uploadDirect(instructorId, 'photo', photoFile),
        uploadDirect(instructorId, 'cni', cniFile),
        uploadDirect(instructorId, 'cv', cvFile),
      ]);
    } catch (uploadError: any) {
      setErrorMsg(uploadError.message || "Échec de l'envoi des fichiers. Vérifie ta connexion et réessaie.");
      setSubmitState('error');
      return;
    }

    try {
      const res = await fetch('/api/register-instructor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instructorId,
          firstName: formValues.get('firstName'),
          lastName: formValues.get('lastName'),
          email: formValues.get('email'),
          whatsapp: formValues.get('whatsapp'),
          bio: bioValue,
          type: formValues.get('type'),
          levels: formValues.get('levels'),
          subjects: selectedSubjects,
          photoType: photoFile.type,
          cniType: cniFile.type,
          cvType: cvFile.type,
        }),
      });
      const result = await res.json();
      if (!res.ok) {
        setErrorMsg(result.error || "Erreur lors de l'inscription.");
        setSubmitState('error');
        return;
      }
      setEditLink(result.editLink || '');
      setSubmitState('success');
    } catch {
      setErrorMsg('Impossible de contacter le serveur. Réessaie.');
      setSubmitState('error');
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(editLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  const inputClass = "w-full rounded-lg px-4 py-2.5 text-sm text-[#0d1b3e] bg-white border border-gray-300 placeholder-gray-400 focus:outline-none focus:border-[#c9951a] focus:ring-1 focus:ring-[#c9951a] transition";
  const selectClass = "w-full rounded-lg px-4 py-2.5 text-sm text-[#0d1b3e] bg-white border border-gray-300 focus:outline-none focus:border-[#c9951a] focus:ring-1 focus:ring-[#c9951a] transition";
  const cardClass = "bg-white rounded-3xl border border-[#eee6d3] shadow-sm p-6 space-y-4";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  if (submitState === 'success') {
    return (
      <div className="min-h-screen bg-white">
        <SiteHeader active="register" />
        <div className="flex items-center justify-center px-4 py-16">
          <div className="max-w-md text-center">
            <div className="w-16 h-16 bg-[#c9951a]/10 border border-[#c9951a]/40 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl text-[#c9951a]">✓</span>
            </div>
            <h1 className="text-2xl font-bold text-[#0d1b3e] mb-3">Candidature envoyée !</h1>
            <p className="text-gray-600 text-sm leading-relaxed">
              Votre profil est <span className="font-semibold text-[#c9951a]">en attente de validation</span> par notre équipe. Vous serez contacté par WhatsApp sous 48h.
            </p>
            {editLink && (
              <div className="mt-6 bg-[#faf8f2] border border-[#eee6d3] rounded-2xl p-4 text-left">
                <p className="text-xs text-gray-500 mb-2">
                  Gardez ce lien pour modifier votre profil plus tard :
                </p>
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={editLink}
                    className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs text-[#8a6510]"
                    onFocus={(e) => e.target.select()}
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className={`px-3 py-2 text-xs font-semibold rounded-lg transition shrink-0 ${
                      copied ? 'bg-emerald-500 text-white' : 'bg-[#c9951a] hover:bg-[#d4a820] text-white'
                    }`}
                  >
                    {copied ? '✓ Copié !' : 'Copier'}
                  </button>
                </div>

                
                  <a
                  href={editLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block mt-2 text-center text-xs text-[#c9951a] hover:underline"
                >
                  Ouvrir le lien dans un nouvel onglet
                </a>
              </div>
            )}

            <div className="mt-8 flex flex-col gap-2">
              
                <a
                href="/"
                className="w-full inline-block py-2.5 bg-gradient-to-r from-[#c9951a] to-[#d4a820] hover:brightness-105 text-white font-bold rounded-xl transition text-sm text-center"
              >
                Retour à l'accueil
              </a>
              <button
                type="button"
                onClick={() => {
                  setSubmitState('idle');
                  setEditLink('');
                  setPhotoFile(null);
                  setCniFile(null);
                  setCvFile(null);
                  setSelectedSubjects([]);
                }}
                className="w-full py-2.5 border border-gray-300 hover:border-[#c9951a]/60 text-gray-600 hover:text-[#0d1b3e] rounded-xl transition text-sm"
              >
                Nouvelle inscription
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader active="register" />

      <div className="max-w-2xl mx-auto py-10 px-4">

        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="w-8 h-px bg-[#c9951a]" />
            <span className="text-xs font-medium text-[#8a6510] tracking-wide">Rejoindre le réseau</span>
            <span className="w-8 h-px bg-[#c9951a]" />
          </div>
          <h1 className="font-[family-name:var(--font-cinzel)] text-3xl text-[#0d1b3e]">Devenir Instructeur</h1>
          <p className="text-gray-600 mt-2 text-sm">
            Rejoignez notre réseau d'instructeurs. Votre profil sera examiné sous 48h.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          <div className={cardClass}>
            <h2 className="text-xs font-semibold text-[#c9951a] uppercase tracking-widest">Identité</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Prénom *</label>
                <input name="firstName" required placeholder="Marie" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Nom *</label>
                <input name="lastName" required placeholder="Kouassi" className={inputClass} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Email *</label>
                <input name="email" type="email" required placeholder="marie@example.com" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>
                  WhatsApp * <span className="text-gray-500 font-normal normal-case">(indicatif pays, sans le 0)</span>
                </label>
                <input
                  name="whatsapp"
                  required
                  placeholder="ex : 2250708091011"
                  pattern="[0-9+ ]{8,15}"
                  title="Indicatif pays + numéro, sans le 0 initial (ex : 225 pour la Côte d'Ivoire)"
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          <div className={cardClass}>
            <h2 className="text-xs font-semibold text-[#c9951a] uppercase tracking-widest">Profil pédagogique</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Type d'instructeur *</label>
                <select name="type" required className={selectClass}>
                  <option value="ETUDIANT">Étudiant</option>
                  <option value="PROF_COLLEGE">Professeur (Collège)</option>
                  <option value="PROF_LYCEE">Professeur (Lycée)</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Niveaux enseignés *</label>
                <select name="levels" required className={selectClass}>
                  <option value="COLLEGE">Collège</option>
                  <option value="LYCEE">Lycée</option>
                  <option value="ALL">Collège &amp; Lycée</option>
                </select>
              </div>
            </div>
            <div>
              <label className={labelClass}>Bio / Présentation *</label>
              <textarea
                name="bio"
                rows={4}
                required
                placeholder="Parlez de votre expérience, votre approche pédagogique..."
                className={`${inputClass} resize-none`}
              />
            </div>
          </div>

          <div className={cardClass}>
            <h2 className="text-xs font-semibold text-[#c9951a] uppercase tracking-widest">Matières enseignées *</h2>
            <div className="flex flex-wrap gap-2">
              {subjects.map((subject) => (
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
            <h2 className="text-xs font-semibold text-[#c9951a] uppercase tracking-widest">Documents *</h2>
            <p className="text-xs text-gray-500 -mt-2">
              Ta photo sera visible publiquement sur ton profil. La CNI et le CV servent uniquement
              de justificatifs pour la validation de ton compte, ils ne sont jamais rendus publics.
            </p>

            <FileDropzone
              label="Photo de profil * (JPEG/PNG/WebP, 5 Mo max, 800x800px min)"
              hint="JPEG, PNG ou WebP — 800×800px minimum"
              accept="image/jpeg,image/png,image/webp"
              file={photoFile}
              onChange={setPhotoFile}
              showImagePreview
            />

            <FileDropzone
              label="CNI (recto) * (JPEG/PNG/PDF, 10 Mo max)"
              hint="JPEG, PNG ou PDF — 10 Mo max"
              accept="image/jpeg,image/png,application/pdf"
              file={cniFile}
              onChange={setCniFile}
            />

            <FileDropzone
              label="CV * (JPEG/PNG/PDF, 10 Mo max)"
              hint="JPEG, PNG ou PDF — 10 Mo max"
              accept="image/jpeg,image/png,application/pdf"
              file={cvFile}
              onChange={setCvFile}
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
            {submitState === 'loading' ? 'Envoi en cours...' : 'Envoyer ma candidature'}
          </button>

          <p className="text-xs text-center text-gray-500">
            En soumettant ce formulaire, vous acceptez d'être contacté via WhatsApp pour la suite de votre candidature.
          </p>
        </form>
      </div>
    </div>
  );
}
