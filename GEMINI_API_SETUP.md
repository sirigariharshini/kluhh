# Vivitsu Gemini API Setup Guide

## ✅ Current Status
- **API Key**: Configured in `.env`
- **API Key Value**: `AIzaSyD1CFeaYHUMsm9gqN676OwWTjR-vWLl6Bw`

## 🧪 Testing the Connection

### Option 1: Using Browser (Easiest)
1. Make sure backend is running:
   ```bash
   npm start
   ```

2. Open in browser:
   ```
   http://localhost:5000/api/test-gemini
   ```

3. You should see:
   ```json
   {
     "success": true,
     "message": "Gemini API is working correctly",
     "response": "Vivitsu API working!",
     "model": "gemini-1.5-pro"
   }
   ```

### Option 2: Using Terminal (cURL)
```bash
curl http://localhost:5000/api/test-gemini
```

### Option 3: Check Health Status
```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "status": "ok",
  "server": "Vivitsu Medical AI Backend",
  "geminiApiConfigured": true,
  "geminiApiKey": "AIzaSyD1...",
  "mongodbConnected": true,
  "environment": "development"
}
```

## 🔧 Common Issues & Solutions

### ❌ Error: "GEMINI_API_KEY not configured"
**Solution**: Check `.env` file has:
```
GEMINI_API_KEY=AIzaSyD1CFeaYHUMsm9gqN676OwWTjR-vWLl6Bw
```

### ❌ Error: "Invalid API Key"
**Solution**: The key might be:
- Expired
- Revoked from Google Cloud Console
- Incorrect format

**Fix**:
1. Go to https://console.cloud.google.com/
2. Create a new API key
3. Update `.env` file with new key
4. Restart backend: `npm start`

### ❌ Error: "Model not found (404)"
**Reason**: Using outdated model name
**Solution**: Backend tries models in order:
1. `gemini-1.5-pro` (latest, default)
2. `gemini-1.5-flash` (fastest)
3. `gemini-pro` (fallback)

If all fail, the model might be disabled in your Google Cloud project.

### ❌ Error: "API Quota Exceeded"
**Solution**: 
- Check Google Cloud Console for quota limits
- Upgrade API plan if needed
- Wait for rate limit reset

## 🚀 Verifying Chatbot Works

### In Frontend:
1. Open Chat Assistant tab
2. Type a message: "Hello"
3. Should get AI response within 3-5 seconds

### Expected Success Flow:
```
Frontend → Backend (/api/chat/message) → Gemini API
          ↓
     Parse response
          ↓
      Return to Frontend
```

## 📊 Backend Logs to Check

When you run `npm start`, look for:
```
🚀 Server running on http://localhost:5000
🤖 AI Model: Gemini Pro
🔑 Gemini API: ✅ Configured
💾 Database: MongoDB
🏥 Medical Analysis: http://localhost:5000/api/medical/analyze
🧪 Test Connection: http://localhost:5000/api/test-gemini
```

## 🆘 Emergency Fixes

### 1. Clear Cache & Reinstall
```bash
rm -rf node_modules package-lock.json
npm install
npm start
```

### 2. Use Different Model
Edit `backend/index.js` line 347, change order of models:
```javascript
const modelNames = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro'];
```

### 3. Test Specific Model
```bash
curl -X POST http://localhost:5000/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "text": "Hello"}],
    "medicalReports": []
  }'
```

## ✨ ChatBot Features (Once Working)

- ✅ Medical context from uploaded reports
- ✅ Personalized responses
- ✅ Diet planning
- ✅ Health insights
- ✅ Error recovery

## 📞 Need Help?

1. Check backend logs: `npm start` output
2. Test API: `http://localhost:5000/api/test-gemini`
3. Check .env file exists and has API key
4. Verify Google Cloud project has Generative AI API enabled

---
**Last Updated**: 2026-02-27
**Status**: All systems configured ✅
