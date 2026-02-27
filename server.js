import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Groq from "groq-sdk";
import appointmentRoutes from "./routes/appointmentRoutes.ts";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

const PORT = process.env.PORT || 5000;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

// Initialize Groq
let groqClient = null;

if (GROQ_API_KEY) {
  groqClient = new Groq({
    apiKey: GROQ_API_KEY
  });
}

// Store conversation history
const conversationHistories = new Map();

// HEALTH CHECK
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    groqConfigured: !!GROQ_API_KEY,
    model: "Groq Llama 3.1 8B Instant"
  });
});

// ADVANCED CHATBOT with Groq API
app.post("/api/chat", async (req, res) => {
  try {
    const { message, sessionId = "default" } = req.body;

    if (!message || message.trim() === "") {
      return res.status(400).json({ error: "Message is required" });
    }

    // Get or create conversation history for this session
    if (!conversationHistories.has(sessionId)) {
      conversationHistories.set(sessionId, []);
    }
    const history = conversationHistories.get(sessionId);

    let reply = "I'm here to help with your health questions.";

    try {
      if (groqClient && GROQ_API_KEY && GROQ_API_KEY.startsWith("gsk_")) {
        // Use Groq API for intelligent responses (only if key is valid)
        const systemPrompt = `You are Vivitsu, an AI health assistant. You help patients understand their health conditions, 
provide medical information, and offer general wellness advice. Always:
- Be empathetic and supportive
- Provide accurate medical information when possible
- Remind users to consult healthcare professionals for serious concerns
- Keep responses concise (2-3 sentences max)
- If it's not health-related, politely redirect to health topics`;

        // Build conversation messages for Groq
        const messages = [
          { role: "system", content: systemPrompt },
          ...history.map(msg => ({
            role: msg.role === "user" ? "user" : "assistant",
            content: msg.text
          })),
          { role: "user", content: message }
        ];

        const response = await groqClient.chat.completions.create({
          model: "llama-3.1-8b-instant",
          messages: messages,
          max_tokens: 200,
          temperature: 0.7,
        });

        reply = response.choices[0]?.message?.content || "I couldn't process that. Please try again.";

        // Store conversation
        history.push({ role: "user", text: message });
        history.push({ role: "model", text: reply });

        // Limit history to last 10 exchanges (20 messages)
        if (history.length > 20) {
          history.splice(0, 2);
        }

      } else {
        // Fallback to hardcoded responses if Groq not configured or API fails
        if (message.toLowerCase().includes("bp") || message.toLowerCase().includes("blood pressure")) {
          reply = "Normal blood pressure is around 120/80 mmHg. Readings vary based on age and health. Consult a doctor if concerned.";
        }
        else if (message.toLowerCase().includes("heart") || message.toLowerCase().includes("hr")) {
          reply = "Normal heart rate is 60-100 bpm at rest. It increases with activity. If consistently high, see a doctor.";
        }
        else if (message.toLowerCase().includes("spo2") || message.toLowerCase().includes("oxygen")) {
          reply = "Normal SpO2 is 95-100%. Below 90% requires medical attention. Contact a healthcare provider if concerning.";
        }
        else if (message.toLowerCase().includes("temperature") || message.toLowerCase().includes("fever")) {
          reply = "Normal body temperature is 98.6°F (37°C). 100.4°F+ indicates fever. Stay hydrated and see a doctor if it persists.";
        }
        else if (message.toLowerCase().includes("glucose") || message.toLowerCase().includes("blood sugar")) {
          reply = "Normal fasting glucose is 70-100 mg/dL. After meals, <140 mg/dL is normal. Diabetes screening available at clinics.";
        }
        else {
          reply = "I can help with health questions. Ask me about vital signs, symptoms, or general wellness tips.";
        }

        // Store fallback conversation
        history.push({ role: "user", text: message });
        history.push({ role: "model", text: reply });
      }

    } catch (error) {
      console.error("Groq API Error:", error);
      // Fall back to hardcoded responses if Groq API fails
      if (message.toLowerCase().includes("bp") || message.toLowerCase().includes("blood pressure")) {
        reply = "Normal blood pressure is around 120/80 mmHg. Readings vary based on age and health. Consult a doctor if concerned.";
      }
      else if (message.toLowerCase().includes("heart") || message.toLowerCase().includes("hr")) {
        reply = "Normal heart rate is 60-100 bpm at rest. It increases with activity. If consistently high, see a doctor.";
      }
      else if (message.toLowerCase().includes("spo2") || message.toLowerCase().includes("oxygen")) {
        reply = "Normal SpO2 is 95-100%. Below 90% requires medical attention. Contact a healthcare provider if concerning.";
      }
      else if (message.toLowerCase().includes("temperature") || message.toLowerCase().includes("fever")) {
        reply = "Normal body temperature is 98.6°F (37°C). 100.4°F+ indicates fever. Stay hydrated and see a doctor if it persists.";
      }
      else if (message.toLowerCase().includes("glucose") || message.toLowerCase().includes("blood sugar")) {
        reply = "Normal fasting glucose is 70-100 mg/dL. After meals, <140 mg/dL is normal. Diabetes screening available at clinics.";
      }
      else {
        reply = "I can help with health questions. Ask me about vital signs, symptoms, or general wellness tips.";
      }

      // Store fallback conversation
      history.push({ role: "user", text: message });
      history.push({ role: "model", text: reply });
    }

    res.json({ reply, sessionId });

  } catch (error) {
    console.error("Chat Error:", error);
    res.status(500).json({ error: "Server error: " + error.message });
  }
});

// MEDICAL ANALYSIS ROUTE
app.post("/api/medical/analyze", async (req, res) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ error: "No image provided" });
    }

    // For now, just return dummy success to test connection
    res.json({
      success: true,
      analysis: "Medical report analyzed successfully (test response)."
    });

  } catch (error) {
    console.error("Analyze Error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// APPOINTMENT ROUTES
app.use("/api/appointments", appointmentRoutes);

// START SERVER
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📝 API Base URL: http://localhost:${PORT}/api`);
  console.log(`✅ Environment: ES Modules (type: "module")`);
  console.log(`📅 Appointments: http://localhost:${PORT}/api/appointments`);
});