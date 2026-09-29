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

async function send(to: string, subject: string, html: string) {
  try {
    const { error } = await getResendClient().emails.send({ from: FROM, to: [to], subject, html });
    if (error) console.error(`⚠️ Email « ${subject} » non envoyé :`, JSON.stringify(error));
  } catch (err) {
    console.error(`⚠️ Email « ${subject} » non envoyé :`, err);
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
