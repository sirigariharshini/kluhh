# Production Deployment & Setup Guide

Complete end-to-end guide for deploying and running the AI Medical Assistant.

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (CardiiiiX)                 │
│              React 19 + Vite + TypeScript               │
│         Port 3003 (Dev) / Vercel (Production)          │
└──────────────────────────┬──────────────────────────────┘
                           │ REST API
                           ↓
┌─────────────────────────────────────────────────────────┐
│              Backend API (Node/Express)                 │
│         TypeScript + Supabase + Gemini API              │
│         Port 5000 (Dev) / Vercel (Production)          │
└──────────────────────────┬──────────────────────────────┘
                           │ SQL
                           ↓
┌─────────────────────────────────────────────────────────┐
│        Supabase (PostgreSQL + Auth + Storage)           │
│     Row-Level Security (RLS) enabled for privacy        │
└─────────────────────────────────────────────────────────┘
                           │
             ┌─────────────┼─────────────┐
             ↓             ↓             ↓
    ┌─────────────┐ ┌──────────┐ ┌──────────────┐
    │ Supabase    │ │  Google  │ │  File        │
    │ PostgreSQL  │ │  Gemini  │ │  Storage     │
    └─────────────┘ └──────────┘ └──────────────┘
```

## Prerequisites

- Node.js 18+
- PostgreSQL (via Supabase)
- Supabase account
- Google Gemini API key
- Git

## Step 1: Supabase Setup

### 1.1 Create Supabase Project

1. Go to https://supabase.com
2. Sign up / Log in
3. Create new project
4. Wait for database to initialize
5. Go to Project Settings → API Keys
6. Copy:
   - Project URL
   - Public (Anon) Key
   - Service Role Key (keep secret)

### 1.2 Import Database Schema

1. In Supabase dashboard → SQL Editor
2. Create new query
3. Copy contents of `backend/setup.sql`
4. Execute
5. Verify all 7 tables created:
   - `auth.users` (managed by Supabase)
   - `users` (custom table with user metadata)
   - `chats` (conversation threads)
   - `messages` (chat history)
   - `medical_reports` (uploaded documents)
   - `health_metrics` (vital signs)
   - `risk_assessments` (AI risk scores)
   - `audit_logs` (compliance)

### 1.3 Enable RLS (Row-Level Security)

Verify all tables have RLS enabled:

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = false;
```

Should return empty (all RLS enabled).

## Step 2: Google Gemini API Setup

### 2.1 Enable API

1. Go to https://ai.google.dev/
2. Click "Get API Key"
3. Create new API key in Google Cloud Console
4. Copy key to `.env`

### 2.2 Verify API Access

```bash
curl -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"contents":[{"parts":[{"text":"Hello"}]}]}'
```

Should return successful response.

## Step 3: Backend Setup

### 3.1 Initialize Backend

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cat > .env << EOF
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
GEMINI_API_KEY=your-gemini-key
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3003
EOF

# Test Supabase connection
npm run dev
```

### 3.2 Verify Backend Health

Open in browser or curl:
```bash
curl http://localhost:5000/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-10T12:00:00Z",
  "uptime": 5.234
}
```

## Step 4: Frontend Setup

### 4.1 Initialize Frontend

```bash
cd CardiiiiX

# Install dependencies (if not done)
npm install

# Create/update .env
cat > .env << EOF
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_KEY=your-anon-key
VITE_API_URL=http://localhost:5000/api
EOF

# Start dev server
npm run dev
```

### 4.2 Verify Frontend

Open http://localhost:3003 in browser

Should see:
- ✅ Dashboard components loading
- ✅ Health metrics displayed
- ✅ No console errors

## Step 5: Test Complete Flow

### 5.1 Authentication

1. Navigate to login page
2. Create account: test@example.com / password123
3. Should redirect to dashboard

### 5.2 Chat

1. Click "Chat Assistant" or "Chats"
2. Create new chat
3. Send message: "What are normal blood pressure ranges?"
4. AI should respond with medical information

### 5.3 Report Upload

1. Go to "Reports" or "ReportAnalyzer"
2. Click "Upload Report"
3. Upload a PDF or image with medical data
4. Wait for OCR and AI analysis
5. View extracted data and risk score

### 5.4 Health Metrics

1. Go to Dashboard
2. Click "Add Reading" or similar
3. Enter vitals: HR 72, SpO2 98%
4. Data should display in chart

## Production Deployment

### Option A: Vercel (Recommended)

#### Frontend Deployment

1. Push repository to GitHub
2. Go to https://vercel.com
3. Import `CardiiiiX` folder
4. Set environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_KEY`
   - `VITE_API_URL` (production backend URL)
5. Deploy

#### Backend Deployment

1. Create new Vercel project for `backend`
2. Set environment variables (all from .env)
3. Deploy
4. Update frontend `VITE_API_URL` with production URL

### Option B: Docker + Cloud Run (Google Cloud)

#### Build Docker Image

```dockerfile
# backend/Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
CMD ["node", "dist/server.js"]
```

Build:
```bash
docker build -t medical-assistant-backend .
```

