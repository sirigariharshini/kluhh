import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import tesseract from 'node-tesseract-ocr';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';


// ES Module setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Validate Gemini API Key
if (!GEMINI_API_KEY) {
  console.warn('⚠️ WARNING: GEMINI_API_KEY is not set in .env file');
}

// Supabase Connection (when configured)
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('⚠️ WARNING: Supabase credentials not configured. Medical report storage will be disabled.');
}

// Middleware
app.use(cors({
  origin: '*', // Allow all origins in development
  methods: ['GET', 'POST', 'DELETE'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// OCR Configuration
const ocrConfig = {
  lang: 'eng',
  oem: 1,
  psm: 3
};

// Medical Analysis Function using LOCAL Hugging Face
async function analyzeMedicalReport(extractedText) {
  return new Promise((resolve, reject) => {
    console.log('🤖 Starting LOCAL Hugging Face medical analysis...');

    // Path to Python script
    const pythonScript = join(__dirname, 'medical_analyzer.py');

    console.log('📂 Python script path:', pythonScript);

    // Spawn Python process
    const python = spawn('python', [pythonScript]);

    let output = '';
    let errorOutput = '';

    // Send extracted text to Python
    python.stdin.write(extractedText);
    python.stdin.end();

    // Collect stdout (the analysis result)
    python.stdout.on('data', (data) => {
      output += data.toString();
    });

    // Collect stderr (progress messages)
    python.stderr.on('data', (data) => {
      const message = data.toString();
      console.log('  Python:', message.trim());
      errorOutput += message;
    });

    // Handle process completion
    python.on('close', (code) => {
      if (code !== 0) {
        console.error('❌ Python script failed with code:', code);
        console.error('Error output:', errorOutput);
        reject(new Error(`Medical analysis failed: ${errorOutput}`));
      } else {
        console.log('✅ Local medical analysis complete!');
        resolve(output.trim() || "Analysis completed but no output generated");
      }
    });

    // Handle process errors
    python.on('error', (err) => {
      console.error('❌ Failed to start Python process:', err.message);
      reject(new Error(`Python execution failed: ${err.message}. Make sure Python is in PATH.`));
    });

    // Timeout after 2 minutes (increased for slower systems)
    setTimeout(() => {
      python.kill();
      reject(new Error('Medical analysis timed out after 120 seconds'));
    }, 120000);
  });
}

// Medical Analysis Endpoint (Supabase save will be added later)
app.post('/api/medical/analyze', async (req, res) => {
  console.log('\n🔵 === NEW MEDICAL ANALYSIS REQUEST ===');

  try {
    const { image, mimeType } = req.body;

    if (!image || !mimeType) {
      console.error('❌ Missing image or mimeType');
      return res.status(400).json({
        error: "Missing required fields: image and mimeType",
        success: false
      });
    }

    console.log('📥 Request received:', {
      mimeType,
      imageSize: `${(image.length / 1024).toFixed(2)} KB`
    });

    const supportedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!supportedTypes.includes(mimeType)) {
      console.error('❌ Unsupported file type:', mimeType);
      return res.status(400).json({
        error: `Unsupported file type: ${mimeType}`,
        success: false
      });
    }

    console.log('🔍 Starting OCR extraction...');
    const imageBuffer = Buffer.from(image, 'base64');

    let extractedText;
    try {
      extractedText = await tesseract.recognize(imageBuffer, ocrConfig);
      console.log('✅ OCR complete. Extracted', extractedText?.length || 0, 'characters');
      console.log('📝 Preview:', extractedText?.substring(0, 100));
    } catch (ocrError) {
      console.error('❌ OCR Error:', ocrError.message);
      return res.status(500).json({
        error: "OCR extraction failed. Make sure Tesseract is installed.",
        details: ocrError.message,
        success: false
      });
    }

    if (!extractedText || extractedText.trim().length < 20) {
      console.error('❌ Insufficient text extracted');
      return res.status(400).json({
        error: "Could not extract sufficient text. Please use a clearer image.",
        extractedText: extractedText || "",
        success: false
      });
    }

    console.log('🤖 Starting LOCAL AI analysis...');
    let analysis;
    try {
      analysis = await analyzeMedicalReport(extractedText);
      console.log('✅ AI analysis complete!');
    } catch (analysisError) {
      console.error('❌ Analysis Error:', analysisError.message);
      return res.status(500).json({
        error: "AI analysis failed",
        details: analysisError.message,
        extractedText: extractedText.trim(),
        success: false
      });
    }

    // TODO: Save to Supabase when configured
    console.log('✅ Sending successful response');

    return res.status(200).json({
      extractedText: extractedText.trim(),
      analysis: analysis,
      success: true,
      processedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error("❌ Unexpected Error:", error);
    return res.status(500).json({
      error: "Server error during analysis",
      details: error.message,
      success: false
    });
  }
});

// Get All Reports (Supabase - to be implemented)
// app.get('/api/medical/reports', async (req, res) => {
//   // TODO: Implement with Supabase
// });

// Get Single Report by ID (Supabase - to be implemented)
// app.get('/api/medical/reports/:id', async (req, res) => {
//   // TODO: Implement with Supabase
// });

// Delete Report (Supabase - to be implemented)
// app.delete('/api/medical/reports/:id', async (req, res) => {
//   // TODO: Implement with Supabase
// });

// Health check
app.get('/', (req, res) => {
  res.json({
    message: 'Vivitsu Medical AI Backend',
    version: '2.0.0',
    status: 'running',
    features: {
      ocr: 'Tesseract OCR',
      ai: 'Local Hugging Face (No quotas)',
      privacy: 'All data processed locally',
      database: 'Supabase (PostgreSQL)'
    },
    endpoints: {
      medicalAnalysis: 'POST /api/medical/analyze',
      chat: 'POST /api/chat/message',
      dietPlan: 'POST /api/chat/diet-plan',
      insights: 'POST /api/chat/insights'
    }
  });
});


const getAI = () => new GoogleGenAI({
  apiKey: import.meta.env.VITE_GEMINI_API_KEY || ''
});

// Gemini Chat Endpoint - ROBUST VERSION
app.post('/api/chat/message', async (req, res) => {
  try {
    console.log('📨 Chat Request Received');

    if (!GEMINI_API_KEY) {
      console.error('❌ GEMINI_API_KEY not configured');
      return res.status(500).json({
        success: false,
        error: 'GEMINI_API_KEY is not configured in .env file'
      });
    }

    const { messages, medicalReports } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Messages array is required and cannot be empty'
      });
    }

    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || typeof lastMessage.text !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Last message must contain text'
      });
    }

    console.log('🔑 Using Gemini API with key:', GEMINI_API_KEY.substring(0, 10) + '...');

    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

    // Try models in order of preference
    const modelNames = ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-pro'];
    let model;
    let successModel = null;

    for (const modelName of modelNames) {
      try {
        console.log(`🤖 Trying model: ${modelName}`);
        model = genAI.getGenerativeModel({ model: modelName });

        // Build medical context
        let context = '';
        if (medicalReports && medicalReports.length > 0) {
          context = '\n\n📋 PATIENT MEDICAL CONTEXT:\n';
          medicalReports.slice(0, 3).forEach((report, i) => {
            if (report.aiAnalysis) {
              context += `Report ${i + 1}: ${report.aiAnalysis.substring(0, 250)}...\n`;
            }
          });
        }

        const systemPrompt = `You are Vivitsu, a helpful AI health assistant. You have access to medical information and provide supportive guidance.${context}

Rules:
1. Provide helpful, accurate health information
2. Always remind users to consult healthcare professionals for medical decisions
3. Be empathetic and clear
4. Format responses with clear sections`;

        const userMessage = lastMessage.text;
        const fullPrompt = `${systemPrompt}\n\nUser Question: ${userMessage}`;

        console.log('📤 Sending to Gemini API...');
        const result = await model.generateContent(fullPrompt);
        const response = result.response.text();

        console.log('✅ Gemini Response Received');
        successModel = modelName;

        return res.json({
          success: true,
          response: response,
          model: modelName
        });

      } catch (modelError) {
        console.warn(`⚠️ Model ${modelName} failed:`, modelError.message);
        continue;
      }
    }

    // If all models failed
    throw new Error('All Gemini models failed. Check API key validity and quota.');

  } catch (error) {
    console.error('❌ Chat API Error:', error);

    let errorMessage = error.message || 'Failed to process chat message';

    // Detailed error handling
    if (error.message?.includes('API_KEY')) {
      errorMessage = 'Invalid Gemini API Key. Please check your .env file.';
    } else if (error.message?.includes('quota')) {
      errorMessage = 'API quota exceeded. Please try again later.';
    } else if (error.message?.includes('not found') || error.message?.includes('404')) {
      errorMessage = 'Gemini model not found. May be outdated model name.';
    }

    res.status(500).json({
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Diet Plan Endpoint - ROBUST VERSION
app.post('/api/chat/diet-plan', async (req, res) => {
  try {
    console.log('🍽️  Diet Plan Request Received');

    if (!GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'GEMINI_API_KEY is not configured'
      });
    }

    const { goal, medicalReports } = req.body;

    if (!goal || typeof goal !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Goal is required'
      });
    }

    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const modelNames = ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-pro'];

    let response;
    for (const modelName of modelNames) {
      try {
        console.log(`🤖 Trying model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });

        let context = '';
        if (medicalReports && medicalReports.length > 0) {
          context = '\n\nMedical Context:\n';
          medicalReports.slice(0, 2).forEach((report, i) => {
            if (report.aiAnalysis) {
              context += `- ${report.aiAnalysis.substring(0, 150)}...\n`;
            }
          });
        }

        const prompt = `Create a personalized 7-day diet plan for: ${goal}${context}

Include:
1. **Daily Meal Plan** (Breakfast, Lunch, Dinner, 2 Snacks)
2. **Nutritional Focus** (calories, macros)
3. **Foods to Include/Avoid**
4. **Hydration & Supplements**
5. **Shopping List**

Format clearly with sections. End with: "⚠️ Consult a nutritionist for personalized medical advice."`;

        const result = await model.generateContent(prompt);
        response = result.response.text();
        console.log('✅ Diet Plan Generated');
        break;

      } catch (modelError) {
        console.warn(`⚠️ Model ${modelName} failed:`, modelError.message);
        continue;
      }
    }

    if (!response) {
      throw new Error('All Gemini models failed');
    }

    res.json({
      success: true,
      response
    });

  } catch (error) {
    console.error('❌ Diet Plan Error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate diet plan'
    });
  }
});

// Health Insights Endpoint - ROBUST VERSION
app.post('/api/chat/insights', async (req, res) => {
  try {
    console.log('💡 Health Insights Request Received');

    if (!GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'GEMINI_API_KEY is not configured'
      });
    }

    const { medicalReports } = req.body;

    if (!medicalReports || medicalReports.length === 0) {
      return res.json({
        success: true,
        response: 'No medical reports available for analysis. Upload reports to get personalized health insights.'
      });
    }

    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const modelNames = ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-pro'];

    let response;
    for (const modelName of modelNames) {
      try {
        console.log(`🤖 Trying model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });

        let context = 'Medical Reports Analysis:\n\n';
        medicalReports.slice(0, 5).forEach((report, i) => {
          if (report.aiAnalysis) {
            context += `Report ${i + 1}: ${report.aiAnalysis.substring(0, 200)}...\n\n`;
          }
        });

        const prompt = `${context}

Analyze the patient's medical history and provide:

## 📊 Health Trends
## ⚠️ Risk Factors
## 💪 Preventive Measures
## 🏃 Lifestyle Recommendations
## 📋 Follow-up Suggestions

Be specific and reference findings. End with: "⚠️ Consult healthcare professionals for medical decisions."`;

        const result = await model.generateContent(prompt);
        response = result.response.text();
        console.log('✅ Health Insights Generated');
        break;

      } catch (modelError) {
        console.warn(`⚠️ Model ${modelName} failed:`, modelError.message);
        continue;
      }
    }

    if (!response) {
      throw new Error('All Gemini models failed');
    }

    res.json({
      success: true,
      response
    });

  } catch (error) {
    console.error('❌ Insights Error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate insights'
    });
  }
});

