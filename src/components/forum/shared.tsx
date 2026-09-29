import { Avatar } from "@/components/compte/ui";

// Types et petits éléments d'affichage partagés par les pages du forum (/forum, /forum/[id])

export type Space = "questions" | "profs";

export interface ForumAuthor {
  id: string;
  name: string;
  badge: "Élève" | "Parent" | "Instructeur" | "Membre";
}

export const LEVEL_LABELS: Record<string, string> = { PRIMAIRE: "Primaire", COLLEGE: "Collège", LYCEE: "Lycée", ALL: "Tous niveaux" };

const BADGE_STYLES: Record<ForumAuthor["badge"], string> = {
  Instructeur: "bg-[#c9951a]/15 text-[#8a6510] border-[#c9951a]/40",
  Élève: "bg-sky-50 text-sky-800 border-sky-200",
  Parent: "bg-violet-50 text-violet-800 border-violet-200",
  Membre: "bg-gray-50 text-gray-600 border-gray-200",
};

const AVATAR_TONES = { Instructeur: "gold", Élève: "sky", Parent: "violet", Membre: "gray" } as const;

export function AuthorLine({ author, date, size = "sm" }: { author: ForumAuthor; date: string; size?: "sm" | "md" }) {
  return (
    <span className="inline-flex items-center gap-3 text-xs text-gray-500">
      <Avatar name={author.name} tone={AVATAR_TONES[author.badge]} size={size} />
      <span className="flex flex-col gap-0.5">
        <span className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-[#0d1b3e] text-[13px]">{author.name}</span>
          <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wide ${BADGE_STYLES[author.badge]}`}>{author.badge}</span>
        </span>
        <span>{timeAgo(date)}</span>
      </span>
    </span>
  );
}

export function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "à l'instant";
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
  if (diff < 86400 * 7) return `il y a ${Math.floor(diff / 86400)} j`;
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}
