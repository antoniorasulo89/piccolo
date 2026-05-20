# Piccolo - Meno rumore. Più relazione.

Social network privato e leggero per community raccolte: profili, feed, gruppi pubblici/privati, messaggi, notifiche, moderazione e console admin.

Costruito con Next.js, SQLite/Turso, JWT, Resend e Tailwind CSS.

## Stato

Beta privata pronta per pilot controllato.

Ultima verifica locale: lint, build, audit route, secret scan ed E2E Playwright verdi. `npm audit` segnala 2 vulnerabilità moderate transitive in `postcss` via Next.js, monitorate perché il fix automatico propone un downgrade breaking.

- Deploy: Vercel
- Database: SQLite locale / Turso cloud
- Auth: email/password, JWT in cookie `httpOnly`
- Lingua prodotto: italiano
- Target: community piccole, corsi, gruppi privati, organizzazioni leggere

## Funzionalità

### Utenti e profili

- Registrazione e login con email/password.
- Primo utente registrato promosso automaticamente ad admin.
- Password con bcrypt 12 round.
- Cookie `httpOnly`, `sameSite=lax`, `secure` in produzione.
- Reset password self-service via email Resend.
- Reset password assistito da admin con token SHA256 e scadenza.
- Nuovi account utente in attesa di approvazione admin prima del primo accesso.
- Profili con bio, avatar, cover image e badge ruolo.
- Privacy profilo: email visibile/nascosta e profilo discoverable.
- Preferenze tema: light, dark, system.
- Onboarding post-registrazione.
- Follow/unfollow con UI ottimistica.
- Blocco utente con rimozione dei follow reciproci e filtri su feed, ricerca, profili, DM, notifiche, gruppi e bookmark.

### Feed e contenuti

- Post testuali fino a 280 caratteri.
- Feed `following`, `all` e `groups`.
- Feed gruppi aggregato: `/feed?scope=groups`.
- Like toggle con UI ottimistica.
- Commenti con modifica ed eliminazione.
- Bookmark/salvataggio post con pagina dedicata.
- Editing post/commenti con timestamp `edited_at`.
- Full-text search FTS5 con ranking BM25.

### Gruppi

- Gruppi pubblici e privati.
- Ruoli: `owner`, `co_owner`, `moderator`, `member`.
- Privacy modificabile dopo la creazione.
- Tab gruppo: Post, Membri, Inviti, Impostazioni.
- Lista membri con avatar, nome e ruolo.
- Owner/co-owner/admin possono gestire impostazioni, richieste e inviti.
- Moderator può moderare contenuti ed espellere membri normali, senza governare privacy/inviti.
- Admin platform ha override completo, tracciato in audit log.
- Richieste di accesso per gruppi privati.
- Link invito sicuri con scadenza, numero massimo di utilizzi, revoca e stato.
- Inviti diretti a utenti registrati.
- Notifica invito diretto con azioni inline: Entra / Rifiuta.
- Re-invito possibile dopo rifiuto o revoca.
- Post di gruppo e post fissati.
- Espulsione membri con protezioni sui ruoli.
- Eliminazione definitiva gruppo da parte di owner o admin.
- Ricerca gruppi per nome/descrizione.

### Messaggistica

- DM 1:1 e chat di gruppo.
- Lista conversazioni con aggiornamento live.
- Messaggi live nella conversazione aperta tramite polling incrementale `since`.
- Badge unread desktop/mobile condivisi da hook singleton.
- Read state per conversazione tramite `last_read_at`.
- Gestione chat di gruppo: rinomina, aggiunta membri, rimozione membri, lascia conversazione e archiviazione personale.
- Owner conversazione e admin possono gestire i membri; i membri normali possono lasciare o archiviare.
- Le conversazioni lasciate o archiviate non contribuiscono al badge unread.

### Notifiche

- Notifiche per like, commenti, follow, post nei gruppi e inviti gruppo diretti.
- Badge notifiche e messaggi in navbar desktop e MobileTabBar.
- Aggiornamento badge live con polling visibility-aware.
- Apertura pagina notifiche: auto-mark come lette.
- Azioni per singola notifica: mark read/unread, delete.
- Filtro "Non lette".
- Preferenze notifica per like, commenti, follow e post nei gruppi.

### Admin

