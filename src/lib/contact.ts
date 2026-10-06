// Coordonnées publiques d'EduConnect, affichées sur la vitrine (pied de page), la page de
// confidentialité et dans les données structurées. Un seul endroit à modifier si elles changent.
// Le fichier public/educonnect.vcf (contact à enregistrer dans le téléphone) reprend les mêmes
// valeurs : le mettre à jour en même temps.

export const CONTACT_EMAIL = 'educonnect.ci@gmail.com';

// Ouvre directement la fenêtre « Nouveau message » de Gmail (utile sur ordinateur, où un lien
// mailto: ouvre le logiciel de messagerie installé, parfois aucun).
export const GMAIL_COMPOSE_URL = `https://mail.google.com/mail/?view=cm&fs=1&to=${CONTACT_EMAIL}`;

export const CONTACT_PHONES = [
  { display: '+225 07 58 52 93 23', tel: '+2250758529323' },
  { display: '+225 07 88 08 22 45', tel: '+2250788082245' },
  { display: '+225 05 75 53 52 97', tel: '+2250575535297' },
];

// Fiche contact (vCard) que le téléphone propose d'ajouter au répertoire
export const CONTACT_VCARD_PATH = '/educonnect.vcf';
