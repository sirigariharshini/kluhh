# 🔧 Vivitsu Chatbot - Troubleshooting Guide

## ❌ Error: "Failed to fetch" / "Connection Error: Backend server is not running"

### ✅ Quick Fix (3 Steps)

#### Step 1: Start Backend Server
```bash
cd backend
npm start
```

Expected output:
```
🚀 Server running on http://localhost:5000
🔑 Gemini API: ✅ Configured
```

#### Step 2: Check .env Files
**Backend** (`backend/.env`):
```
PORT=5000
GEMINI_API_KEY=AIzaSyD1CFeaYHUMsm9gqN676OwWTjR-vWLl6Bw
REACT_APP_API_URL=http://localhost:5000/api
```

#### Step 3: Refresh Browser
- Frontend: `http://localhost:5173`
- Open ChatAssistant component
- Try sending a message

---

## 📋 Verification Checklist

### Backend Running?
```bash
# Open new terminal and test:
curl http://localhost:5000/api/health
```
Should return: `{"status":"ok"...}`

### API Key Valid?
```bash
curl http://localhost:5000/api/test-gemini
```
Should return: `{"success":true, "message":"Gemini API is working correctly"...}`

### Frontend Connecting?
Check browser console (F12):
- Should see: `🔌 API Base URL: http://localhost:5000/api`
- Should see: `📨 Sending chat request to backend...`

---

## 🔍 Common Issues & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `Failed to fetch` | Backend not running | `cd backend && npm start` |
| `Connection refused` | Wrong port (5004 instead of 5000) | Update `.env` REACT_APP_API_URL |
| `API is not configured` | Missing GEMINI_API_KEY | Add key to `backend/.env` |
| `CORS Error` | CORS not configured | Restart backend |
| `404 Not Found` | Backend routing issue | Check `backend/index.js` endpoints |

---

## 🚀 Full Startup Procedure

### Terminal 1 - Backend
```bash
cd CardiiiiX
cd backend
npm start
```

### Terminal 2 - Frontend (Keep backend running!)
```bash
cd CardiiiiX
npm run dev
```

### Browser
```
http://localhost:5173
```

---

## 📊 How to Read Logs

### Backend Console Should Show:
```
🚀 Server running on http://localhost:5000
🔑 Gemini API: ✅ Configured
💾 Database: MongoDB
📨 Chat Request Received
🤖 Trying model: gemini-1.5-pro
✅ Gemini Response Received
```

### Browser Console (F12) Should Show:
```
🔌 API Base URL: http://localhost:5000/api
📥 Fetching medical reports from: http://localhost:5000/api/medical/reports
📨 Sending chat request to backend...
✅ Chat response received
```

---

## 🆘 Still Not Working?

### Step 1: Kill All Processes
```bash
# Windows PowerShell
taskkill /F /IM node.exe
```

### Step 2: Clear Node Modules (Restart)
```bash
cd backend
npm install
npm start
```

### Step 3: Check Ports
```bash
# Check what's using port 5000 (Windows)
netstat -ano | findstr :5000
```

### Step 4: Try Different Port
Edit `backend/.env`:
```
PORT=5001
REACT_APP_API_URL=http://localhost:5001/api
```

Then restart both backend and frontend.

---

## ✨ Success Signs

When chatbot is working:
- ✅ Backend shows: `📨 Chat Request Received`
- ✅ Browser logs show: `✅ Chat response received`
- ✅ AI responds within 3-5 seconds
- ✅ No errors in browser console (F12)

---

## 📞 Debug Commands

### Test Backend Health
```bash
curl http://localhost:5000/api/health
```

### Test Gemini API
```bash
curl http://localhost:5000/api/test-gemini
```

### Test Chat Endpoint
```bash
curl -X POST http://localhost:5000/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","text":"Hello"}],"medicalReports":[]}'
```

### View Backend Logs
Keep backend terminal visible and watch for errors in real-time.

---

## 🎯 Expected Behavior

1. **User types message** → "Hello, how are you?"
2. **Frontend sends** → POST /api/chat/message
3. **Backend receives** → Logs show "📨 Chat Request Received"
4. **Backend calls Gemini** → Logs show "🤖 Trying model: gemini-1.5-pro"
5. **Gemini responds** → Logs show "✅ Gemini Response Received"
6. **Backend returns** → JSON with `{"success":true,"response":"..."}`
7. **Frontend displays** → AI message in chat

---

**Last Updated**: 2026-02-27
**Status**: Chatbot Ready ✅