- Console admin con sezioni per metriche, utenti, gruppi, contenuti, report e audit log.
- Gestione utenti: approva iscritti, promuovi/retrocedi admin, sospendi/riattiva.
- Eliminazione definitiva account utente da console admin, con protezione su self-delete e ultimo admin.
- Reset password assistito.
- Moderazione post/commenti.
- Moderazione gruppi: lista gruppi, stato privacy, owner, membri, post count, link gestione.
- Sistema report con categorie e risoluzione.
- Audit log per azioni admin e governance gruppi.
- Audit automatico route admin via `npm run audit:admin`.

### UX

- Design system OKLCH: `fern`, `clay`, `rose`, `charcoal`, `paper`, `surface`.
- Dark mode automatica via `prefers-color-scheme`.
- Mobile-first: MobileTabBar a 6 tab con badge.
- Empty states contestuali.
- Toast notification system event-driven.
- Animazioni leggere: reveal, like-pop, shimmer, pulse.
- `prefers-reduced-motion` rispettato.

### Sicurezza

- JWT HS256 con secret minimo 32 caratteri.
- Query parametrizzate.
- Zod sui body API.
- Rate limit in-memory per login, register, forgot-password, post e creazione gruppi.
- Token sensibili salvati come hash SHA256.
- Protezione open redirect su `?redirect=`.
- Whitelist host immagini condivisa tra schema Zod e `next.config`.
- Admin override esplicito sulle API con permessi role-based.
- Block utente bidirezionale applicato alle superfici social critiche.
- Header sicurezza in produzione:
  - `Strict-Transport-Security`
  - `X-Frame-Options`
  - `X-Content-Type-Options`
  - `Referrer-Policy`
  - `Permissions-Policy`
- `X-Powered-By` rimosso.
- Secret scanning con gitleaks in CI.
- Audit route auth tracciate da Git via `npm run audit:tracked`.

### DevOps

- CI GitHub Actions con lint, build, audit admin, audit tracked, secret scan, E2E.
- Deploy automatico su Vercel.
- Checklist post-deploy in `DEPLOY-CHECKLIST.md`.
- Healthcheck: `/api/health`.
- Backup Turso con workflow GitHub Actions.
- Smoke restore locale con `npm run test:restore` (richiede variabili Turso reali).
- E2E Playwright per flow critici: admin suspend, follow/unfollow, register/post/like.
- Migrazioni DB idempotenti.

## Setup locale

```bash
npm install
cp .env.local.example .env.local
npm run db:init
npm run dev
```

Apri:

```text
http://localhost:3000
```

`JWT_SECRET` deve essere una stringa casuale di almeno 32 caratteri.

Generazione rapida:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Admin iniziali opzionali:

```bash
ADMIN_EMAILS=nome@example.com,altro@example.com
```

Se `TURSO_DATABASE_URL` non è presente, l'app usa `data/social.db`.

## Variabili ambiente

Minime:

```bash
JWT_SECRET=
ADMIN_EMAILS=
TURSO_DATABASE_URL=
TURSO_AUTH_TOKEN=
```

Email:

```bash
RESEND_API_KEY=
RESEND_FROM=
APP_URL=
```

Test:

```bash
TEST_DB_PATH=
```

## Comandi

```bash
npm run dev           # Server sviluppo
npm run build         # Build produzione
npm run start         # Avvio build produzione
npm run lint          # ESLint
npm run db:init       # Inizializza/migra database
npm run audit:admin   # Verifica guard admin routes
npm run audit:tracked # Verifica route auth tracciate da Git
npm run test:e2e      # Playwright E2E tests
npm run test:restore  # Smoke test backup restore (richiede env Turso)
npm run secrets:scan  # Gitleaks scan
```

Stato atteso dei gate su un ambiente configurato:

- `npm run audit:tracked` -> 6/6 route auth tracciate
- `npm run audit:admin` -> 9/9 route admin protette
- `npm run lint` -> 0 errori
- `npm run build` -> build Next completa
- `npm run test:e2e` -> 3/3 test passati
- `npm run secrets:scan` -> no leaks

`npm audit` può restituire 2 moderate transitive su `postcss` via Next.js. Non usare `npm audit fix --force`: propone una risoluzione breaking.

## Deploy

