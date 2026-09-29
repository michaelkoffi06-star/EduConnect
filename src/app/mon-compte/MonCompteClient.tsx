"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Avatar,
  ErrorBox,
  Icon,
  InfoBox,
  Page,
  PageHero,
  ROLE_LABELS,
  SkeletonCards,
  SuccessBox,
  cardClass,
  inputClass,
  labelClass,
  smallBtn,
  useAccount,
  type AccountUser,
} from "@/components/compte/ui";

// Tuile de raccourci : icône dans une pastille, flèche qui glisse au survol
function Shortcut({ href, title, text, icon, accent = false, i }: { href: string; title: string; text: string; icon: React.ReactNode; accent?: boolean; i: number }) {
  return (
    <Link
      href={href}
      style={{ "--i": i } as React.CSSProperties}
      className={`group relative overflow-hidden rounded-[1.5rem] p-5 border transition-all duration-300 hover:-translate-y-1 ${
        accent
          ? "bg-gradient-to-br from-[#0d1b3e] to-[#1f3a66] border-[#0d1b3e] text-white shadow-[0_20px_40px_-18px_rgba(13,27,62,0.7)]"
          : "bg-white/85 backdrop-blur border-[#eee6d3] hover:border-[#c9951a]/60 shadow-sm hover:shadow-[0_20px_40px_-20px_rgba(13,27,62,0.3)]"
      }`}
    >
      <span className="pointer-events-none absolute -right-8 -top-8 w-28 h-28 rounded-full bg-[#c9951a]/10 group-hover:scale-150 transition-transform duration-700" />
      <span className={`relative w-11 h-11 rounded-2xl flex items-center justify-center ${accent ? "bg-[#c9951a] text-white" : "bg-[#faf3e0] text-[#8a6510]"}`}>{icon}</span>
      <span className={`relative flex items-center gap-1.5 mt-4 font-bold ${accent ? "text-white" : "text-[#0d1b3e]"}`}>
        {title}
        <span className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all">{Icon.arrow(16)}</span>
      </span>
      <span className={`relative block text-xs mt-1 leading-snug ${accent ? "text-white/75" : "text-gray-600"}`}>{text}</span>
    </Link>
  );
}

function InstructorStatus({ user }: { user: AccountUser }) {
  if (user.role !== "INSTRUCTEUR" || user.instructorStatus === "APPROVED") return null;
  if (user.instructorStatus === "SUSPENDED") {
    return (
      <InfoBox>
        Votre profil instructeur est actuellement <span className="font-semibold">suspendu</span> : le marché des annonces et la
        salle des profs sont fermés. Contactez l&apos;équipe EduConnect pour en savoir plus.
      </InfoBox>
    );
  }
  return (
    <InfoBox>
      Votre profil instructeur est <span className="font-semibold">en attente de validation</span>. Le marché des annonces et la
      salle des profs s&apos;ouvriront dès que l&apos;équipe l&apos;aura approuvé. En attendant, les corrigés et le forum vous sont
      déjà ouverts.
    </InfoBox>
  );
}

