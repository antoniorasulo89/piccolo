# Piccolo — Meno rumore. Più relazione.

Un social network privato e leggero per community raccolte. Costruito con Next.js, SQLite/Turso, JWT e Tailwind CSS.

## Funzionalità

### Utenti e profili
- Registrazione e login con email/password
- Cookie `httpOnly` con JWT firmato (jose + bcryptjs)
- Profili con bio, avatar, cover image, badge ruolo
- Privacy: email visibile/nascosta, profilo discoverable
- Preferenze tema (light/dark/system) per-utente
- Onboarding post-registrazione
- Follow/unfollow con UI ottimistica

### Contenuti
- Post testuali fino a 280 caratteri
- Like toggle con UI ottimistica
- Commenti con modifica ed eliminazione
- Bookmark/salvataggio post con pagina dedicata
- Editing post e commenti con timestamp `edited_at`
- Full-text search FTS5 con ranking BM25

### Community
- **Gruppi** pubblici e privati con ruoli (owner/moderator/member)
- Richieste di accesso per gruppi privati
- Post di gruppo con moderazione
- Link di invito con token monouso/N-uso
- Post fissati in gruppi (annunci, regole)

### Messaggistica
- **Messaggi diretti** (DM 1:1 e chat di gruppo)
- Unread count con badge in navbar e MobileTabBar
- Read receipts per conversazione
- Polling 30s + event bus per refresh badge

### Notifiche
- Notifiche per like, commenti, follow
- Filtro "solo non lette"
- Mark all read con un click
- Preferenze per tipo notifica (opt-out like/comment/follow)
- Badge notifiche con animazione pulse

### Admin
- Console amministratore con 12 metriche in tempo reale
- Gestione utenti: promuovi/retrocedi admin, sospendi/riattiva
- Reset password assistito (token SHA256 con scadenza 30 min)
- Sistema report: categorie (spam/abuso/privacy/altro), risoluzione con note
- Moderazione contenuti: eliminazione post e commenti
- Audit log: ogni azione admin tracciata
- Audit automatico delle route admin (script `audit:admin`)

### UX
- Design system OKLCH: palette `fern/clay/rose/charcoal/paper/surface`
- Dark mode automatica via `prefers-color-scheme`
- Landing page con brand identity ("Meno rumore. Più relazione.")
- Mobile-first: MobileTabBar 6 tab con badge, Navbar glassmorphism
- Empty states composti su 6 schermate
- Animazioni CSS leggere (stagger reveal, like-pop, shimmer skeleton)
- `prefers-reduced-motion` rispettato
- Toast notification system event-driven

### Sicurezza
- Password bcrypt 12 round, JWT HS256 con secret ≥32 char
- Cookie `httpOnly`, `sameSite=lax`, `secure` in produzione
- Rate limiting in-memory per login, register, post
- Security headers: X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
- HSTS preload attivo
- Secret scanning (gitleaks) in CI + pre-commit hook
- 100% query parametrizzate (zero SQL injection)

### DevOps
- **CI/CD**: GitHub Actions (lint, build, admin audit, secret scan, E2E tests)
- **Deploy**: Vercel + Turso (cloud DB), ~40s build
- **Backup**: GitHub Actions cron settimanale con dump Turso
- **Monitoring**: healthcheck endpoint `/api/health`
- E2E tests Playwright (3 flow critici: register+post+like, follow+unfollow, admin suspend)
- DB migrazioni idempotenti con `_meta.schema_version`

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
npm run dev          # Server sviluppo
npm run build        # Build produzione
npm run lint         # ESLint
npm run db:init      # Inizializza database
npm run test:e2e     # Playwright E2E tests
npm run audit:admin  # Verifica guard admin routes
npm run secrets:scan # Gitleaks scan
```

## Deploy

Per pubblicare gratis:

1. Crea un database [Turso](https://turso.tech) Free.
2. Imposta su Vercel le variabili d'ambiente:
   - `JWT_SECRET` — stringa casuale ≥32 caratteri
   - `ADMIN_EMAILS` — email degli admin iniziali (opzionale)
   - `TURSO_DATABASE_URL` — URL del database Turso
   - `TURSO_AUTH_TOKEN` — token di autenticazione Turso
3. Connetti il repo GitHub a Vercel per deploy automatico.
4. Esegui `npm run db:init` contro il database Turso di produzione per creare le tabelle.

In locale, se `TURSO_DATABASE_URL` non è presente, l'app usa `data/social.db`.

### Healthcheck

```
GET /api/health → { "ok": true, "db": true }
```

Puoi usare [UptimeRobot](https://uptimerobot.com) (gratuito) per monitorare l'uptime.

## Stack

- **Framework**: Next.js 16 App Router (React 19, TypeScript 5, Turbopack)
- **Database**: SQLite locale / Turso cloud (`@libsql/client`) con 20 tabelle + FTS5
- **Auth**: JWT (`jose`) + bcryptjs, cookie httpOnly
- **Stile**: Tailwind CSS 4, Phosphor Icons, design system OKLCH
- **Validazione**: Zod
- **Test**: Playwright (E2E), Vitest (previsto)
- **CI/CD**: GitHub Actions + Vercel auto-deploy
- **Backup**: GitHub Actions cron + Turso dump

## Licenza

Progetto privato. Tutti i diritti riservati.
