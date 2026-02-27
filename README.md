# Vivitsu 2.0 - AI Medical Assistant

A production-grade AI-powered medical assistant that leverages Gemini API for intelligent medical analysis, Supabase for secure data management, and combines modern web technologies for a seamless user experience.

## 🎯 Features

### Core Features
- **AI-Powered Chat**: Context-aware medical conversations with Gemini 1.5 Pro
- **Document Analysis**: OCR-enabled medical report analysis with AI insights
- **Health Tracking**: Track vital signs with real-time dashboards
- **Medical Insights**: Lab value analysis, abnormality detection, risk scoring
- **Secure Authentication**: Supabase Auth with JWT verification
- **Real-Time Updates**: Live health metrics and chat updates

### Security & Compliance
- **End-to-End Encryption**: SSL/TLS throughout
- **Row-Level Security (RLS)**: Database-level data privacy
- **HIPAA-Ready**: Audit logging for compliance
- **Input Validation**: Zod schemas for all API inputs
- **Rate Limiting**: Prevent abuse and DDoS

### AI Capabilities
- **Natural Language Processing**: Understand medical queries
- **Risk Assessment**: Automated risk scoring (0-100)
- **Medication Analysis**: Extract and track medications
- **Symptom Analysis**: Parse symptoms and conditions
- **Lab Value Parsing**: Auto-detect and validate medical measurements

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Frontend (React 19)                   │
│          TypeScript + Vite + TailwindCSS                │
│                    Port 3003                            │
└──────────────────────────┬──────────────────────────────┘
                           │ HTTP/REST
                           ↓
┌─────────────────────────────────────────────────────────┐
│              Backend (Node.js + Express)                │
│         TypeScript + Zod + Logger                       │
│                    Port 5000                            │
└──────────────────────────┬──────────────────────────────┘
                           │ SQL/Realtime
                           ↓
┌─────────────────────────────────────────────────────────┐
│          Supabase (PostgreSQL + Auth + Storage)         │
│            RLS Policies • Audit Logging                 │
└───────────┬──────────────────────────────┬──────────────┘
            │                              │
            ↓                              ↓
    ┌───────────────┐            ┌──────────────────┐
    │ Google Gemini │            │ Document Storage │
    │   1.5 Pro     │            │  (File Upload)   │
    └───────────────┘            └──────────────────┘
