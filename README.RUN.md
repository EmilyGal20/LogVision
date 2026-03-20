# LOG VISION — Run & Development Guide

This document explains how to run, develop, and manage the LOG VISION application locally, including frontend, backend, and Git workflow.

---

## 📦 Prerequisites

Make sure the following are installed:

### System
- Git
- Node.js 18+
- npm
- Python 3.10+

---

## 📁 Project Structure (High Level)

project-root/
├── frontend/
│ ├── public/
│ ├── src/
│ └── package.json
│
├── backend/
│ ├── app.py
│ └── requirements.txt


---

## 🚀 Frontend — Run Instructions (React)

### 1. Navigate to frontend
```bash
cd frontend
2. Install dependencies (first time only)
npm install
3. Start development server
npm start
Frontend will be available at:

http://localhost:3000
Notes
Uses React + React Router

Page transitions include a full-screen animated loader

Branding assets (logo, favicon, loader) are served from public/

Hard refresh if favicon or loader does not update: Ctrl + Shift + R

🧠 Backend — Run Instructions (FastAPI)
1. Navigate to backend
cd backend
2. (Recommended) Create virtual environment
python -m venv .venv
3. Activate virtual environment
Windows (PowerShell):

.\.venv\Scripts\Activate.ps1
macOS / Linux:

source .venv/bin/activate
4. Install backend dependencies
pip install -r requirements.txt
5. Run backend server
python -m uvicorn app:app --reload --host 0.0.0.0 --port 8000
Backend will be available at:

----------------------
new run way:
npm run dev
----------------------
http://localhost:8000
Swagger API docs:

http://localhost:8000/docs
🔁 Running Frontend + Backend Together
Recommended workflow:

Backend on port 8000

Frontend on port 3000

Run both servers in separate terminals

🔐 Environment & Configuration
Frontend environment variables (if any):
frontend/.env

Backend environment variables (if any):
backend/.env

Never commit .env files to GitHub.

🧪 Development Workflow
Start work
git status
Create a new branch
git checkout -b feature/your-feature-name
Save work (commit)
git add .
git commit -m "Describe your change"
Push to GitHub
git push -u origin feature/your-feature-name
🔄 Restoring / Undoing Changes
Discard uncommitted changes
git restore .
Restore a single file
git restore path/to/file
View commit history
git log --oneline
Reset to last commit (⚠ destructive)
git reset --hard HEAD
🔀 Merging to Main Branch
git checkout main
git pull
git merge feature/your-feature-name
git push
After successful merge, optional cleanup:

git branch -d feature/your-feature-name
🧯 Common Issues & Fixes
Frontend not updating
Restart dev server

Hard refresh browser

Clear cache

Backend import errors
Verify virtual environment is active

Reinstall requirements

Port already in use
Stop previous server

Or change port explicitly

🖤 Notes
LOG VISION is designed as an enterprise-grade monitoring UI

Keep commits small and descriptive

Prefer feature branches over direct main commits


© LOG VISION  — Internal Development Guide
See What Matters · Master Your Systems
