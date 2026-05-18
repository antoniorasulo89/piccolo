# Deploy Checklist — Piccolo

## Configurazione Vercel (una tantum)

Verifica in [Vercel Dashboard → piccolo → Settings → Git](https://vercel.com/antonior89-s-projects/piccolo/settings/git):

- **Production Branch**: deve essere `master`
- **Auto-assign custom production domains**: deve essere **attivo** (spuntato)

Senza questa opzione, ogni `git push` crea un deployment Ready ma **non promuove** l'alias `piccolo-hazel.vercel.app`. Prod rimane sul deployment precedente.

## Dopo ogni deploy

```bash
curl -sI https://piccolo-hazel.vercel.app/api/auth/me
```

**Atteso:** `401` + `X-Matched-Path: /api/auth/me`

```bash
curl -s https://piccolo-hazel.vercel.app/api/health
```

**Atteso:** `{"ok":true,"db":true}`

## Se fallisce

Se uno dei due mostra `X-Matched-Path: /_not-found` o `Content-Type: text/html` o `404`:

1. Vai su [Deployments](https://vercel.com/antonior89-s-projects/piccolo/deployments)
2. Trova l'ultimo deployment `Ready` (non `Error`)
3. Clicca `...` → `Promote to Production`
4. Riesegui i curl sopra

In alternativa, da CLI: `npx vercel deploy --prod --yes` forza promozione immediata.

## Note

- Dopo `--force` deploy, l'alias può richiedere fino a 60s per propagarsi.
- Il raw deployment URL (es. `piccolo-abc123.vercel.app`) ha Vercel Deployment Protection attivo.
- Verificare **sempre** sull'alias `piccolo-hazel.vercel.app`, mai sul raw URL.
