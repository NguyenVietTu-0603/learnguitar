# Railway Deployment Guide - Environment Variables

This repo uses **one Railway project with 2 services** (Backend Express + Flask AI).

> Replace `<username>` with your GitHub username (e.g. `NguyenVietTu-0603`).
> Replace `<random-suffix>` with the URL Railway gives you (e.g. `learn-guitar-backend-production-7f1a.up.railway.app`).

## 0. Create the Railway project

1. Go to https://railway.app → **New Project** → **Deploy from GitHub repo**
2. Select `NguyenVietTu-0603/learnguitar`
3. Railway will create one service from the repo root. Rename it `learn-guitar-backend`.

## 1. Backend Express service (`learn-guitar-backend`)

### Root Directory
In service **Settings** → **Source** → **Root Directory**: `learn-guitar-backend`

### Variables (Settings → Variables)

| Variable | Production value | Notes |
|---|---|---|
| `NODE_ENV` | `production` | Disables verbose logging |
| `PORT` | leave blank | Railway injects this automatically |
| `MONGODB_URI` | `mongodb+srv://USER:PASS@cluster.mongodb.net/learn-guitar?retryWrites=true&w=majority` | Use MongoDB Atlas (free tier) |
| `JWT_SECRET` | click **Generate** | Strong random string |
| `JWT_EXPIRES_IN` | `7d` | |
| `CORS_ORIGIN` | `https://<your-vercel-domain>.vercel.app` | The deployed frontend URL — **update after Vercel deploys** |

### Add-ons (in Railway)
Click **+ New** → **Database** → **Add MongoDB** (or use Atlas URI above).
For caching, use **Upstash Redis** add-on and copy its `REDIS_URL` into `REDIS_URL` variable if your code reads it.

### Health check
Already configured in `railway.json` → `/api/v1/health` (200 = healthy).

---

## 2. Flask AI service (`Flask-AI-API`)

### Add a second service
In the same Railway project → **+ New** → **GitHub Repo** → select `learnguitar` again.

### Root Directory
In service **Settings** → **Source** → **Root Directory**: `Flask-AI-API`

### Variables

| Variable | Production value | Notes |
|---|---|---|
| `PORT` | leave blank | Railway injects this automatically |
| `FLASK_DEBUG` | `false` | |
| `APP_NAME` | `Flask AI API` | |
| `API_PREFIX` | `/api` | |
| `MODEL_PATH` | `./best.pt` | Default; LFS fetches real file at deploy |
| `CORS_ORIGINS` | `https://<your-vercel-domain>.vercel.app,https://<backend-url>.up.railway.app` | Frontend + backend both call this service |

### Resource planning
- This service runs **YOLOv8 inference** → CPU-heavy
- **Settings → Resources**: plan ≥ **4 vCPU / 8 GB RAM** (Hobby plan $5/mo gives 8 GB)
- Cold start ~30s while ultralytics loads the model

### Health check
Default Railway HTTP check on `/health` (defined in `routes/health_bp`).

---

## 3. Wire the URLs back into the frontend

After both services deploy, copy:
- `BACKEND_URL` from service 1 (something like `https://learn-guitar-backend-production-xxxx.up.railway.app`)
- `FLASK_URL` from service 2 (something like `https://flask-ai-api-production-xxxx.up.railway.app`)

Then go to Vercel → set:
- `VITE_API_URL` = `https://<BACKEND_URL>/api/v1`
- `VITE_TAB_API_URL` = `https://<FLASK_URL>`

Re-deploy Vercel. The frontend will now hit the Railway services.

---

## 4. Domain (optional, paid)

- **Custom domain** on Railway: Settings → Networking → **Custom Domain**
- **HTTPS** is automatic via Let's Encrypt

---

## 5. Common pitfalls

| Symptom | Cause | Fix |
|---|---|---|
| Backend logs `MongooseServerSelectionError` | Wrong `MONGODB_URI` or IP not whitelisted | Atlas → Network Access → Add `0.0.0.0/0` |
| Frontend sees `Network Error` | `CORS_ORIGIN` not set to Vercel URL | Update the variable, restart service |
| Flask service OOM-killed | Plan too small | Upgrade to ≥ 4 GB RAM |
| `best.pt not found` on Flask | LFS didn't fetch | Check Railway build log: must see `Git LFS smudge` line |
| Cold start > 1 min | First request loads YOLO weights | Acceptable; consider `always-on` toggle in service settings |
