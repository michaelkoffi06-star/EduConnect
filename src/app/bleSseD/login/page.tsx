'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const [mode, setMode] = useState<'login' | 'recover'>('login');

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [recUsername, setRecUsername] = useState('');
  const [recoveryKey, setRecoveryKey] = useState('');
  const [recNewPassword, setRecNewPassword] = useState('');
  const [recError, setRecError] = useState('');
  const [recSuccess, setRecSuccess] = useState(false);
  const [recLoading, setRecLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/bleSseD/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Identifiant ou mot de passe incorrect.');
        return;
      }
      router.push('/bleSseD');
      router.refresh();
    } catch {
      setError('Impossible de contacter le serveur.');
    } finally {
      setLoading(false);
    }
  };

  const handleRecover = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecLoading(true);
    setRecError('');
    try {
      const res = await fetch('/api/bleSseD/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: recUsername,
          recoveryKey,
          newPassword: recNewPassword,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setRecError(data.error || 'Erreur lors de la réinitialisation.');
        return;
      }
      setRecSuccess(true);
    } catch {
      setRecError('Impossible de contacter le serveur.');
    } finally {
      setRecLoading(false);
    }
  };

  if (mode === 'recover') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a1628]">
        <div className="bg-[#112240] border border-[#2a4a6e] rounded-2xl p-8 w-full max-w-sm">
          <h1 className="text-xl font-bold text-white mb-2">Mot de passe oublié</h1>
          <p className="text-xs text-gray-400 mb-6">
            Réservé au compte super-admin, via la clé de récupération.
          </p>

          {recSuccess ? (
            <div>
              <div className="mb-4 p-3 bg-emerald-900/30 border border-emerald-500/40 rounded-lg text-sm text-emerald-300">
                Mot de passe réinitialisé avec succès.
              </div>
              <button
                onClick={() => {
                  setMode('login');
                  setRecSuccess(false);
                  setRecUsername('');
                  setRecoveryKey('');
                  setRecNewPassword('');
                }}
                className="w-full py-2.5 rounded-lg bg-[#c9951a] hover:bg-[#d4a820] text-[#0a1628] font-semibold transition"
              >
                Retour à la connexion
              </button>
            </div>
          ) : (
            <form onSubmit={handleRecover}>
              {recError && (
                <div className="mb-4 p-3 bg-red-900/30 border border-red-500/40 rounded-lg text-sm text-red-300">
                  {recError}
                </div>
              )}
              <input
                type="text"
                value={recUsername}
                onChange={(e) => setRecUsername(e.target.value)}
                placeholder="Identifiant"
                autoFocus
                className="w-full px-4 py-2.5 rounded-lg bg-[#0d1f38] border border-[#2a4a6e] text-white mb-3 focus:outline-none focus:border-[#c9951a]"
              />
              <input
                type="password"
                value={recoveryKey}
                onChange={(e) => setRecoveryKey(e.target.value)}
                placeholder="Clé de récupération"
                className="w-full px-4 py-2.5 rounded-lg bg-[#0d1f38] border border-[#2a4a6e] text-white mb-3 focus:outline-none focus:border-[#c9951a]"
              />
              <input
                type="password"
                value={recNewPassword}
                onChange={(e) => setRecNewPassword(e.target.value)}
                placeholder="Nouveau mot de passe (6 car. min.)"
                className="w-full px-4 py-2.5 rounded-lg bg-[#0d1f38] border border-[#2a4a6e] text-white mb-4 focus:outline-none focus:border-[#c9951a]"
              />
              <button
                type="submit"
                disabled={recLoading}
                className="w-full py-2.5 rounded-lg bg-[#c9951a] hover:bg-[#d4a820] disabled:opacity-50 text-[#0a1628] font-semibold transition"
              >
                {recLoading ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
              </button>
              <button
                type="button"
                onClick={() => setMode('login')}
                className="w-full mt-3 py-2 text-xs text-gray-400 hover:text-white transition"
              >
                Retour à la connexion
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a1628]">
      <form onSubmit={handleSubmit} className="bg-[#112240] border border-[#2a4a6e] rounded-2xl p-8 w-full max-w-sm">
        <h1 className="text-xl font-bold text-white mb-6">Connexion admin</h1>
        {error && (
          <div className="mb-4 p-3 bg-red-900/30 border border-red-500/40 rounded-lg text-sm text-red-300">
            {error}
          </div>
        )}
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Identifiant"
          autoFocus
          className="w-full px-4 py-2.5 rounded-lg bg-[#0d1f38] border border-[#2a4a6e] text-white mb-3 focus:outline-none focus:border-[#c9951a]"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mot de passe"
          className="w-full px-4 py-2.5 rounded-lg bg-[#0d1f38] border border-[#2a4a6e] text-white mb-4 focus:outline-none focus:border-[#c9951a]"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-lg bg-[#c9951a] hover:bg-[#d4a820] disabled:opacity-50 text-[#0a1628] font-semibold transition"
        >
          {loading ? 'Connexion...' : 'Se connecter'}
        </button>
        <button
          type="button"
          onClick={() => setMode('recover')}
          className="w-full mt-3 py-2 text-xs text-gray-400 hover:text-white transition"
        >
          Mot de passe oublié ?
        </button>
      </form>
    </div>
  );
}
