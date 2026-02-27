// backend/services/geminiService.ts
// Gemini API integration with structured prompts

import { GoogleGenerativeAI } from '@google/generative-ai';
import { config, MEDICAL_DISCLAIMERS } from '../config/env';
import { logger } from '../utils/logger';

const genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);

interface MessageContext {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}

export class GeminiService {
  private model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
  private conversationHistory: MessageContext[] = [];
  private tokenCount = 0;

  /**
   * Analyze medical report with structured prompt
   */
  async analyzeReport(extractedText: string): Promise<string> {
    try {
      const prompt = `You are a medical assistant. Analyze this medical report and provide:

1. **Summary**: Brief overview (2-3 sentences)
2. **Key Findings**: Important observations and diagnoses
3. **Lab Values**: Extract all numerical values with units and normal ranges
4. **Patient Information**: Name, age, date if available
5. **Recommendations**: Prescribed medications, follow-ups
6. **Abnormalities**: Flag any values outside normal ranges

Report Text:
${extractedText}

${MEDICAL_DISCLAIMERS.report}`;

      const result = await this.model.generateContent(prompt);
      const response = result.response.text();

      this.tokenCount += result.response.usageMetadata?.promptTokens || 0;
      this.tokenCount += result.response.usageMetadata?.candidatesTokens || 0;

      return response;
    } catch (error) {
      logger.error('Gemini report analysis failed', error as Error);
      throw new Error('Failed to analyze medical report');
    }
  }

  /**
   * Chat with medical context
   */
  async chat(userMessage: string, medicalContext?: string): Promise<string> {
    try {
      let systemPrompt = `You are Vivitsu, a professional medical AI assistant.
You provide accurate, helpful health information while maintaining medical ethics.

RULES:
- Always include relevant medical disclaimers
- Remind user to consult healthcare professionals
- Be empathetic and clear
- If uncertain, acknowledge limitations
- Flag any emergency symptoms`;

      if (medicalContext) {
        systemPrompt += `\n\nPATIENT MEDICAL CONTEXT:\n${medicalContext}`;
      }

      this.conversationHistory.push({
        role: 'user',
        parts: [{ text: userMessage }],
      });

      // Trim history if too long
      if (this.conversationHistory.length > config.MAX_CHAT_HISTORY_MESSAGES) {
        this.conversationHistory = this.conversationHistory.slice(
          -config.MAX_CHAT_HISTORY_MESSAGES
        );
      }

      const result = await this.model.generateContent({
        contents: this.conversationHistory,
        systemInstruction: systemPrompt,
        generationConfig: {
          maxOutputTokens: config.GEMINI_MAX_TOKENS,
          temperature: 0.7,
        },
      });

      const response = result.response.text();

      this.conversationHistory.push({
        role: 'model',
        parts: [{ text: response }],
      });

      this.tokenCount += result.response.usageMetadata?.promptTokens || 0;
      this.tokenCount += result.response.usageMetadata?.candidatesTokens || 0;

      return response;
    } catch (error) {
      logger.error('Gemini chat failed', error as Error);
      throw new Error('Failed to process chat message');
    }
  }

  /**
   * Generate health risk assessment
   */
  async assessRisk(medicalData: string): Promise<{
    riskScore: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    recommendations: string;
    emergencyFlags: string[];
  }> {
    try {
      const prompt = `Analyze the following medical data and provide a risk assessment (NOT a diagnosis).

Data: ${medicalData}

Respond with JSON format:
{
  "riskScore": <0-100>,
  "riskLevel": "<LOW|MEDIUM|HIGH|CRITICAL>",
  "abnormalMetrics": ["list of abnormal metrics"],
  "recommendations": "Brief recommendations",
  "emergencyFlags": ["any emergency indicators"]
}

${MEDICAL_DISCLAIMERS.risk}`;

      const result = await this.model.generateContent(prompt);
      const response = result.response.text();

      // Parse JSON response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid response format');
      }

      const assessment = JSON.parse(jsonMatch[0]);

      this.tokenCount += result.response.usageMetadata?.promptTokens || 0;

      return assessment;
    } catch (error) {
      logger.error('Risk assessment failed', error as Error);
      throw new Error('Failed to generate risk assessment');
    }
  }

  /**
   * Extract structured data from text
   */
  async extractMetadata(text: string): Promise<Record<string, any>> {
    try {
      const prompt = `Extract and structure medical data from this text. Return JSON with:
{
  "conditions": ["list of identified conditions"],
  "medications": ["prescribed medications"],
  "symptoms": ["reported symptoms"],
  "procedures": ["procedures mentioned"],
  "recommendations": ["recommendations"]
}

Text: ${text}`;

      const result = await this.model.generateContent(prompt);
      const response = result.response.text();

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return {};
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      logger.error('Metadata extraction failed', error as Error);
      return {};
    }
  }

  /**
   * Get token usage
   */
  getTokenUsage(): number {
    return this.tokenCount;
  }

  /**
   * Clear conversation history
   */
  clearHistory(): void {
    this.conversationHistory = [];
    this.tokenCount = 0;
  }
}

export const geminiService = new GeminiService();
