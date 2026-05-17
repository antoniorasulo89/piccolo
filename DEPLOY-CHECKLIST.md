# Deploy Checklist — Piccolo

Dopo ogni deploy (Vercel CLI `--prod`, Git push, o "Redeploy without build cache"):

## Verifica alias

```bash
curl -sI https://my-social-hazel.vercel.app/api/auth/me
```

**Atteso:** `401` + `X-Matched-Path: /api/auth/me`

```bash
curl -s https://my-social-hazel.vercel.app/api/health
```

**Atteso:** `{"ok":true,"db":true}`

## Se fallisce

Se uno dei due mostra:

- `X-Matched-Path: /_not-found`
- `Content-Type: text/html`
- `404`

→ L'alias prod non e promosso al deployment corrente. Vai su [Vercel Dashboard → my-social → Deployments](https://vercel.com/antonior89-s-projects/my-social/deployments), trova il deployment corretto, clicca `...` → `Promote to Production`.

## Note

- Dopo `--force` deploy, la propagazione alias puo richiedere fino a 60s.
- Il raw deployment URL (es. `my-social-abc123.vercel.app`) ha Vercel SSO attivo e non e usabile per test API.
- Verificare sempre sull'alias `my-social-hazel.vercel.app`.
