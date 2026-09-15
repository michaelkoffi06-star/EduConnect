import { Resend } from 'resend';

// Instanciation paresseuse : évite qu'une variable d'environnement manquante
// fasse planter le chargement du module (et donc le build) avant même
// qu'un email ne soit réellement envoyé.
let client: Resend | null = null;

export function getResendClient(): Resend {
  if (!client) {
    client = new Resend(process.env.RESEND_API_KEY);
  }
  return client;
}
