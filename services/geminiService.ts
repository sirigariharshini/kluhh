interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

interface MedicalReport {
  _id: string;
  extractedText: string;
  aiAnalysis: string;
  uploadedAt: string;
}

// Use environment variable or default to localhost:5000
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

console.log('🔌 API Base URL:', API_BASE_URL);

export const geminiService = {
  // Fetch user's medical reports from backend
  async fetchMedicalReports(): Promise<MedicalReport[]> {
    try {
      console.log('📥 Fetching medical reports from:', `${API_BASE_URL}/medical/reports`);
      const response = await fetch(`${API_BASE_URL}/medical/reports`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Reports fetched:', data.reports?.length || 0);
      return data.reports || [];
    } catch (error) {
      console.error('❌ Error fetching reports:', error);
      return [];
    }
  },

  // Simple chat with AI via backend
  async chatWithContext(
    messages: ChatMessage[],
    medicalReports: MedicalReport[] = [],
    sessionId: string = 'default'
  ): Promise<string> {
    try {
      // Get the last user message
      const lastMessage = messages[messages.length - 1]?.text || '';

      if (!lastMessage) {
        throw new Error('No message to send');
      }

      console.log('📤 POST /api/chat ->', `${API_BASE_URL}/chat`);

      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: lastMessage,
          sessionId
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`HTTP ${response.status}: ${errorData.error || response.statusText}`);
      }

      const data = await response.json();

      if (!data.reply) {
        throw new Error('No response from AI');
      }

      console.log('✅ Chat response received:', data.reply.substring(0, 50) + '...');
      return data.reply;
    } catch (error: any) {
      console.error('❌ Chat Error:', error);
      throw new Error(error.message || 'Failed to get AI response');
    }
  },

  // Generate personalized diet plan (calls backend)
  async generateDietPlan(
    goal: string,
    medicalReports: MedicalReport[] = [],
    sessionId: string = 'diet-plan'
  ): Promise<string> {
    try {
      const message = `Generate a personalized diet plan for the following goal: ${goal}. 
Keep it practical and health-focused.`;

      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          sessionId
        })
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      return data.reply || 'Diet plan generation failed';
    } catch (error: any) {
      console.error('Diet Plan Error:', error);
      throw new Error(error.message || 'Failed to generate diet plan');
    }
  },

  // Get health insights (calls backend)
  async getHealthInsights(medicalReports: MedicalReport[], sessionId: string = 'health-insights'): Promise<string> {
    try {
      const message = `Based on my medical reports, what health insights and recommendations can you provide?`;

      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          sessionId
        })
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      return data.reply || 'Failed to generate insights';
    } catch (error: any) {
      console.error('Insights Error:', error);
      throw new Error(error.message || 'Failed to generate insights');
    }
  },

  // Legacy symptom analysis (uses chatWithContext)
  async analyzeSymptoms(messages: ChatMessage[]): Promise<string> {
    try {
      const lastMessage = messages[messages.length - 1]?.text || '';
      return this.chatWithContext(messages);
    } catch (error: any) {
      console.error('Symptom Analysis Error:', error);
      throw error;
    }
  },

  // Analyze medical report image
  async analyzeReport(base64Image: string, mimeType: string): Promise<string> {
    try {
      const message = `Please analyze this medical report image and provide key findings.`;

      // Call backend endpoint that uses Gemini Vision
      const response = await fetch(`${API_BASE_URL}/medical/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Image, mimeType, message })
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      return data.reply || data.analysis || 'Image analysis failed';
    } catch (error: any) {
      console.error('Image Analysis Error:', error);
      return "Image analysis temporarily unavailable. Please try again later.";
    }
  }
};
