# Quick Reference Guide

Fast lookup guide for common commands and information.

## 🚀 Start Development (90 seconds)

```bash
# Terminal 1 - Backend
cd backend
npm run dev
# ✅ Runs on http://localhost:5000

# Terminal 2 - Frontend
cd CardiiiiX
npm run dev
# ✅ Runs on http://localhost:3003
```

## 📍 URLs & Endpoints

### Local Development
| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | http://localhost:3003 | React app |
| Backend | http://localhost:5000 | Express API |
| Backend Health | http://localhost:5000/health | API status |
| Supabase | https://app.supabase.com | Database management |
| Gemini | https://ai.google.dev | API key management |

### API Endpoints Format
```
http://localhost:5000/api/[resource]/[action]

Examples:
POST   http://localhost:5000/api/auth/signup
POST   http://localhost:5000/api/chats
POST   http://localhost:5000/api/chats/123/messages
POST   http://localhost:5000/api/reports/upload
POST   http://localhost:5000/api/health
```

## 🔑 Environment Variables

### Backend (`backend/.env`)
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=key_starts_with_eyJ
SUPABASE_SERVICE_KEY=key_long_secret
GEMINI_API_KEY=AIzaSy...
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3003
```

### Frontend (`CardiiiiX/.env`)
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_KEY=key_starts_with_eyJ
VITE_API_URL=http://localhost:5000/api
```

## 📦 Installation Commands

```bash
# Install backend
cd backend
npm install

# Install frontend  
cd CardiiiiX
npm install

# Install specific package
npm install package-name

# Install dev dependencies only
npm install -D package-name
```

## 🏗️ Build Commands

```bash
# Frontend
cd CardiiiiX
npm run build      # Production build → dist/
npm run preview    # Preview optimized build

# Backend
cd backend
npm run build      # Compile TS to dist/
npm start          # Run compiled code
npm run dev        # Run with ts-node
```

## 🗄️ Database Setup

```bash
# 1. Create Supabase project
# 2. Go to SQL Editor
# 3. New Query
# 4. Paste backend/setup.sql
# 5. Click "Execute"
# ✅ All 7 tables created with RLS
```

## 🧪 Testing APIs

### Health Check
```bash
curl http://localhost:5000/health
```

### Signup
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"secure123","fullName":"Test User"}'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"secure123"}'
```

### Send Chat Message (replace TOKEN with actual JWT)
```bash
curl -X POST http://localhost:5000/api/chats/[CHAT_ID]/messages \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content":"What are normal blood pressure ranges?","medical_context":"Patient with hypertension"}'
```

## 📝 File Locations

### Most Important Files
```
backend/setup.sql              ← Database schema (import to Supabase first!)
backend/.env                   ← Credentials (keep secret!)
backend/server.ts              ← Express app
backend/routes/                ← API endpoints
backend/services/              ← Business logic

CardiiiiX/.env                 ← Frontend config
CardiiiiX/services/apiClient.ts ← Backend communication
CardiiiiX/components/          ← React components
```

## 🔄 Project Structure

```
vivitsu-2.0/
├── backend/
│   ├── config/         environment & Supabase setup
│   ├── middleware/     JWT auth & error handling
│   ├── services/       business logic
│   ├── routes/         API endpoints
│   ├── utils/          validation & logging
│   ├── server.ts       Express app
│   ├── setup.sql       DATABASE SCHEMA
│   └── .env            CREDENTIALS
│
└── CardiiiiX/
    ├── components/     React UI
    ├── services/       API client & Supabase
    ├── context/        Auth state
    └── .env            FRONTEND CONFIG
```

## 🐛 Common Issues & Fixes

### Port Already in Use
```bash
# Find process on port 5000
lsof -i :5000

# Kill it
kill -9 [PID]

# Or use different port
PORT=5001 npm run dev
```

### Module Not Found
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Supabase Connection Failed
```bash
# Verify .env has correct values
# Check format: URL should be https://xxx.supabase.co
# Check key length (should be long string)
# Verify RLS policies aren't blocking access
```

### CORS Error
```bash
# Backend logs should show exact error
# Update FRONTEND_URL in backend/.env to match frontend URL
# Restart backend
# Clear browser cache (Ctrl+Shift+Delete)
```

## 📊 Database Tables Quick Reference

| Table | Rows | Key Columns |
|-------|------|-------------|
| users | ~10s | id, email, role |
| chats | ~100s | id, user_id, title |
| messages | ~1000s | id, chat_id, role, content |
| medical_reports | ~100s | id, user_id, title, risk_score |
| health_metrics | ~1000s | id, user_id, heart_rate, oxygen_level |
| risk_assessments | ~100s | id, user_id, score, level |
| audit_logs | ~10000s | id, event, user_id |

## 📞 Getting Help

### Check Documentation
1. [README.md](README.md) - Project overview
2. [backend/README.md](backend/README.md) - API docs
3. [FRONTEND_INTEGRATION.md](FRONTEND_INTEGRATION.md) - Frontend patterns
4. [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - Production setup

### Debug Output
```bash
# Frontend errors
# → Open browser DevTools (F12)
# → Check Console tab for errors
# → Check Network tab for API calls

