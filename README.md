# Piccolo

Un social network leggero costruito con Next.js, SQLite, JWT e Tailwind CSS.

## Funzioni MVP

- Registrazione e login con email/password
- Cookie `httpOnly` con JWT firmato
- Feed personale con post propri e post degli utenti seguiti
- Pubblicazione post testuali fino a 280 caratteri
- Like toggle con UI ottimistica
- Follow/unfollow utenti
- Profili con post e contatori
- Area admin protetta con statistiche, gestione ruoli e moderazione post

## Setup locale

```bash
npm install
cp .env.local.example .env.local
npm run db:init
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000).

`JWT_SECRET` deve essere una stringa casuale di almeno 32 caratteri. Per generarne una:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Il primo utente registrato diventa automaticamente amministratore. Puoi anche
predefinire email admin con:

```bash
ADMIN_EMAILS=nome@example.com,altro@example.com
```

## Comandi

```bash
npm run db:init
npm run lint
npm run build
npm run dev
```

## Deploy gratis

Per pubblicare gratis:

1. Crea un database Turso Free.
2. Imposta su Vercel le variabili:
   - `JWT_SECRET`
   - `ADMIN_EMAILS`, opzionale
   - `TURSO_DATABASE_URL`
   - `TURSO_AUTH_TOKEN`
3. Deploya il progetto su Vercel Hobby.

In locale, se `TURSO_DATABASE_URL` non e presente, l'app usa `data/social.db`.

## Stack

- Next.js 16 App Router
- React 19
- TypeScript
- SQLite locale / Turso cloud con `@libsql/client`
- `bcryptjs` per password hash
- `jose` per JWT
- Tailwind CSS 4
- Phosphor Icons