// Health check and debug endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    server: 'Vivitsu Medical AI Backend',
    version: '2.0.0',
    geminiApiConfigured: !!GEMINI_API_KEY,
    geminiApiKey: GEMINI_API_KEY ? GEMINI_API_KEY.substring(0, 10) + '...' : 'NOT SET',
    supabaseConfigured: !!SUPABASE_URL && !!SUPABASE_KEY,
    environment: process.env.NODE_ENV
  });
});

// Test Gemini API Connection
app.get('/api/test-gemini', async (req, res) => {
  try {
    if (!GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'GEMINI_API_KEY not configured'
      });
    }

    console.log('🧪 Testing Gemini API connection...');
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
    const result = await model.generateContent('Say "Vivitsu API is working!" in 5 words');
    const response = result.response.text();

    console.log('✅ Gemini API test successful');
    res.json({
      success: true,
      message: 'Gemini API is working correctly',
      response: response,
      model: 'gemini-1.5-pro'
    });

  } catch (error) {
    console.error('❌ Gemini API test failed:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      tips: [
        'Check if GEMINI_API_KEY is correct in .env',
        'Verify API key is active on Google Cloud Console',
        'Check if API has quota remaining',
        'Ensure @google/generative-ai is installed'
      ]
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`🤖 AI Model: Gemini Pro`);
  console.log(`🔑 Gemini API: ${GEMINI_API_KEY ? '✅ Configured' : '❌ Missing (configure in .env)'}`)
  console.log(`💾 Database: Supabase ${SUPABASE_URL && SUPABASE_KEY ? '✅ Configured' : '⏳ Not configured (will be added)'}`);
  console.log(`🏥 Medical Analysis: http://localhost:${PORT}/api/medical/analyze`);
  console.log(`🧪 Test Connection: http://localhost:${PORT}/api/test-gemini\n`);

  // Check Python availability
  import('child_process').then(({ exec }) => {
    exec('python --version', (error, stdout) => {
      if (error) {
        console.log('⚠️  Python not found in PATH!');
      } else {
        console.log('✅ Python installed:', stdout.trim());
      }
    });
  });
});
