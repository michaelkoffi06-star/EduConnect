import Link from "next/link";
import { CONTACT_EMAIL, CONTACT_PHONES, CONTACT_VCARD_PATH, GMAIL_COMPOSE_URL } from "@/lib/contact";
import { IconCall, IconMail } from "./icons";

// Section 7 de l'accueil (§7tervicies) : pied de page. Mêmes coordonnées qu'avant la refonte
// (src/lib/contact.ts), mêmes réseaux ; l'ancre #contact est conservée (menu « Contact »).

const FACEBOOK_URL = "https://www.facebook.com/profile.php?id=100090481355986";
const WHATSAPP_CHANNEL_URL = "https://whatsapp.com/channel/0029Vb8wlEbLtOjF6QiMXV0x";

const EXPLORE_LINKS = [
  { href: "/trouver-un-tuteur", label: "Trouver un tuteur" },
  { href: "/bibliotheque", label: "Bibliothèque" },
  { href: "/bibliotheque/corriges", label: "Corrigés" },
  { href: "/forum", label: "Forum" },
  { href: "/anglais-technique", label: "Anglais technique" },
  { href: "/register-instructor", label: "Devenir instructeur" },
];

const ACCOUNT_LINKS = [
  { href: "/inscription", label: "Créer un compte" },
  { href: "/connexion", label: "Se connecter" },
  { href: "/espace-instructeur", label: "Espace instructeur" },
];

const PROJECT_LINKS = [
  { href: "/suggestions", label: "Suggestions" },
  { href: "/soutenir", label: "Soutenir le projet" },
  { href: "/confidentialite", label: "Confidentialité" },
];

const LINK = "transition hover:text-gold-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-300";

function Heading({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <h2 className={`mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-gold-300 ${className}`}>{children}</h2>;
}

export default function HomeFooter() {
  const year = new Date().getFullYear();

  return (
    <footer id="contact" className="scroll-mt-20 bg-navy-950 text-white/75">
      <div className="mx-auto grid max-w-6xl gap-12 px-5 py-16 sm:grid-cols-2 sm:px-6 lg:grid-cols-[1.3fr_1fr_1.3fr_1fr]">
        <div>
          <Link href="/" className="inline-flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/marketing/images/logo.png" alt="" className="h-12 w-12 rounded-xl object-cover ring-1 ring-white/10" />
            <span className="font-[family-name:var(--font-cinzel)] text-xl text-white">
              Edu<span className="text-gold-300">Connect</span> CI
            </span>
          </Link>
          <p className="mt-4 text-sm font-semibold text-gold-300" lang="en">
            Innovation for Academic Success
          </p>
          <p className="mt-2 max-w-xs text-sm leading-relaxed">
            Des instructeurs vérifiés, des ressources pédagogiques et l&apos;anglais technique pour l&apos;informatique.
          </p>
        </div>

        <nav aria-label="Explorer">
          <Heading>Explorer</Heading>
          <ul className="space-y-2.5 text-sm">
            {EXPLORE_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className={LINK}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <Heading className="mt-8">Mon compte</Heading>
          <ul className="space-y-2.5 text-sm">
            {ACCOUNT_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className={LINK}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <Heading>Contact</Heading>
          <ul className="space-y-2.5 text-sm">
            {CONTACT_PHONES.map((p) => (
              <li key={p.tel}>
                <a href={`tel:${p.tel}`} className={`inline-flex items-center gap-2 ${LINK}`}>
                  <IconCall className="h-4 w-4 text-gold-300" />
                  {p.display}
                </a>
              </li>
            ))}
            <li>
              <a href={`mailto:${CONTACT_EMAIL}`} className={`inline-flex items-center gap-2 break-all ${LINK}`}>
                <IconMail className="h-4 w-4 shrink-0 text-gold-300" />
                {CONTACT_EMAIL}
              </a>
              <a href={GMAIL_COMPOSE_URL} target="_blank" rel="noopener noreferrer" className="ml-6 mt-1 block text-xs text-gold-300 hover:underline">
                Écrire depuis Gmail
              </a>
            </li>
            <li className="pt-2">
              <a
                href={CONTACT_VCARD_PATH}
                download="EduConnect.vcf"
                className="inline-block rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white transition hover:border-gold-300 hover:text-gold-300"
              >
                Enregistrer nos contacts
              </a>
            </li>
          </ul>
        </div>

        <div>
          <Heading>Suivez-nous</Heading>
          <ul className="space-y-2.5 text-sm">
            <li>
              <a href={FACEBOOK_URL} target="_blank" rel="noopener noreferrer" className={LINK}>
                Facebook
              </a>
            </li>
            <li>
              <a href={WHATSAPP_CHANNEL_URL} target="_blank" rel="noopener noreferrer" className={LINK}>
                Chaîne WhatsApp
              </a>
            </li>
          </ul>
          <Heading className="mt-8">Le projet</Heading>
          <ul className="space-y-2.5 text-sm">
            {PROJECT_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className={LINK}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-6 text-xs text-white/60 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>© {year} EduConnect CI. Tous droits réservés.</p>
          <p>Abidjan, Côte d&apos;Ivoire</p>
        </div>
      </div>
    </footer>
  );
}
