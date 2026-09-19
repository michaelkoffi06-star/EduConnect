'use client';

import { useState } from 'react';
import SiteHeader from '@/components/SiteHeader';

interface PaymentOption {
  name: string;
  number: string;
  colorClass: string;
}

const PAYMENT_OPTIONS: PaymentOption[] = [
  { name: 'Orange Money', number: '07 58 52 93 23', colorClass: 'bg-orange-50 border-orange-200 text-orange-700' },
  { name: 'MTN Money', number: '05 75 53 52 97', colorClass: 'bg-yellow-50 border-yellow-300 text-yellow-800' },
  { name: 'Wave', number: '07 78 11 49 38', colorClass: 'bg-sky-50 border-sky-200 text-sky-700' },
  { name: 'Moov Money', number: '01 53 05 66 22', colorClass: 'bg-blue-50 border-blue-200 text-blue-700' },
];

export default function SoutenirPage() {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = async (number: string, index: number) => {
    try {
      await navigator.clipboard.writeText(number.replace(/\s/g, ''));
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      setCopiedIndex(null);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader theme="light" />

      <div className="max-w-xl mx-auto py-10 px-4">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="w-8 h-px bg-[#c9951a]" />
            <span className="text-xs font-medium text-[#8a6510] tracking-wide">Soutenir le projet</span>
            <span className="w-8 h-px bg-[#c9951a]" />
          </div>
          <h1 className="font-[family-name:var(--font-cinzel)] text-3xl text-[#0d1b3e]">Un petit geste, un grand merci</h1>
          <p className="text-gray-600 mt-2 text-sm max-w-md mx-auto">
            EduConnect est développé avec soin, gratuitement, pour connecter les familles aux bons instructeurs.
            Si la plateforme t&apos;a été utile, un pourboire via Mobile Money est toujours apprécié — mais jamais obligatoire.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {PAYMENT_OPTIONS.map((option, i) => (
            <div key={option.name} className={`rounded-2xl border p-5 ${option.colorClass}`}>
              <h3 className="font-semibold text-sm mb-1">{option.name}</h3>
              <p className="text-lg font-bold tracking-wide mb-3">{option.number}</p>
              <button
                type="button"
                onClick={() => handleCopy(option.number, i)}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/70 hover:bg-white border border-current transition"
              >
                {copiedIndex === i ? '✓ Copié !' : 'Copier le numéro'}
              </button>
            </div>
          ))}
        </div>

        <p className="text-xs text-gray-400 text-center mt-8">
          Merci de vérifier le nom du bénéficiaire avant d&apos;envoyer, comme pour tout transfert Mobile Money.
        </p>
      </div>
    </div>
  );
}
