export const metadata = {
  title: "EduConnect - Bientôt disponible",
};

export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <img src="/marketing/images/logo.png" alt="EduConnect" className="w-16 h-16 rounded-xl object-cover mx-auto mb-8" />

        <div className="flex items-center justify-center gap-2 mb-5">
          <span className="w-8 h-px bg-[#c9951a]" />
          <span className="text-xs font-medium text-[#8a6510] tracking-wide">Ouverture prochaine</span>
          <span className="w-8 h-px bg-[#c9951a]" />
        </div>

        <h1 className="font-[family-name:var(--font-cinzel)] text-3xl text-[#0d1b3e] mb-4">
          Edu<span className="text-[#c9951a]">Connect</span> arrive bientôt
        </h1>
        <p className="text-gray-600 text-sm leading-relaxed mb-8">
          Nous mettons la dernière touche à la plateforme. Revenez très vite pour trouver le bon tuteur pour votre enfant.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          
            <a
            href="/suggestions"
            className="px-5 py-2.5 rounded-full bg-gradient-to-r from-[#c9951a] to-[#d4a820] text-white text-sm font-semibold hover:shadow-lg hover:-translate-y-0.5 transition-all"
          >
            Laisser une suggestion
          </a>
          
            <a
            href="/soutenir"
            className="px-5 py-2.5 rounded-full border border-[#0d1b3e]/15 text-[#0d1b3e] text-sm font-semibold hover:bg-[#0d1b3e]/5 hover:-translate-y-0.5 transition-all"
          >
            Soutenir le projet
          </a>
        </div>
      </div>
    </div>
  );
}
