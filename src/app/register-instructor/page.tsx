'use client';

import { useEffect, useState } from 'react';
import SiteHeader from '@/components/SiteHeader';
import FileDropzone from '@/components/FileDropzone';

interface Subject {
  id: string;
  name: string;
}

type SubmitState = 'idle' | 'loading' | 'success' | 'error';

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
    setSubmitState('loading');
    setErrorMsg('');

    if (selectedSubjects.length === 0) {
      setErrorMsg('Veuillez selectionner au moins une matiere.');
      setSubmitState('error');
      return;
    }

    if (!photoFile || !cniFile || !cvFile) {
      setErrorMsg('Photo, CNI et CV sont tous les trois obligatoires.');
      setSubmitState('error');
      return;
    }

    const formValues = new FormData(e.currentTarget);
    const bioValue = formValues.get('bio') as string;
    if (!bioValue || !bioValue.trim()) {
      setErrorMsg('La bio est obligatoire.');
      setSubmitState('error');
      return;
    }

    const payload = new FormData();
    payload.append('firstName', formValues.get('firstName') as string);
    payload.append('lastName', formValues.get('lastName') as string);
    payload.append('email', formValues.get('email') as string);
    payload.append('whatsapp', formValues.get('whatsapp') as string);
    payload.append('bio', bioValue);
    payload.append('type', formValues.get('type') as string);
    payload.append('levels', formValues.get('levels') as string);
    payload.append('subjects', JSON.stringify(selectedSubjects));
    payload.append('photo', photoFile);
    payload.append('cni', cniFile);
    payload.append('cv', cvFile);

    try {
      const res = await fetch('/api/register-instructor', {
        method: 'POST',
        body: payload,
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
      setErrorMsg('Impossible de contacter le serveur. Reessaie.');
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
            <h1 className="text-2xl font-bold text-[#0d1b3e] mb-3">Candidature envoyee !</h1>
            <p className="text-gray-600 text-sm leading-relaxed">
              Votre profil est <span className="font-semibold text-[#c9951a]">en attente de validation</span> par notre equipe. Vous serez contacte par WhatsApp sous 48h.
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
                    {copied ? '✓ Copie !' : 'Copier'}
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
                Retour a l'accueil
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
            <span className="text-xs font-medium text-[#8a6510] tracking-wide">Rejoindre le reseau</span>
            <span className="w-8 h-px bg-[#c9951a]" />
          </div>
          <h1 className="font-[family-name:var(--font-cinzel)] text-3xl text-[#0d1b3e]">Devenir Instructeur</h1>
          <p className="text-gray-600 mt-2 text-sm">
            Rejoignez notre réseau d'instructeurs. Votre profil sera examiné sous 48h.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          <div className={cardClass}>
            <h2 className="text-xs font-semibold text-[#c9951a] uppercase tracking-widest">Identite</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Prenom *</label>
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
                  title="Indicatif pays + numero, sans le 0 initial (ex : 225 pour la Cote d'Ivoire)"
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          <div className={cardClass}>
            <h2 className="text-xs font-semibold text-[#c9951a] uppercase tracking-widest">Profil pedagogique</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Type d'instructeur *</label>
                <select name="type" required className={selectClass}>
                  <option value="ETUDIANT">Etudiant</option>
                  <option value="PROF_COLLEGE">Professeur (College)</option>
                  <option value="PROF_LYCEE">Professeur (Lycee)</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Niveaux enseignes *</label>
                <select name="levels" required className={selectClass}>
                  <option value="COLLEGE">College</option>
                  <option value="LYCEE">Lycee</option>
                  <option value="ALL">College &amp; Lycee</option>
                </select>
              </div>
            </div>
            <div>
              <label className={labelClass}>Bio / Presentation *</label>
              <textarea
                name="bio"
                rows={4}
                required
                placeholder="Parlez de votre experience, votre approche pedagogique..."
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
