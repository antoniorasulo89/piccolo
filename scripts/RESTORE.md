# Ripristino database Turso / SQLite

Il backup generato da `scripts/backup-db.ts` e completo: include schema (CREATE TABLE, indici, trigger) e dati (INSERT). Puo essere ripristinato su un database vuoto senza bisogno di `db:init`.

## Da backup automatico (GitHub Actions)

1. Vai su GitHub → Actions → Backup Turso
2. Scarica l'artifact dell'ultimo workflow completato (`piccolo-backup-*.sql`)
3. Esegui il restore:

### Su Turso (cloud)

```bash
turso db shell <nome-database> < piccolo-backup.sql
```

### Su SQLite (locale)

```bash
# Su database vergine
sqlite3 data/social.db < piccolo-backup.sql

# Su database esistente (sovrascrive tutto — fare backup prima)
cp data/social.db data/social-backup.db
sqlite3 data/social.db < piccolo-backup.sql
```

### Da client GUI

Apri DBeaver / DB Browser for SQLite, connettiti al database, esegui il file `.sql`.

## Da backup manuale

```bash
npx tsx scripts/backup-db.ts > piccolo-backup-$(date -I).sql
```

Su Windows PowerShell:

```powershell
$env:TURSO_DATABASE_URL="libsql://..."
$env:TURSO_AUTH_TOKEN="..."
npx tsx scripts/backup-db.ts | Out-File -FilePath "piccolo-backup-$(Get-Date -Format 'yyyy-MM-dd').sql" -Encoding utf8
```

## Flusso restore consigliato (DB vergine)

1. Ottieni una copia del backup
2. Crea un nuovo database (o svuota quello esistente)
3. Esegui il dump SQL con `sqlite3` o `turso db shell`
4. Verifica con healthcheck:

```bash
curl https://my-social-hazel.vercel.app/api/health
# → {"ok":true,"db":true}
```

## Verifica integrita backup

```bash
sqlite3 data/social.db "SELECT 'users', COUNT(*) FROM users UNION ALL SELECT 'posts', COUNT(*) FROM posts UNION ALL SELECT 'groups', COUNT(*) FROM groups;"
```

## Cosa contiene il backup

- Schema completo: CREATE TABLE, CREATE INDEX, CREATE TRIGGER
- Dati: INSERT per tutte le tabelle con righe
- Il tutto wrappato in una transazione con `PRAGMA foreign_keys = OFF` all'inizio

## Note

- Retention: 90 giorni su GitHub Artifacts
- Frequenza: ogni domenica alle 04:00 UTC + workflow_dispatch manuale
- Per eseguire il backup manualmente: Actions → Backup Turso → Run workflow
