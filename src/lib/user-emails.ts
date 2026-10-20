import { getResendClient } from '@/lib/resend';

// Emails envoyés aux comptes utilisateurs (voir §7quindecies de la doc).
// Un échec d'envoi est journalisé mais ne fait jamais échouer la requête appelante.

const FROM = 'EduConnect <notifications@educonnect-ci.org>';

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function layout(firstName: string, body: string): string {
  return `
    <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 560px;">
      <h2 style="color: #c9951a;">Bonjour ${escapeHtml(firstName)},</h2>
      ${body}
      <p style="font-size: 12px; color: #888; margin-top: 28px;">EduConnect CI — educonnect-ci.org</p>
    </div>
  `;
}

function button(href: string, label: string): string {
  return `<p style="margin: 24px 0;"><a href="${href}" style="background: #c9951a; color: #fff; padding: 12px 22px; border-radius: 10px; text-decoration: none; font-weight: bold;">${label}</a></p>
    <p style="font-size: 12px; color: #888;">Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br><a href="${href}">${href}</a></p>`;
}

// Renvoie true si Resend a accepté l'email (les appelants peuvent l'ignorer)
async function send(to: string, subject: string, html: string): Promise<boolean> {
  try {
    const { error } = await getResendClient().emails.send({ from: FROM, to: [to], subject, html });
    if (error) {
      console.error(`⚠️ Email « ${subject} » non envoyé :`, JSON.stringify(error));
      return false;
    }
    return true;
  } catch (err) {
    console.error(`⚠️ Email « ${subject} » non envoyé :`, err);
    return false;
  }
}

export function sendVerificationEmail(to: string, firstName: string, link: string) {
  return send(
    to,
    'Confirmez votre adresse email — EduConnect',
    layout(
      firstName,
      `<p>Votre compte EduConnect est presque prêt. Confirmez votre adresse email pour pouvoir vous connecter :</p>
       ${button(link, 'Confirmer mon email')}
       <p style="font-size: 12px; color: #888;">Ce lien est valable 48 heures. Si vous n'avez pas créé de compte, ignorez cet email.</p>`
    )
  );
}

export function sendPasswordResetEmail(to: string, firstName: string, link: string) {
  return send(
    to,
    'Réinitialisation de votre mot de passe — EduConnect',
    layout(
      firstName,
      `<p>Vous avez demandé à changer le mot de passe de votre compte EduConnect :</p>
       ${button(link, 'Choisir un nouveau mot de passe')}
       <p style="font-size: 12px; color: #888;">Ce lien est valable 1 heure. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email : votre mot de passe reste inchangé.</p>`
    )
  );
}

export function sendMarketSelectedEmail(to: string, firstName: string, offerTitle: string, link: string) {
  return send(
    to,
    'Vous avez été retenu(e) pour une annonce — EduConnect',
    layout(
      firstName,
      `<p>Bonne nouvelle : l'équipe EduConnect vous a retenu(e) pour l'annonce <strong>« ${escapeHtml(offerTitle)} »</strong>.</p>
       <p>Nous vous contactons très vite par WhatsApp pour organiser la suite.</p>
       ${button(link, 'Voir mon espace instructeur')}`
    )
  );
}

// Nouveau lien personnel de modification de profil (après régénération par l'équipe, §7sedecies)
export function sendNewEditLinkEmail(to: string, firstName: string, link: string) {
  return send(
    to,
    'Votre nouveau lien de modification de profil — EduConnect',
    layout(
      firstName,
      `<p>Pour protéger votre fiche instructeur, l'équipe EduConnect a remplacé votre lien personnel de modification de profil. L'ancien lien ne fonctionne plus.</p>
       ${button(link, 'Modifier mon profil')}
       <p style="font-size: 12px; color: #888;">Conservez ce lien et ne le partagez avec personne : il permet de modifier votre fiche sans mot de passe. Vous pouvez aussi le retrouver dans votre espace « Mon compte ».</p>`
    )
  );
}

// --- Anglais technique (§7novodecies) ---

// Instructions de paiement après une inscription (compte déjà confirmé)
export function sendEnglishPaymentInstructionsEmail(
  to: string,
  firstName: string,
  planLabel: string,
  amount: string,
  reference: string,
  numbers: { label: string; number: string }[],
  link: string
) {
  const list = numbers.map((n) => `<li><strong>${escapeHtml(n.label)}</strong> : ${escapeHtml(n.number)}</li>`).join('');
  return send(
    to,
    'Ton inscription en anglais technique — EduConnect',
    layout(
      firstName,
      `<p>Ton inscription à la formule <strong>${escapeHtml(planLabel)}</strong> est enregistrée. Pour l'activer, envoie <strong>${escapeHtml(amount)}</strong> sur l'un de ces numéros :</p>
       <ul>${list}</ul>
       <p>Indique la référence <strong>${escapeHtml(reference)}</strong> dans le motif du paiement, puis saisis l'identifiant de ta transaction sur ton espace :</p>
       ${button(link, 'Déclarer mon paiement')}`
    )
  );
}

