import { Resend } from "resend";

function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

const FROM = process.env.RESEND_FROM || "Piccolo <noreply@piccolo.social>";

export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  const resend = getResend();
  if (!resend) return;

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: "Reset della password — Piccolo",
    text: `Ciao,

Qualcuno (probabilmente tu) ha richiesto il reset della password per il tuo account Piccolo.

Usa questo link per impostare una nuova password (scade tra 30 minuti):

${resetUrl}

Se non hai richiesto tu il reset, ignora questa email.

— Piccolo`,
  });
}

export async function sendWelcomeEmail(email: string, name: string) {
  const resend = getResend();
  if (!resend) return;

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: "Benvenuto su Piccolo",
    text: `Ciao ${name},

Benvenuto su Piccolo — il social privato per community raccolte.

Con Piccolo puoi:
- Pubblicare post brevi (280 caratteri)
- Creare gruppi pubblici o privati per la tua community
- Gestire ruoli, moderazione e accessi
- Usare messaggi diretti e notifiche

Inizia ora: https://my-social-hazel.vercel.app/feed

— Piccolo`,
  });
}