1. Crea un database Turso.
2. Imposta su Vercel le variabili:
   - `JWT_SECRET`
   - `ADMIN_EMAILS` opzionale
   - `TURSO_DATABASE_URL`
   - `TURSO_AUTH_TOKEN`
   - `RESEND_API_KEY` opzionale ma richiesto per email reali
   - `RESEND_FROM` opzionale
   - `APP_URL` opzionale, usato nei link email
3. Connetti il repo GitHub a Vercel.
4. Verifica che la production branch sia `master`.
5. Verifica che Vercel auto-assegni il dominio production al deploy fresco.
6. Esegui le verifiche in `DEPLOY-CHECKLIST.md`.

### Healthcheck

```text
GET /api/health -> { "ok": true, "db": true }
```

### Checklist post-deploy

Dopo ogni deploy:

```bash
curl -i https://piccolo-hazel.vercel.app/api/auth/me
curl -i https://piccolo-hazel.vercel.app/api/health
```

Atteso:

- `/api/auth/me` -> `401` JSON con `X-Matched-Path: /api/auth/me`
- `/api/health` -> `200` JSON

Se `X-Matched-Path` mostra `/_not-found`, l'alias produzione non punta al deploy corretto.

## Database

SQLite locale / Turso cloud.

I timestamp sono salvati in UTC (`CURRENT_TIMESTAMP` / formato SQLite) e convertiti in interfaccia su `Europe/Rome`. Questa scelta evita ambiguità tra GMT, CET e ora legale italiana.

Elementi principali:

- utenti, profili, preferenze privacy/notifiche
- post, commenti, like, bookmark
- gruppi, membri, richieste, link invito, inviti diretti
- conversazioni, membri conversazione, messaggi
- notifiche con `post_id`, `comment_id`, `group_id`
- report post/messaggi/gruppi
- audit log
- FTS5 per ricerca post

Il backup esclude le shadow table FTS. Dopo un restore, eseguire:

```bash
npm run db:init
```

## Stack

- Framework: Next.js 16 App Router, React 19, TypeScript 5, Turbopack
- Database: SQLite / Turso, `@libsql/client`
- Auth: `jose`, `bcryptjs`, cookie `httpOnly`
- Email: Resend
- UI: Tailwind CSS 4, Phosphor Icons
- Validazione: Zod
- Test: Playwright
- CI/CD: GitHub Actions + Vercel
- Backup: GitHub Actions cron + Turso dump

## Note operative

- Eseguire i gate npm in sequenza, non in parallelo.
- Dopo ogni implementazione, verificare che i file dichiarati siano tracciati da Git.
- Per API con Zod, verificare sempre che il client invii body coerenti con lo schema.
- Per feature live/polling, verificare anche lo stato server collegato: unread, `last_read_at`, notifiche.
- Per ogni query SQL parametrizzata modificata, contare placeholder `?` e lunghezza dell'array args.
- Per ogni API role-based, verificare esplicitamente l'override admin o dichiarare l'eccezione.
- Verificare il deploy sul dominio canonico dopo ogni push, non solo sul raw deployment URL.

## Protocollo di verifica Team A/B/C

Regole permanenti usate per chiudere gli sprint:

1. `git ls-files <path>` su ogni file dichiarato.
2. Gate npm eseguiti davvero, E2E incluso quando richiesto.
3. Coerenza tra body client e schema Zod server.
4. Grep esplicito per falsificare claim come "tutto auditato" o "tutte le route protette".
5. Verifica deploy via Git auto, non via working tree locale.
6. Gate npm in sequenza, perché alcuni toccano filesystem condivisi.
7. Numero file dichiarato uguale a `git show --name-only <sha>`.
8. Admin override su ogni role check, salvo eccezione motivata.
9. Placeholder SQL `?` e args devono combaciare in ogni query modificata.

## Backlog noto

- Aumentare copertura E2E sui flussi nuovi: inviti gruppo, DM gruppo, block utente.
- Monitorare upgrade Next.js per le 2 moderate transitive `postcss`.
- Valutare rate limit persistente se il traffico supera il profilo single-instance.
- Split di `db.ts` e `queries.ts` al prossimo verticale importante.
- `test:restore` richiede env Turso reali e non è un gate locale universale.

## Licenza e visibilità

Il repository può essere visibile pubblicamente per portfolio, audit e consultazione tecnica, ma il progetto non è open source.

Tutti i diritti sono riservati. Non è concessa licenza di copia, distribuzione, riuso commerciale, modifica o sublicenza senza autorizzazione scritta del titolare.
