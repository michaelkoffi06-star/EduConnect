'use client';

import { useEffect, useState } from 'react';
import SiteHeader from '@/components/SiteHeader';

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
      setErrorMsg('Veuillez sélectionner au moins une matière.');
      setSubmitState('error');
      return;
    }

    const formData = new FormData(e.currentTarget);
    const data = {
      firstName: formData.get('firstName'),
      lastName:  formData.get('lastName'),
      email:     formData.get('email'),
      whatsapp:  formData.get('whatsapp'),
      bio:       formData.get('bio'),
      type:      formData.get('type'),
      levels:    formData.get('levels'),
      subjects:  selectedSubjects,
    };

    try {
      const res = await fetch('/api/register-instructor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) {
        setErrorMsg(result.error || "Erreur lors de l'inscription.");
        setSubmitState('error');
        return;
      }
      setSubmitState('success');
    } catch {
      setErrorMsg('Impossible de contacter le serveur. Réessaie.');
      setSubmitState('error');
    }
  };

  const inputClass = "w-full rounded-lg px-4 py-2.5 text-sm text-white bg-[#112240] border border-[#2a4a6e] placeholder-gray-400 focus:outline-none focus:border-[#c9951a] focus:ring-1 focus:ring-[#c9951a] transition";
  const selectClass = "w-full rounded-lg px-4 py-2.5 text-sm text-white bg-[#112240] border border-[#2a4a6e] focus:outline-none focus:border-[#c9951a] focus:ring-1 focus:ring-[#c9951a] transition";
  const cardClass = "bg-[#112240] rounded-2xl border border-[#2a4a6e] p-6 space-y-4";
  const labelClass = "block text-sm font-medium text-gray-300 mb-1";

  if (submitState === 'success') {
    return (
      <div className="min-h-screen bg-[#0a1628] flex items-center justify-center p-6">
        <div className="bg-[#112240] rounded-2xl border border-[#c9951a]/40 p-10 max-w-md w-full text-center">
          <div className="text-5xl mb-4">🎓</div>
          <h2 className="text-2xl font-bold text-white mb-2">Candidature envoyée !</h2>
          <p className="text-gray-400 mb-6">
            Votre profil est <span className="font-semibold text-[#c9951a]">en attente de validation</span> par notre équipe. Vous serez contacté par WhatsApp sous 48h.
          </p>
          <button
            onClick={() => { setSubmitState('idle'); setSelectedSubjects([]); }}
            className="text-sm text-[#c9951a] hover:underline"
          >
            Inscrire un autre instructeur
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a1628]">
      <SiteHeader active="register" />

      <div className="max-w-2xl mx-auto py-10 px-4">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-[family-name:var(--font-cinzel)] text-3xl text-white">Devenir Instructeur</h1>
          <p className="text-gray-400 mt-2 text-sm">
            Rejoignez notre réseau d'instructeurs. Votre profil sera examiné sous 48h.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Identité */}
          <div className={cardClass}>
            <h2 className="text-xs font-semibold text-[#c9951a] uppercase tracking-widest">Identité</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Prénom *</label>
                <input name="firstName" required placeholder="ex : Marie" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Nom *</label>
                <input name="lastName" required placeholder="ex : Dupont" className={inputClass} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Email *</label>
                <input name="email" type="email" required placeholder="marie@example.com" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>WhatsApp *</label>
                <input
                  name="whatsapp"
                  required
                  placeholder="ex : 2250708091011"
                  pattern="[0-9+ ]{8,15}"
                  title="Indicatif pays + numéro, sans le 0 initial (ex : 225 pour la Côte d'Ivoire)"
                  className={inputClass}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Format international complet (indicatif pays + numéro, sans le 0 initial).
                </p>
              </div>
            </div>
          </div>

          {/* Profil pédagogique */}
          <div className={cardClass}>
            <h2 className="text-xs font-semibold text-[#c9951a] uppercase tracking-widest">Profil pédagogique</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Vous êtes *</label>
                <select name="type" required defaultValue="ETUDIANT" className={selectClass}>
                  <option value="ETUDIANT">Étudiant</option>
                  <option value="PROF_COLLEGE">Professeur de Collège</option>
                  <option value="PROF_LYCEE">Professeur de Lycée</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Niveaux enseignés *</label>
                <select name="levels" required defaultValue="ALL" className={selectClass}>
                  <option value="ALL">Collège + Lycée</option>
                  <option value="COLLEGE">Collège uniquement</option>
                  <option value="LYCEE">Lycée uniquement</option>
                </select>
              </div>
            </div>
            <div>
              <label className={labelClass}>Biographie</label>
              <textarea
                name="bio"
                rows={3}
                placeholder="Décrivez votre expérience, votre méthode d'enseignement..."
                className={`${inputClass} resize-none`}
              />
            </div>
          </div>

          {/* Matières */}
          <div className={cardClass}>
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold text-[#c9951a] uppercase tracking-widest">Matières enseignées *</h2>
              {selectedSubjects.length > 0 && (
                <span className="text-xs font-semibold bg-[#c9951a]/20 text-[#c9951a] px-2 py-0.5 rounded-full border border-[#c9951a]/40">
                  {selectedSubjects.length} sélectionnée{selectedSubjects.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
            {subjects.length === 0 ? (
              <p className="text-sm text-gray-500">Chargement des matières...</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {subjects.map((sub) => {
                  const checked = selectedSubjects.includes(sub.id);
                  return (
                    <button
                      type="button"
                      key={sub.id}
                      onClick={() => toggleSubject(sub.id)}
                      className={`px-3 py-2 rounded-lg border text-sm font-medium transition ${
                        checked
                          ? 'bg-[#c9951a] text-[#0a1628] border-[#c9951a] font-semibold'
                          : 'bg-transparent text-gray-300 border-[#2a4a6e] hover:border-[#c9951a]/60 hover:text-white'
                      }`}
                    >
                      {sub.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Erreur */}
          {submitState === 'error' && errorMsg && (
            <div className="p-3 bg-red-900/30 border border-red-500/40 rounded-lg text-sm text-red-300">
              {errorMsg}
            </div>
          )}

          {/* Bouton submit */}
          <button
            type="submit"
            disabled={submitState === 'loading'}
            className="w-full py-3 bg-[#c9951a] hover:bg-[#d4a820] disabled:opacity-60 text-[#0a1628] font-bold rounded-xl transition text-sm tracking-wide"
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