```

## 📋 Tech Stack

### Frontend
- **React 19.2.3** - UI framework
- **Vite 6.4.1** - Build tool with HMR
- **TypeScript 5.x** - Type safety
- **TailwindCSS** - Styling
- **Recharts** - Data visualization
- **Supabase Client** - Database/auth
- **Lucide Icons** - UI icons

### Backend
- **Node.js 18+** - Runtime
- **Express 5.2.1** - Web framework
- **TypeScript 5.4** - Type safety
- **Supabase** - Database/auth
- **Jose** - JWT verification
- **Zod** - Schema validation
- **Multer** - File uploads
- **Google Gemini API** - AI processing

### Database
- **PostgreSQL** (via Supabase)
- **Supabase Auth** - User authentication
- **RLS Policies** - Row-level security
- **Real-time Subscriptions** - Live updates

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Supabase account (free tier available)
- Google Gemini API key

### Development Setup

1. **Clone & Install**
   ```bash
   git clone <repo-url>
   cd vivitsu-2.0
   
   # Frontend
   cd CardiiiiX
   npm install
   
   # Backend
   cd ../backend
   npm install
   ```

2. **Configure Supabase**
   ```bash
   cd backend
   
   # Create .env
   cp .env.example .env
   
   # Edit with your Supabase credentials
   nano .env
   ```

3. **Setup Database**
   - Go to Supabase → SQL Editor
   - Create new query
   - Paste `backend/setup.sql`
   - Execute

4. **Configure Gemini API**
   - Get key from https://ai.google.dev/
   - Add to backend `.env`: `GEMINI_API_KEY=...`

5. **Run Development Servers**
   ```bash
   # Terminal 1: Backend
   cd backend
   npm run dev
   # Server runs on http://localhost:5000
   
   # Terminal 2: Frontend
   cd CardiiiiX
   npm run dev
   # App runs on http://localhost:3003
   ```

6. **Access Application**
   - Open http://localhost:3003
   - Create account
   - Start using!

## 📚 Project Structure

```
vivitsu-2.0/
├── CardiiiiX/                      # Frontend application
│   ├── components/                 # React components
│   │   ├── ChatAssistant.tsx       # Chat interface
│   │   ├── Dashboard.tsx           # Health metrics dashboard
│   │   ├── ReportAnalyzer.tsx      # File upload & analysis
│   │   └── Sidebar.tsx             # Navigation
│   ├── services/
│   │   ├── apiClient.ts            # Backend API client
│   │   ├── supabaseService.ts      # Supabase integration
│   │   └── geminiService.ts        # Gemini API calls (legacy)
│   ├── context/
│   │   └── AuthContext.tsx         # Auth state management
│   ├── types.ts                    # TypeScript interfaces
│   ├── App.tsx                     # Root component
│   ├── .env                        # Frontend environment variables
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── backend/                        # Backend API
│   ├── config/
│   │   ├── env.ts                  # Environment & medical config
│   │   └── supabase.ts             # Database initialization
│   ├── middleware/
│   │   ├── auth.ts                 # JWT verification
│   │   └── errorHandler.ts         # Error handling
│   ├── services/
│   │   ├── chatService.ts          # Chat CRUD & persistence
│   │   ├── reportService.ts        # Report management
│   │   ├── ocrService.ts           # OCR & file handling
│   │   ├── geminiService.ts        # Gemini AI integration
│   │   └── medicalProcessingService.ts  # Medical analysis
│   ├── routes/
│   │   ├── authRoutes.ts           # Authentication API
│   │   ├── chatRoutes.ts           # Chat API
│   │   ├── reportRoutes.ts         # Reports API
│   │   └── healthRoutes.ts         # Health metrics API
│   ├── utils/
│   │   ├── validation.ts           # Zod schemas
│   │   └── logger.ts               # Structured logging
│   ├── server.ts                   # Express setup
│   ├── setup.sql                   # Database schema
│   ├── .env                        # Backend environment variables
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
│
├── DEPLOYMENT_GUIDE.md             # Deployment instructions
├── FRONTEND_INTEGRATION.md         # Frontend integration guide
├── README.md                       # This file
└── .gitignore
```

## 🔄 API Overview

### Authentication
- `POST /api/auth/signup` - Register user
- `POST /api/auth/signin` - Login
- `GET /api/auth/me` - Current user
- `POST /api/auth/logout` - Logout

### Chat
- `POST /api/chats` - Create chat
- `GET /api/chats` - List chats
- `POST /api/chats/:id/messages` - Send message
- `DELETE /api/chats/:id` - Delete chat

### Reports
- `POST /api/reports/upload` - Upload document
- `POST /api/reports/:id/analyze` - Analyze report
- `GET /api/reports` - List reports
- `GET /api/reports/:id` - Get report details

### Health Metrics
- `POST /api/health` - Add metric
- `GET /api/health` - Get metrics
- `GET /api/health/stats/summary` - Weekly summary

See [Backend README](./backend/README.md) for full API documentation.

## 🔐 Security

### Authentication
- Supabase Auth manages user accounts
- JWT tokens verify API requests
- Automatic token refresh on frontend

### Database Security
- **Row-Level Security (RLS)**: Users only access their data
- **Role-Based Access Control**: Admin/User roles
- **Input Validation**: Zod schemas prevent injection
- **Encrypted Credentials**: All secrets in .env

### API Security
- CORS whitelisting
- Standardized error responses (no data leakage)
- Rate limiting ready for production
- Request logging for audit trails

## 📊 Database Schema

### Core Tables
- **users** - User metadata
- **chats** - Conversation threads
- **messages** - Chat history
- **medical_reports** - Uploaded documents
- **health_metrics** - Vital signs tracking
- **risk_assessments** - AI risk scores
- **audit_logs** - Compliance logging

See `backend/setup.sql` for full schema with RLS policies.

## 🧪 Testing

### Development Testing
```bash
# Frontend
cd CardiiiiX
npm run dev          # Start dev server with HMR

