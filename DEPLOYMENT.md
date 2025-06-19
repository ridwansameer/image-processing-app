# Deployment Guide

## Quick Deploy (Recommended)

### Backend - Railway
1. Push code to GitHub
2. Connect Railway to your repo
3. Set root directory to `/`
4. Railway auto-detects Python (uv) and Node.js
5. Set start command: `cd backend && npm start`

### Frontend - Vercel
1. Import project from GitHub
2. Set root directory to `frontend`
3. Add environment variable:
   - `VITE_API_BASE` = `https://your-railway-backend.up.railway.app/api`

## Alternative: Docker (All-in-one)

Create `Dockerfile` in root:
```dockerfile
FROM node:20-alpine
RUN apk add --no-cache python3 py3-pip
WORKDIR /app
COPY . .
RUN cd backend && npm install
RUN pip install uv && uv sync
EXPOSE 3000
CMD ["node", "backend/server.js"]
```

Deploy to:
- Fly.io
- Google Cloud Run
- AWS App Runner

## Environment Variables

Backend:
- `PORT` (defaults to 3000)

Frontend:
- `VITE_API_BASE` (backend URL)