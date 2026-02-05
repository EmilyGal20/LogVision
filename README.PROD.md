# LOG VISION — Production Deployment Guide

This document describes how to prepare, build, and deploy LOG VISION to a production environment.

It assumes a standard separation between **frontend (React)** and **backend (FastAPI)**.

---

## 🧱 Production Overview

LOG VISION consists of:
- Frontend: React (static build)
- Backend: FastAPI (ASGI)
- Deployment-ready architecture (frontend served separately or via reverse proxy)

---

## ⚙️ Requirements (Production Server)

### System
- Linux server (recommended: Ubuntu 20.04+)
- Git
- Node.js 18+
- Python 3.10+
- Reverse proxy (Nginx recommended)

---

## 📦 Backend — Production Setup (FastAPI)

### 1. Clone repository
```bash
git clone <repo-url>
cd backend
2. Create virtual environment
python3 -m venv .venv
source .venv/bin/activate
3. Install dependencies
pip install -r requirements.txt
4. Environment variables
Create .env (DO NOT COMMIT):

ENV=production
Load env vars using your preferred method (dotenv, systemd, etc).

5. Run backend (production-safe)
⚠️ Do not use --reload in production

python -m uvicorn app:app --host 0.0.0.0 --port 8000
Recommended (better):

gunicorn -k uvicorn.workers.UvicornWorker app:app --bind 0.0.0.0:8000
6. Backend health check
curl http://localhost:8000/docs
🎨 Frontend — Production Build (React)
1. Navigate to frontend
cd frontend
2. Install dependencies
npm install
3. Build for production
npm run build
This creates:

frontend/build/
🌐 Serving the Frontend
Option 1 — Nginx (Recommended)
Example Nginx config:

server {
    listen 80;
    server_name your-domain.com;

    root /var/www/logvision/frontend/build;
    index index.html;

    location / {
        try_files $uri /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
Restart Nginx:

sudo systemctl restart nginx
Option 2 — Separate Domains
Frontend: https://app.logvision.com

Backend: https://api.logvision.com

Ensure CORS is configured correctly in backend.

🔐 Security Checklist
❌ Never commit .env

❌ Never expose internal ports publicly

✅ Use HTTPS

✅ Run backend behind reverse proxy

✅ Disable debug / reload modes

✅ Lock down admin routes if applicable

🧪 Production Validation Checklist
 Frontend loads correctly

 API reachable

 Authentication works

 Protected routes enforced

 Loader animations work

 Dark/Light theme syncs

 Logs load without errors

 Real-time views stable

🔄 Updating Production
Pull updates
git pull origin main
Backend
pip install -r requirements.txt
systemctl restart logvision-backend
Frontend
npm run build
sudo systemctl reload nginx
🧯 Rollback (Emergency)
git log --oneline
git checkout <previous-commit>
Rebuild frontend + restart backend.

🖤 Final Notes
LOG VISION is designed for:

Long-running sessions

Operational dashboards

Enterprise environments

Keep production clean, minimal, and observable.

© LOG VISION
See What Matters · Master Your Systems