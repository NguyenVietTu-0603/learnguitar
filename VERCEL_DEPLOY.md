# Vercel Deployment Guide - Frontend

The Vite + React frontend is deployed to Vercel from this monorepo.

## 1. One-time setup

1. Go to https://vercel.com → **Add New** → **Project**
2. **Import** the GitHub repo `NguyenVietTu-0603/learnguitar`
3. **Configure Project**:
   - **Project Name**: `learn-guitar-frontend` (or your choice)
   - **Framework Preset**: Vite (auto-detected)
   - **Root Directory**: click **Edit** → set to `learn-guitar-frontend`
   - **Build & Output settings** are already configured in `vercel.json`:
     - Build Command: `npm run build`
     - Output Directory: `dist`
     - Install Command: `npm install`

## 2. Environment Variables

In **Settings → Environment Variables**, add for **Production** (and optionally Preview):

| Variable | Value | Notes |
|---|---|---|
| `VITE_API_URL` | `https://<your-backend>.up.railway.app/api/v1` | Set **after** Railway deploys the backend |
| `VITE_TAB_API_URL` | `https://<your-flask>.up.railway.app` | Set **after** Railway deploys the AI service |

> Tip: do the Vercel deploy **first** with placeholder URLs, then update once Railway is up. Vercel supports re-deploy on env change.

## 3. Deploy

Click **Deploy**. First build takes 1–3 minutes (Tailwind 4 + TS 6 + Vite 8 cold cache).

## 4. After deploy

Copy the Vercel URL (e.g. `https://learn-guitar-frontend-xxx.vercel.app`) and:
- Set it as `CORS_ORIGIN` in the Railway backend service
- Set it as `CORS_ORIGINS` in the Railway Flask service
- Then re-deploy the Railway services so the change takes effect

## 5. Custom domain (optional, free on Vercel)

- **Settings → Domains** → add your domain
- Update DNS as shown (Vercel auto-issues HTTPS)

## 6. SPA routing

`vercel.json` includes a `rewrites` rule that sends all routes to `index.html` so React Router works on direct URL hits and on page refresh. **No action needed** — already configured.

## 7. Common pitfalls

| Symptom | Cause | Fix |
|---|---|---|
| 404 on `/courses/123` | Rewrite rule missing | Already in `vercel.json`, re-check after `git pull` |
| `VITE_API_URL is undefined` at runtime | Set env var but didn't redeploy | Vercel → Deployments → ⋯ → Redeploy |
| Build fails on `tsc -b` | Type error in code | Run `npm run build` locally first |
| Slow first load | Vite tree-shaking huge chunks | See Vite docs on `manualChunks` (optional) |