Deploy to Google Cloud Run:
```bash
gcloud run deploy medical-assistant-backend \
  --source . \
  --platform managed \
  --region us-central1 \
  --set-env-vars=SUPABASE_URL=...,GEMINI_API_KEY=...
```

### Option C: Self-Hosted (VPS)

1. SSH into VPS
2. Clone repository
3. Install Node.js + npm
4. Create `.env` file
5. Run:
   ```bash
   npm install
   npm run build
   npm start
   ```
6. Use PM2 for process management:
   ```bash
   npm install -g pm2
   pm2 start dist/server.js --name "medical-assistant"
   pm2 save
   ```

## Configuration Checklists

### Development Environment

- [ ] Node.js 18+ installed
- [ ] Supabase project created
- [ ] Database schema imported
- [ ] Gemini API key obtained
- [ ] Backend `.env` file created
- [ ] Frontend `.env` file created
- [ ] `npm install` completed in both folders
- [ ] `npm run dev` working without errors
- [ ] http://localhost:3003 accessible
- [ ] http://localhost:5000/health returns OK

### Production Environment

- [ ] SSL/TLS certificates enabled
- [ ] CORS properly configured
- [ ] Rate limiting enabled (if using)
- [ ] Monitoring/alerting setup
- [ ] Automated backups configured
- [ ] Error logging (Sentry/similar)
- [ ] All credentials in production .env
- [ ] Database backups tested
- [ ] HIPAA compliance verified (if needed)
- [ ] Security audit completed

## Environment Variables Reference

| Variable | Dev Value | Prod Configuration |
|----------|-----------|-------------------|
| SUPABASE_URL | Local | From Supabase |
| SUPABASE_ANON_KEY | Dev key | Prod key |
| SUPABASE_SERVICE_KEY | Dev key | Rotate quarterly |
| GEMINI_API_KEY | Test key | Prod key with quota |
| PORT | 5000 | 8080 or dynamic |
| NODE_ENV | development | production |
| FRONTEND_URL | http://localhost:3003 | https://app.yourdomain.com |
| VITE_API_URL | http://localhost:5000/api | https://api.yourdomain.com/api |

## Monitoring & Maintenance

### Health Checks

Daily:
```bash
curl https://api.yourdomain.com/health
```

### Database Maintenance

Weekly:
```sql
-- Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) 
FROM pg_tables 
WHERE schemaname = 'public';
```

### Log Rotation

Configure log rotation in production:
```bash
# /etc/logrotate.d/medical-assistant
/var/log/medical-assistant/*.log {
  daily
  rotate 14
  compress
  delaycompress
  compress
}
```

### Backup Strategy

Daily backups:
```bash
# Supabase automatically backs up to 30-day retention
# Additionally, export weekly via:
pg_dump postgresql://user:pass@db.supabase.co/postgres > backup_$(date +%Y%m%d).sql
```

## Troubleshooting

### Database Connection Failed

1. Verify Supabase credentials
2. Check IP whitelist in Supabase
3. Verify RLS policies don't block access
4. Check service role key permissions

### Gemini API Errors

1. Verify API key in .env
2. Check API quota in Google Cloud Console
3. Ensure API is enabled
4. Check request format matches latest API version

### CORS Issues

1. Verify FRONTEND_URL in backend .env
2. Browser should show specific CORS error
3. Update CORS whitelist in `server.ts`

### JWT Token Expired

1. Implement token refresh logic in frontend
2. Use `apiClient.setToken()` with new token
3. Supabase handles automatic refresh

### High Database Latency

1. Check query performance in Supabase dashboard
2. Verify indexes are being used
3. Consider caching frequently accessed data
4. Increase database compute if needed

## Performance Optimization

### Caching Strategy

```typescript
// Frontend cache
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const getCachedData = async (key, fetcher) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.time < CACHE_DURATION) {
    return cached.data;
  }
  const data = await fetcher();
  cache.set(key, { data, time: Date.now() });
  return data;
};
```

### Database Optimization

```sql
-- Add indexes for common queries
CREATE INDEX CONCURRENTLY idx_messages_chat_id ON messages(chat_id);
CREATE INDEX CONCURRENTLY idx_health_metrics_user_id ON health_metrics(user_id);
CREATE INDEX CONCURRENTLY idx_reports_risk_score ON medical_reports(risk_score);

-- Analyze query plans
EXPLAIN ANALYZE SELECT * FROM messages WHERE chat_id = 'uuid';
```

### API Rate Limiting

Implement in production backend:
```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30, // 30 requests per minute
  message: 'Too many requests'
});

app.use('/api/', limiter);
```

## Support & Resources

- **Backend Docs**: [backend/README.md](../backend/README.md)
- **Frontend Docs**: [FRONTEND_INTEGRATION.md](./FRONTEND_INTEGRATION.md)
- **Supabase**: https://supabase.com/docs
- **Gemini API**: https://ai.google.dev/docs
- **Express**: https://expressjs.com/
- **TypeScript**: https://www.typescriptlang.org/docs/

## License

ISC

---

**Last Updated**: January 2024
**Version**: 1.0.0
