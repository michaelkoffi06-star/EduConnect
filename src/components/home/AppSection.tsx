import ScrollReveal from "@/components/ScrollReveal";
import AppWaitlistForm from "@/components/anglais/AppWaitlistForm";
import { IconBell, IconHeadphones, IconMic, IconPlay, IconWifiOff } from "./icons";

// Section 5 de l'accueil (§7tervicies) : l'application EduConnect, annoncée pour février 2027
// (§7unvicies). Elle n'est PAS encore disponible : badge « Bientôt disponible », maquette signalée
// comme indicative, et inscription à la liste d'attente existante (AppWaitlistForm,
// POST /api/anglais/application). Section au tutoiement, comme ce formulaire et les pages d'anglais.

const FEATURES = [
  { icon: IconWifiOff, title: "Hors connexion", text: "Télécharge tes leçons et révise sans consommer ton forfait." },
  { icon: IconMic, title: "Ta voix enregistrée", text: "Écoute-toi dans la leçon et compare avec le modèle." },
  { icon: IconBell, title: "Rappels et progression", text: "Des rappels pour garder le rythme, et ta progression sauvegardée." },
  { icon: IconHeadphones, title: "La version pro", text: "Coaching, certification et nouveaux chapitres." },
];

// Maquette de téléphone dessinée en CSS (aucune capture d'une application qui n'existe pas encore)
function PhoneMockup() {
  return (
    <div className="relative mx-auto w-[15.5rem] sm:w-64">
      <div aria-hidden="true" className="absolute -inset-8 rounded-full bg-gold-500/15 blur-3xl" />
      <div className="relative rounded-[2.6rem] bg-navy-900 p-2.5 shadow-[0_40px_80px_-30px_rgba(13,27,62,0.7)]">
        <div className="relative overflow-hidden rounded-[2.1rem] bg-cream-50">
          <div className="mx-auto mt-2 h-5 w-24 rounded-full bg-navy-900" />
          <div className="space-y-3 px-4 pb-6 pt-4">
            <div className="flex items-center justify-between">
              <span className="font-[family-name:var(--font-cinzel)] text-sm text-navy-900">
                Edu<span className="text-gold-700">Connect</span>
              </span>
              <span className="rounded-full bg-navy-900 px-2 py-0.5 text-[9px] font-semibold text-gold-300">A1</span>
            </div>
            <div className="rounded-2xl bg-navy-900 p-3.5 text-white">
              <p className="text-[9px] font-semibold uppercase tracking-wider text-gold-300">Chapter 1 · Lesson 1</p>
              <p className="mt-1 text-xs font-semibold leading-snug" lang="en">
                Introducing Yourself
              </p>
              <div className="mt-3 h-1.5 rounded-full bg-white/15">
                <div className="h-full w-3/5 rounded-full bg-gold-500" />
              </div>
              <p className="mt-1.5 text-[9px] text-white/70">Progression 60 %</p>
            </div>
            {["networking", "web developer"].map((w) => (
              <div key={w} className="flex items-center gap-2.5 rounded-xl bg-white p-2.5 ring-1 ring-line">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gold-500 text-navy-900">
                  <IconPlay className="ml-0.5 h-3 w-3" />
                </span>
                <span className="text-[11px] font-semibold text-navy-900" lang="en">
                  {w}
                </span>
              </div>
            ))}
            <div className="flex items-center gap-2 rounded-xl bg-white p-2.5 text-[10px] text-gray-600 ring-1 ring-line">
              <IconWifiOff className="h-3.5 w-3.5 text-gold-700" />
              Leçon disponible hors connexion
            </div>
          </div>
        </div>
      </div>
      <p className="mt-4 text-center text-xs text-gray-500">Maquette indicative : l&apos;application est en préparation.</p>
    </div>
  );
}

export default function AppSection() {
  return (
    <section id="application" aria-labelledby="application-titre" className="scroll-mt-20 overflow-hidden border-y border-line bg-cream-50 py-20 lg:py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-14 px-5 sm:px-6 lg:grid-cols-[0.8fr_1.2fr]">
        <ScrollReveal className="order-2 lg:order-1">
          <PhoneMockup />
        </ScrollReveal>

        <ScrollReveal className="order-1 lg:order-2" delay={100}>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-navy-900 px-3 py-1 text-xs font-semibold text-gold-300">Février 2027</span>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-gold-700 ring-1 ring-line">Bientôt disponible</span>
          </div>
          <h2 id="application-titre" className="mt-4 font-[family-name:var(--font-cinzel)] text-3xl text-navy-900 md:text-4xl">
            L&apos;application EduConnect arrive
          </h2>
          <p className="mt-4 max-w-xl leading-relaxed text-gray-600">
            D&apos;abord pour l&apos;anglais technique : le site te fait découvrir les manuels, l&apos;application te
            permettra d&apos;apprendre partout. D&apos;abord sur Android, puis sur iPhone.
          </p>

          <ul className="mt-7 grid gap-4 sm:grid-cols-2">
            {FEATURES.map((f) => (
              <li key={f.title} className="flex gap-3">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-gold-700 ring-1 ring-line">
                  <f.icon className="h-[18px] w-[18px]" />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-navy-900">{f.title}</span>
                  <span className="mt-0.5 block text-sm leading-relaxed text-gray-600">{f.text}</span>
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-8 rounded-3xl border border-line bg-white p-5 shadow-sm sm:p-6">
            <AppWaitlistForm />
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
