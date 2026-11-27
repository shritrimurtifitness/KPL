# Free-Tier Production Deployment Guide

This guide covers deploying the **Cricket League Registration & Payment Platform** using 100% free-tier services:
- **Database & Storage**: Supabase Free Tier (PostgreSQL + Private Storage Bucket)
- **Backend**: Render Free Web Service (FastAPI + Python 3.12)
- **Frontend**: Cloudflare Pages (React + Vite + SPA rewrites)

---

## 1. Database & Storage: Supabase Free Tier

### Step A: Create a Supabase Project
1. Log in to [Supabase](https://supabase.com/) (free tier).
2. Create a new project, select a region closest to India (e.g. `ap-south-1` Mumbai or `ap-southeast-1` Singapore).
3. Set a strong database password and copy it.

### Step B: Obtain Connection Strings & API Keys
1. Navigate to **Project Settings** > **Database**:
   - Copy the **Connection String** (`URI`).
   - Format: `postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres` (or connection pooler port `6543`).
2. Navigate to **Project Settings** > **API**:
   - Copy **Project URL** (`https://[PROJECT-REF].supabase.co`).
   - Copy **Service Role Secret Key** (`service_role` key - keeps server-side uploads secure).

### Step C: Create Private Storage Bucket
1. Go to **Storage** in the Supabase Dashboard.
2. Click **New bucket**:
   - Name: `payment-proofs`
   - **Public bucket toggle**: **DISABLED (OFF)** (Private bucket).
3. Under Storage Policies, do not add public read policies. Only authenticated backend requests using the service role key can upload and read proofs.

---

## 2. Backend: Render Free Web Service

Render offers free web services that run Python applications with automatic TLS/HTTPS.

### Step A: Create Web Service on Render
1. Push your repository to GitHub.
2. Log in to [Render](https://render.com/).
3. Click **New +** > **Web Service** and connect your GitHub repository.
4. Configure service settings:
   - **Name**: `kpl-cricket-backend`
   - **Region**: Singapore or Frankfurt
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt && alembic upgrade head`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type**: `Free`

### Step B: Configure Environment Variables on Render
Under **Environment Variables**, add:
```ini
ENV=production
DEBUG=False
TIMEZONE=Asia/Kolkata
SECRET_KEY=[GENERATE_RANDOM_64_CHAR_KEY]
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres
BACKEND_CORS_ORIGINS=["https://your-frontend.pages.dev", "https://your-custom-domain.com"]
SUPABASE_URL=https://[PROJECT-REF].supabase.co
SUPABASE_SERVICE_ROLE_KEY=[YOUR_SUPABASE_SERVICE_ROLE_KEY]
SUPABASE_STORAGE_BUCKET=payment-proofs
INITIAL_ADMIN_EMAIL=admin@yourcricketleague.com
INITIAL_ADMIN_PASSWORD=[SECURE_ADMIN_PASSWORD]
INITIAL_ADMIN_NAME=Tournament Director
```

### Step C: Handling Render Free Tier Sleep / Cold Starts
- Render free instances spin down after 15 minutes of inactivity.
- First request after sleep may take ~30–50 seconds to boot.
- **Pre-Event Readiness**: 30 minutes before your public registration opens, open the backend health URL `https://your-backend.onrender.com/health` to pre-warm the instance.
- Alternatively, use a free uptime monitor (such as [UptimeRobot](https://uptimerobot.com/)) hitting `/health` every 10 minutes during the registration period.

---

## 3. Frontend: Cloudflare Pages

Cloudflare Pages provides global CDN, free bandwidth, fast static hosting, and instant SSL.

### Step A: Connect Cloudflare Pages
1. Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. Navigate to **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
3. Select your GitHub repository.
4. Set Build Settings:
   - **Framework preset**: `Vite`
   - **Root directory**: `frontend`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
5. In **Environment Variables**:
   - Variable name: `VITE_API_BASE_URL`
   - Value: `https://your-backend.onrender.com/api/v1`

### Step B: SPA Routing Rewrites
The project includes `frontend/public/_redirects`:
```
/*    /index.html   200
```
This automatically ensures React Router client-side routing works on hard page refreshes without 404 errors.

---

## 4. Custom Domain Setup (Optional)

1. **Frontend**: In Cloudflare Pages, go to **Custom domains** > enter `register.yourcricketleague.com` > Cloudflare handles DNS and SSL automatically.
2. **Backend**: In Render, go to **Settings** > **Custom Domains** > enter `api.yourcricketleague.com` > add CNAME record in your DNS provider.
3. Update `BACKEND_CORS_ORIGINS` on Render to include your custom domain.