# Backend errors
# → Check terminal output
# → Look for [ERROR] in logs
# → Check request format
```

## 🎯 Core Concepts

### Authentication Flow
User logs in → Supabase creates JWT → Frontend stores token → Frontend sends token with each request → Backend verifies token with Jose + Supabase secret

### Chat Flow
User sends message → Backend saves to DB → Gemini API generates response → Response saved to DB → Sent back to frontend → Both displayed

### Report Flow
User uploads file → OCR extracts text → Medical processing parses data → Gemini analyzes → Risk scored → Saved to DB + frontend

### API Response Format
```json
{
  "data": { /* success response */ },
  "error": null,
  "statusCode": 200
}
```

OR on error:
```json
{
  "data": null,
  "error": "Error message here",
  "statusCode": 400
}
```

## 🚀 Deployment Checklist

- [ ] Database schema imported to Supabase
- [ ] Backend .env configured with credentials
- [ ] Frontend .env configured with URLs
- [ ] `npm run dev` works locally
- [ ] All endpoints tested with cURL
- [ ] No console errors
- [ ] Frontend can signup/login
- [ ] Chat works end-to-end
- [ ] Reports can upload
- [ ] Health metrics display
- [ ] Ready for production

## 📋 API Response Examples

### Success Response (201 Created)
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "title": "My Chat",
  "created_at": "2024-01-10T12:00:00Z"
}
```

### Error Response (400 Bad Request)
```json
{
  "error": "Content required - must be 1-5000 characters"
}
```

### Auth Required Response (401 Unauthorized)
```json
{
  "error": "No authorization token"
}
```

## 💾 Useful NPM Commands

```bash
npm run dev                    # Start dev server
npm run build                  # Production build
npm start                      # Run compiled code
npm install package-name       # Add dependency
npm uninstall package-name     # Remove dependency
npm list                       # Show installed packages
npm outdated                   # Check for updates
npm update                     # Update packages
npx ts-node file.ts            # Run TS file directly
```

## 🔐 Security Reminders

⚠️ **Never commit .env files!**
- Use .env.example for template
- Keep credentials private
- Rotate keys periodically

⚠️ **Backend endpoints are publicly accessible**
- RLS protects database at table level
- JWT protects at API level
- Validate all inputs

⚠️ **Medical data is sensitive**
- Implement audit logging (already done)
- Encrypt at rest with Supabase
- Use HTTPS in production

## 📚 Key Files to Know

| File | Purpose | Edit? |
|------|---------|-------|
| backend/setup.sql | Database creation | ❌ Use as-is |
| backend/.env | Credentials | ✏️ Add your values |
| CardiiiiX/.env | Frontend config | ✏️ Add your values |
| backend/server.ts | Express setup | ⚠️ Handle with care |
| backend/routes/ | API endpoints | ✏️ Customize endpoints |
| CardiiiiX/services/apiClient.ts | API client | ⚠️ Core logic |

## ⏱️ Time Estimates

| Task | Time |
|------|------|
| Supabase project setup | 5 min |
| Database schema import | 2 min |
| Backend installation | 3 min |
| Frontend installation | 3 min |
| Credentials configuration | 5 min |
| Start both dev servers | 1 min |
| End-to-end testing | 15 min |
| **Total Setup Time** | **~34 min** |

## 🎓 Learning Path

**Day 1**: Setup
- Create Supabase account
- Import database schema
- Install & start servers
- Verify everything works

**Day 2**: API Testing
- Test endpoints with cURL
- Review API response formats
- Check database entries
- Understand auth flow

**Day 3**: Frontend Integration
- Login via frontend
- Send chat message
- Upload medical report
- Add health metrics

**Day 4**: Customization
- Modify UI components
- Add custom API endpoints
- Integrate with external services
- Deploy to production

---

## ⚡ Pro Tips

1. **Keep terminals organized** - Open 3 terminals side-by-side (backend, frontend, notes)
2. **Use browser DevTools** - F12 for frontend debugging
3. **Check logs first** - Any error? Look in terminal first
4. **Test incrementally** - Start with API, then frontend
5. **Save frequently** - Files auto-save but commits matter
6. **Read error messages** - They explicitly say what's wrong!

---

**Last Updated**: January 2024  
**For detailed info**: See main README.md
