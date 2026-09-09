'use client';

import { useState } from 'react';
import SiteHeader from '@/components/SiteHeader';

type SubmitState = 'idle' | 'loading' | 'success' | 'error';

export default function SuggestionsPage() {
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitState('loading');
    setErrorMsg('');

    if (!message.trim()) {
      setErrorMsg('Le message est obligatoire.');
      setSubmitState('error');
      return;
    }

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, email: email || undefined }),
      });
      const result = await res.json();
      if (!res.ok) {
        setErrorMsg(result.error || "Erreur lors de l'envoi.");
        setSubmitState('error');
        return;
      }
      setSubmitState('success');
    } catch {
      setErrorMsg('Impossible de contacter le serveur. Réessaie.');
      setSubmitState('error');
    }
  };

  const inputClass = "w-full rounded-lg px-4 py-2.5 text-sm text-[#0d1b3e] bg-white border border-gray-300 placeholder-gray-400 focus:outline-none focus:border-[#c9951a] focus:ring-1 focus:ring-[#c9951a] transition";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";
  const cardClass = "bg-white rounded-3xl border border-[#eee6d3] shadow-sm p-6 space-y-4";

  if (submitState === 'success') {
    return (
      <div className="min-h-screen bg-white">
        <SiteHeader theme="light" />
        <div className="flex items-center justify-center px-4 py-16">
          <div className="max-w-md text-center">
            <div className="w-16 h-16 bg-[#c9951a]/10 border border-[#c9951a]/40 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl text-[#c9951a]">✓</span>
            </div>
            <h1 className="text-2xl font-bold text-[#0d1b3e] mb-3">Merci pour ton retour !</h1>
            <p className="text-gray-600 text-sm leading-relaxed">
              Ta suggestion a bien été transmise à l&apos;équipe EduConnect. Chaque retour compte pour améliorer la plateforme.
            </p>
            <button
              type="button"
              onClick={() => { setSubmitState('idle'); setMessage(''); setEmail(''); }}
              className="mt-8 w-full py-2.5 border border-gray-300 hover:border-[#c9951a]/60 text-gray-600 hover:text-[#0d1b3e] rounded-xl transition text-sm"
            >
              Envoyer une autre suggestion
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader theme="light" />

      <div className="max-w-xl mx-auto py-10 px-4">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="w-8 h-px bg-[#c9951a]" />
            <span className="text-xs font-medium text-[#8a6510] tracking-wide">Ton avis compte</span>
            <span className="w-8 h-px bg-[#c9951a]" />
          </div>
          <h1 className="font-[family-name:var(--font-cinzel)] text-3xl text-[#0d1b3e]">Suggestions &amp; retours</h1>
          <p className="text-gray-600 mt-2 text-sm">
            Une idée d&apos;amélioration, un bug remarqué, une fonctionnalité qui te manque ? Dis-le nous.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className={cardClass}>
            <div>
              <label className={labelClass}>Ton message *</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                required
                placeholder="Partage ton idée ou ton retour ici..."
                className={`${inputClass} resize-none`}
              />
            </div>
            <div>
              <label className={labelClass}>
                Email <span className="text-gray-500 font-normal normal-case">(optionnel, si tu veux qu'on te réponde)</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="exemple@email.com"
                className={inputClass}
              />
            </div>
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
            {submitState === 'loading' ? 'Envoi en cours...' : 'Envoyer ma suggestion'}
          </button>
        </form>
      </div>
    </div>
  );
}