# Backend
cd backend
npm run dev          # Start with ts-node

# Test API
curl http://localhost:5000/health
```

### Production Build
```bash
# Frontend
npm run build        # Creates dist/
npm run preview      # Preview optimized build

# Backend  
npm run build        # Compiles TypeScript to dist/
npm start            # Runs compiled code
```

## 📖 Documentation

- **[Backend Documentation](./backend/README.md)** - API, services, deployment
- **[Frontend Integration Guide](./FRONTEND_INTEGRATION.md)** - Component updates, usage
- **[Deployment Guide](./DEPLOYMENT_GUIDE.md)** - Production setup, scaling

## 🚢 Deployment

### Quick Deployment
```bash
# Using Vercel (recommended)
vercel deploy

# Using Docker
docker build -t vivitsu-backend ./backend
docker run -p 5000:5000 vivitsu-backend
```

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for:
- Supabase setup
- Gemini API configuration
- Environment variables
- Production checklists
- Monitoring & maintenance

## 📚 Medical Reference

The system includes reference ranges for common lab values:
- Blood Pressure (Systolic/Diastolic)
- Heart Rate
- Oxygen Saturation (SpO2)
- Blood Glucose
- Total Cholesterol
- Triglycerides
- HDL/LDL Cholesterol
- Hemoglobin A1C
- TSH
- Creatinine
- BMI

Configure via `MEDICAL_LAB_RANGES` in `backend/config/env.ts`.

## ⚖️ Legal & Medical Disclaimer

**This system is for educational and informational purposes only.**

⚠️ **NOT a substitute for professional medical advice**
- Always consult with healthcare professionals for medical decisions
- In emergencies, call 911 immediately
- Do not use for diagnosis or treatment decisions
- System may contain inaccuracies

See disclaimers in:
- Frontend health analysis warnings
- Chat system prompts
- Report analysis output

## 🤝 Contributing

1. Create feature branch: `git checkout -b feature/amazing-feature`
2. Commit changes: `git commit -m 'Add amazing feature'`
3. Push branch: `git push origin feature/amazing-feature`
4. Open Pull Request

Please ensure:
- TypeScript strict mode passes
- All endpoints documented
- Security practices followed
- Tests included for new features

## 🐛 Issue Tracking

Report bugs via GitHub Issues:
- Describe issue clearly
- Include steps to reproduce
- Attach error logs
- Specify environment (dev/prod)

## 📞 Support

- **Documentation**: See files in this repo
- **Supabase Help**: https://supabase.com/docs
- **Gemini API Docs**: https://ai.google.dev/docs
- **Express Docs**: https://expressjs.com/

## 📜 License

ISC License - See [LICENSE](./LICENSE) file

## 🙏 Acknowledgments

- Built with [Supabase](https://supabase.com)
- Powered by [Google Gemini API](https://ai.google.dev)
- Frontend by [React](https://react.dev) & [Vite](https://vitejs.dev)
- Icons by [Lucide](https://lucide.dev)

---

## 🎓 Learning Resources

For developers new to the stack:

- **TypeScript**: https://www.typescriptlang.org/docs/
- **React**: https://react.dev/
- **Vite**: https://vitejs.dev/guide/
- **TailwindCSS**: https://tailwindcss.com/docs
- **Express**: https://expressjs.com/
- **Supabase**: https://supabase.com/docs
- **PostgreSQL**: https://www.postgresql.org/docs/

---

**Version**: 1.0.0  
**Last Updated**: January 2024  
**Status**: Production Ready ✅

For the latest version and updates, check out the [repository](https://example.com/repo).
