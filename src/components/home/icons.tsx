// Icônes SVG de la page d'accueil (§7tervicies), dessinées au trait comme le logo.
// Taille et couleur viennent des classes : <IconBook className="h-5 w-5 text-gold-700" />.
// Décoratives par défaut (aria-hidden) : le texte voisin porte le sens.

type IconProps = { className?: string };

function Svg({ className = "h-5 w-5", children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

export function IconArrowRight(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </Svg>
  );
}

export function IconCheck(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </Svg>
  );
}

export function IconSearchUser(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="10" cy="8" r="3.5" />
      <path d="M3.5 19.5c.8-3.3 3.4-5.5 6.5-5.5 1.2 0 2.3.3 3.2.9" />
      <circle cx="17.5" cy="16.5" r="2.5" />
      <path d="M19.4 18.4L21 20" />
    </Svg>
  );
}

export function IconBook(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M12 6.5C10.2 5 7.6 4.5 4 4.5v13c3.6 0 6.2.5 8 2 1.8-1.5 4.4-2 8-2v-13c-3.6 0-6.2.5-8 2z" />
      <path d="M12 6.5v13" />
    </Svg>
  );
}

export function IconClipboardCheck(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="5" y="4.5" width="14" height="16" rx="2" />
      <path d="M9 4.5V3.5h6v1" />
      <path d="M8.5 13l2.5 2.5 4.5-5" />
    </Svg>
  );
}

export function IconChat(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M4 5.5h11a1.5 1.5 0 011.5 1.5v6a1.5 1.5 0 01-1.5 1.5H9l-3.5 3v-3H4A1.5 1.5 0 012.5 13V7A1.5 1.5 0 014 5.5z" />
      <path d="M16.5 9.5H20a1.5 1.5 0 011.5 1.5v5.5A1.5 1.5 0 0120 18h-1v2.5L16 18h-4a1.5 1.5 0 01-1.5-1.5" />
    </Svg>
  );
}

export function IconTeacher(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="9" y="3.5" width="12" height="9" rx="1.5" />
      <circle cx="6" cy="9" r="2.5" />
      <path d="M2 20c.5-3.5 2-5.5 4-5.5s3.5 1.2 4 3.5l3.5-3" />
      <path d="M13 7h5M13 9.5h3" />
    </Svg>
  );
}

export function IconHeadphones(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M4 15v-3a8 8 0 0116 0v3" />
      <rect x="3" y="14" width="4" height="6" rx="1.5" />
      <rect x="17" y="14" width="4" height="6" rx="1.5" />
    </Svg>
  );
}

export function IconLanguages(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M3 5h9M7.5 3v2M5 5c.6 3 2.8 5.5 6 6.5M10 5c-.7 3.2-3 6-6.5 7.5" />
      <path d="M12.5 21l4-9 4 9M14 17.5h5" />
    </Svg>
  );
}

export function IconStairs(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M3 20h5v-4.5h4.5V11H17V6.5h4" />
      <path d="M3 20h18" />
    </Svg>
  );
}

export function IconGift(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="3.5" y="8.5" width="17" height="4" rx="1" />
      <path d="M5 12.5V20h14v-7.5M12 8.5V20" />
      <path d="M12 8.5C10.5 5 7 4.5 7 6.5S10 8.5 12 8.5zM12 8.5c1.5-3.5 5-4 5-2s-3 2-5 2z" />
    </Svg>
  );
}

export function IconNetwork(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="9" y="3" width="6" height="5" rx="1" />
      <rect x="2.5" y="16" width="6" height="5" rx="1" />
      <rect x="15.5" y="16" width="6" height="5" rx="1" />
      <path d="M12 8v4M5.5 16v-4h13v4" />
    </Svg>
  );
}

export function IconCode(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M8.5 7L3.5 12l5 5M15.5 7l5 5-5 5M13.5 4.5l-3 15" />
    </Svg>
  );
}

export function IconPhone(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="6.5" y="2.5" width="11" height="19" rx="2.5" />
      <path d="M10.5 18.5h3" />
    </Svg>
  );
}

export function IconWifiOff(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M3 3l18 18" />
      <path d="M8.5 16.5a5 5 0 017 0M5 13a10 10 0 015.3-2.8M19 13a10 10 0 00-2.2-1.6M2 9.5a15 15 0 015.5-3.2M12 5c3.8 0 7.3 1.6 10 4.5" />
      <circle cx="12" cy="20" r="0.8" fill="currentColor" />
    </Svg>
  );
}

export function IconMic(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="9" y="2.5" width="6" height="11" rx="3" />
      <path d="M5.5 11a6.5 6.5 0 0013 0M12 17.5V21M8.5 21h7" />
    </Svg>
  );
}

export function IconBell(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M6 16.5V11a6 6 0 0112 0v5.5l1.5 1.5h-15L6 16.5z" />
      <path d="M10 20.5a2 2 0 004 0" />
    </Svg>
  );
}

export function IconPlay(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M8 5.5v13l10.5-6.5L8 5.5z" fill="currentColor" stroke="none" />
    </Svg>
  );
}

export function IconPause(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M8 5.5v13M16 5.5v13" strokeWidth={3} />
    </Svg>
  );
}

export function IconMail(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3.5 6l8.5 7 8.5-7" />
    </Svg>
  );
}

export function IconCall(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M5 3.5h3.5l1.5 4.5-2.2 1.4a11 11 0 006.8 6.8L16 14l4.5 1.5V19a1.5 1.5 0 01-1.5 1.5A16.5 16.5 0 013.5 5 1.5 1.5 0 015 3.5z" />
    </Svg>
  );
}
