import SiteHeader from '@/components/SiteHeader';

export const metadata = {
  title: 'EduConnect - Confidentialité et protection des données',
};

export default function ConfidentialitePage() {
  const sectionClass = "bg-white rounded-3xl border border-[#eee6d3] shadow-sm p-6 space-y-3";
  const titleClass = "font-[family-name:var(--font-cinzel)] text-lg text-[#0d1b3e] mb-2";
  const textClass = "text-sm text-gray-600 leading-relaxed";

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader theme="light" />

      <div className="max-w-2xl mx-auto py-10 px-4">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="w-8 h-px bg-[#c9951a]" />
            <span className="text-xs font-medium text-[#8a6510] tracking-wide">Vos données, notre engagement</span>
            <span className="w-8 h-px bg-[#c9951a]" />
          </div>
          <h1 className="font-[family-name:var(--font-cinzel)] text-3xl text-[#0d1b3e]">Confidentialité &amp; protection des données</h1>
          <p className="text-gray-600 mt-2 text-sm">
            Dernière mise à jour : septembre 2026
          </p>
        </div>

        <div className="space-y-6">

          <div className={sectionClass}>
            <h2 className={titleClass}>Quelles données nous collectons</h2>
            <p className={textClass}>
              Pour les parents et élèves : votre email et le message envoyé lors d'une demande de mise en relation.
            </p>
            <p className={textClass}>
              Pour les instructeurs : prénom, nom, email, numéro WhatsApp, une biographie, une photo de profil,
              ainsi qu'une copie de votre carte nationale d'identité (CNI) et votre CV.
            </p>
          </div>

          <div className={sectionClass}>
            <h2 className={titleClass}>Pourquoi nous demandons la CNI et le CV</h2>
            <p className={textClass}>
              Ces documents servent uniquement à vérifier l'identité et le sérieux des instructeurs avant validation
              de leur profil par notre équipe. C'est une mesure de confiance envers les familles qui utilisent la plateforme.
            </p>
          </div>

          <div className={sectionClass}>
            <h2 className={titleClass}>Comment vos données sont stockées</h2>
            <p className={textClass}>
              Votre photo de profil est publique, visible par toute personne consultant votre fiche sur EduConnect.
            </p>
            <p className={textClass}>
              Votre CNI et votre CV sont stockés dans un espace de stockage <strong>séparé et privé</strong> (Cloudflare R2),
              jamais accessible publiquement. Seule l'équipe EduConnect, via un accès protégé par mot de passe, peut les consulter.
            </p>
          </div>

          <div className={sectionClass}>
            <h2 className={titleClass}>Qui a accès à vos données</h2>
            <p className={textClass}>
              Seule l'équipe EduConnect a accès à l'ensemble de vos données, dans le cadre strict de la validation
              et de la gestion des profils. Nous ne vendons ni ne partageons vos données avec des tiers à des fins commerciales.
            </p>
            <p className={textClass}>
              Des prestataires techniques (hébergement, stockage, envoi d'emails) traitent certaines données uniquement
              pour faire fonctionner la plateforme, jamais pour leur propre usage.
            </p>
          </div>

          <div className={sectionClass}>
            <h2 className={titleClass}>Combien de temps nous conservons vos données</h2>
            <p className={textClass}>
              Vos données sont conservées tant que votre profil reste actif sur la plateforme. Vous pouvez demander
              leur suppression à tout moment (voir ci-dessous).
            </p>
          </div>

          <div className={sectionClass}>
            <h2 className={titleClass}>Vos droits</h2>
            <p className={textClass}>
              Vous pouvez à tout moment demander l'accès, la correction, ou la suppression de vos données en nous
              contactant à <a href="mailto:jk4177234@gmail.com" className="text-[#c9951a] hover:underline">jk4177234@gmail.com</a>.
              Les instructeurs peuvent aussi modifier eux-mêmes leurs informations via leur lien personnel de profil.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