export default function MonCompteClient() {
  const { user, setUser, loading } = useAccount();
  const [welcome, setWelcome] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [classe, setClasse] = useState("");
  const [profileMsg, setProfileMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwdMsg, setPwdMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [savingPwd, setSavingPwd] = useState(false);

  useEffect(() => {
    setWelcome(new URLSearchParams(window.location.search).get("bienvenue") === "1");
  }, []);

  // Session expirée ou email non confirmé : retour à la connexion
  useEffect(() => {
    if (!loading && !user) window.location.href = "/connexion?suite=/mon-compte";
    if (user) {
      setFirstName(user.firstName);
      setLastName(user.lastName);
      setClasse(user.classe || "");
    }
  }, [loading, user]);

  const patch = async (body: Record<string, unknown>) => {
    const res = await fetch("/api/compte", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Erreur lors de l'enregistrement.");
    if (data.user) setUser(data.user);
  };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    setSavingProfile(true);
    try {
      await patch({ firstName, lastName, classe });
      setProfileMsg({ ok: true, text: "Profil enregistré." });
    } catch (err: any) {
      setProfileMsg({ ok: false, text: err.message });
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdMsg(null);
    setSavingPwd(true);
    try {
      await patch({ currentPassword, newPassword });
      setPwdMsg({ ok: true, text: "Mot de passe modifié." });
      setCurrentPassword("");
      setNewPassword("");
    } catch (err: any) {
      setPwdMsg({ ok: false, text: err.message });
    } finally {
      setSavingPwd(false);
    }
  };

  const logout = async () => {
    await fetch("/api/compte/deconnexion", { method: "POST" }).catch(() => {});
    window.location.href = "/";
  };

  if (loading || !user) {
    return (
      <Page width="max-w-3xl">
        <SkeletonCards count={3} />
      </Page>
    );
  }

  const since = new Date(user.createdAt).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  const shortcuts = [
    user.isApprovedInstructor && { href: "/espace-instructeur", title: "Marché des annonces", text: "Les besoins des familles : positionnez-vous.", icon: Icon.briefcase(20), accent: true },
    { href: "/bibliotheque/corriges", title: "Corrigés", text: "Tous les corrigés, à lire en ligne ou à télécharger.", icon: Icon.key(20), accent: !user.isApprovedInstructor },
    { href: "/forum", title: "Forum", text: "Poser une question, aider les autres.", icon: Icon.chat(20) },
    user.isApprovedInstructor && { href: "/forum?espace=profs", title: "Salle des profs", text: "L'espace d'échange entre instructeurs.", icon: Icon.users(20) },
    { href: "/bibliotheque", title: "Bibliothèque", text: "Cours, exercices, vidéos et liens.", icon: Icon.book(20) },
    user.instructorEditPath && { href: user.instructorEditPath, title: "Ma fiche instructeur", text: "Bio, matières, photo… (repasse en validation).", icon: Icon.pen(20) },
  ].filter(Boolean) as { href: string; title: string; text: string; icon: React.ReactNode; accent?: boolean }[];

  return (
    <PageHero
      image="/images/comptes/mon-compte.jpg"
      position="center 22%"
      kicker={ROLE_LABELS[user.role]}
      title={<>Bonjour <span className="text-[#c9951a]">{user.firstName}</span></>}
      subtitle="Ton espace EduConnect : tes accès, ton profil et tes réglages."
      aside={
        <div className="relative animate-float-y">
          <div className="bg-white/90 backdrop-blur-xl border border-white rounded-[2rem] p-6 w-72 shadow-[0_20px_60px_-15px_rgba(13,27,62,0.3)]">
            <div className="flex items-center gap-4">
              <Avatar name={`${user.firstName} ${user.lastName}`} size="lg" />
              <div className="min-w-0">
                <p className="font-bold text-[#0d1b3e] truncate">{user.firstName} {user.lastName}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
                <span className="inline-block mt-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#c9951a]/15 text-[#8a6510]">
                  {ROLE_LABELS[user.role]}{user.classe ? ` · ${user.classe}` : ""}
                </span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-4 pt-4 border-t border-[#eee6d3]">Membre depuis {since}</p>
          </div>
          <span className="absolute -top-3 -right-3 w-11 h-11 rounded-full bg-[#c9951a] text-white flex items-center justify-center shadow-lg">
            {Icon.check(20)}
          </span>
        </div>
      }
    >
      <div className="space-y-6">
        {welcome && <SuccessBox>Ton email est confirmé, bienvenue sur EduConnect !</SuccessBox>}
        <InstructorStatus user={user} />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
          {shortcuts.map((s, i) => (
            <Shortcut key={s.href} {...s} i={i} />
          ))}
        </div>

        <div className={`grid grid-cols-1 ${user.role !== "INSTRUCTEUR" ? "lg:grid-cols-2" : ""} gap-5 pt-2`}>
          {user.role !== "INSTRUCTEUR" && (
            <form onSubmit={saveProfile} className={`${cardClass} space-y-4 animate-fade-blur`}>
              <h2 className="flex items-center gap-2 font-bold text-[#0d1b3e]">
                <span className="text-[#c9951a]">{Icon.user(18)}</span> Mon profil
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass} htmlFor="firstName">Prénom</label>
                  <input id="firstName" required maxLength={60} value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass} htmlFor="lastName">Nom</label>
                  <input id="lastName" required maxLength={60} value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputClass} />
                </div>
              </div>
              {user.role === "ELEVE" && (
                <div>
                  <label className={labelClass} htmlFor="classe">Classe</label>
                  <input id="classe" maxLength={30} value={classe} onChange={(e) => setClasse(e.target.value)} placeholder="3e, Tle D, CM2…" className={inputClass} />
                </div>
              )}
              <p className="text-xs text-gray-500">Sur le forum, seuls ton prénom et l&apos;initiale de ton nom sont affichés.</p>
              {profileMsg && (profileMsg.ok ? <SuccessBox>{profileMsg.text}</SuccessBox> : <ErrorBox>{profileMsg.text}</ErrorBox>)}
              <button type="submit" disabled={savingProfile} className={smallBtn}>
                {savingProfile ? "Enregistrement..." : "Enregistrer"}
              </button>
            </form>
          )}

          <form onSubmit={savePassword} className={`${cardClass} space-y-4 animate-fade-blur [animation-delay:100ms]`}>
            <h2 className="flex items-center gap-2 font-bold text-[#0d1b3e]">
              <span className="text-[#c9951a]">{Icon.lock(18)}</span> Mot de passe
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass} htmlFor="currentPassword">Actuel</label>
                <input id="currentPassword" type="password" required autoComplete="current-password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass} htmlFor="newPassword">Nouveau</label>
                <input id="newPassword" type="password" required minLength={8} autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputClass} />
              </div>
            </div>
            <p className="text-xs text-gray-500">8 caractères minimum.</p>
            {pwdMsg && (pwdMsg.ok ? <SuccessBox>{pwdMsg.text}</SuccessBox> : <ErrorBox>{pwdMsg.text}</ErrorBox>)}
            <button type="submit" disabled={savingPwd} className={smallBtn}>
              {savingPwd ? "Enregistrement..." : "Changer le mot de passe"}
            </button>
          </form>
        </div>

        <div className="text-center pt-2">
          <button type="button" onClick={logout} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-red-600 transition-colors">
            {Icon.logout(16)} Se déconnecter
          </button>
        </div>
      </div>
    </PageHero>
  );
}