export function sendEnglishActivatedEmail(to: string, firstName: string, planLabel: string, endDate: string, link: string) {
  return send(
    to,
    'Ton abonnement est actif — EduConnect',
    layout(
      firstName,
      `<p>Paiement reçu, merci ! Ta formule <strong>${escapeHtml(planLabel)}</strong> est active jusqu'au <strong>${escapeHtml(endDate)}</strong>.</p>
       ${button(link, 'Commencer à apprendre')}`
    )
  );
}

export function sendEnglishPaymentRejectedEmail(to: string, firstName: string, note: string, link: string) {
  return send(
    to,
    'Ton paiement n’a pas pu être confirmé — EduConnect',
    layout(
      firstName,
      `<p>L'équipe EduConnect n'a pas pu confirmer ton paiement.</p>
       ${note ? `<p><strong>Motif :</strong> ${escapeHtml(note)}</p>` : ''}
       <p>Vérifie l'identifiant de ta transaction et déclare-le à nouveau, ou réponds à cet email si besoin.</p>
       ${button(link, 'Voir mon abonnement')}`
    )
  );
}

export function sendEnglishReminderEmail(to: string, firstName: string, planLabel: string, endDate: string, link: string) {
  return send(
    to,
    'Ton abonnement se termine dans une semaine — EduConnect',
    layout(
      firstName,
      `<p>Ta formule <strong>${escapeHtml(planLabel)}</strong> se termine le <strong>${escapeHtml(endDate)}</strong>.</p>
       <p>Pour continuer sans interruption, renouvelle-la dès maintenant :</p>
       ${button(link, 'Renouveler mon abonnement')}`
    )
  );
}

// Annonce d'un nouveau contenu. Envoi groupé (100 emails par appel à Resend) ; renvoie le nombre accepté.
// Les lots sont espacés (limite de débit de Resend) et un lot refusé est retenté une fois.
const BATCH_PAUSE_MS = 600;
const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
export async function sendEnglishAnnouncementEmails(
  recipients: { email: string; firstName: string; unsubscribeLink: string }[],
  title: string,
  message: string,
  link: string | null
): Promise<number> {
  let sent = 0;
  for (let i = 0; i < recipients.length; i += 100) {
    const batch = recipients.slice(i, i + 100).map((r) => ({
      from: FROM,
      to: [r.email],
      subject: `${title} — EduConnect`,
      html: layout(
        r.firstName,
        `<h3 style="color: #0d1b3e;">${escapeHtml(title)}</h3>
         <p style="white-space: pre-line;">${escapeHtml(message)}</p>
         ${link ? button(escapeHtml(link), 'Découvrir') : ''}
         <p style="font-size: 12px; color: #888;">Tu reçois cet email car tu as accepté les nouveautés de l'anglais technique EduConnect. <a href="${r.unsubscribeLink}">Ne plus recevoir ces emails</a>.</p>`
      ),
    }));
    if (i > 0) await pause(BATCH_PAUSE_MS);
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const { error } = await getResendClient().batch.send(batch);
        if (!error) {
          sent += batch.length;
          break;
        }
        console.error(`⚠️ Annonce anglais technique : lot non envoyé (essai ${attempt}) :`, JSON.stringify(error));
      } catch (err) {
        console.error(`⚠️ Annonce anglais technique : lot non envoyé (essai ${attempt}) :`, err);
      }
      if (attempt === 1) await pause(BATCH_PAUSE_MS * 3);
    }
  }
  return sent;
}

// Alerte à l'équipe : un apprenant a déclaré un paiement à vérifier
export function sendEnglishPaymentDeclaredAlert(learner: string, planLabel: string, amount: string, reference: string, method: string, transactionId: string) {
  const to = process.env.ADMIN_NOTIFICATION_EMAIL;
  if (!to) {
    console.error("ADMIN_NOTIFICATION_EMAIL n'est pas défini : alerte de paiement non envoyée.");
    return Promise.resolve(false);
  }
  return send(
    to,
    `Paiement à vérifier : ${reference}`,
    `<div style="font-family: sans-serif; padding: 20px; color: #333;">
       <h2 style="color: #c9951a;">Paiement déclaré (anglais technique)</h2>
       <p><strong>Apprenant :</strong> ${escapeHtml(learner)}</p>
       <p><strong>Formule :</strong> ${escapeHtml(planLabel)} · ${escapeHtml(amount)}</p>
       <p><strong>Référence :</strong> ${escapeHtml(reference)}</p>
       <p><strong>Moyen :</strong> ${escapeHtml(method)} · <strong>transaction :</strong> ${escapeHtml(transactionId)}</p>
       <p>À valider dans /administratif, onglet « Anglais technique ».</p>
     </div>`
  );
}
