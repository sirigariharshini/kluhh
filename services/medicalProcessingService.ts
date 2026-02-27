// backend/services/medicalProcessingService.ts
// Medical data extraction and analysis

import { MEDICAL_LAB_RANGES } from '../config/env';
import { logger } from '../utils/logger';

interface LabValue {
  name: string;
  value: number;
  unit: string;
  normalMin: number;
  normalMax: number;
  isAbnormal: boolean;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

interface MedicalAnalysis {
  extractedMetrics: LabValue[];
  abnormalMetrics: LabValue[];
  riskScore: number;
  emergencyFlags: string[];
  recommendations: string[];
  bmi?: number;
}

export class MedicalProcessingService {
  /**
   * Parse lab values from extracted text
   */
  parseLabValues(text: string): LabValue[] {
    const metrics: LabValue[] = [];
    const lines = text.split('\n');

    for (const [key, range] of Object.entries(MEDICAL_LAB_RANGES)) {
      // Simple regex pattern matching - can be enhanced
      const patterns = [
        new RegExp(`${range.name}[:\\s]+([0-9.]+)`, 'i'),
        new RegExp(`${key}[:\\s]+([0-9.]+)`, 'i'),
      ];

      for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
          const value = parseFloat(match[1]);
          const isAbnormal = value < range.min || value > range.max;
          const severity = this.calculateSeverity(value, range.min, range.max);

          metrics.push({
            name: range.name,
            value,
            unit: range.unit,
            normalMin: range.min,
            normalMax: range.max,
            isAbnormal,
            severity: isAbnormal ? severity : 'LOW',
          });

          break;
        }
      }
    }

    return metrics;
  }

  /**
   * Calculate severity level based on deviation from normal ranges
   */
  private calculateSeverity(
    value: number,
    min: number,
    max: number
  ): 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    const range = max - min;
    const below = Math.max(0, min - value);
    const above = Math.max(0, value - max);
    const deviation = Math.max(below, above);

    if (deviation > range * 0.5) {
      return 'CRITICAL';
    } else if (deviation > range * 0.25) {
      return 'HIGH';
    }
    return 'MEDIUM';
  }

  /**
   * Calculate BMI
   */
  calculateBMI(weightKg: number, heightM: number): number {
    if (heightM <= 0) return 0;
    return Math.round((weightKg / (heightM * heightM)) * 100) / 100;
  }

  /**
   * Analyze all metrics and generate risk score
   */
  analyzeMetrics(metrics: LabValue[]): MedicalAnalysis {
    const abnormalMetrics = metrics.filter((m) => m.isAbnormal);
    const emergencyFlags: string[] = [];
    const recommendations: string[] = [];

    // Calculate risk score (0-100)
    let riskScore = 0;

    for (const metric of metrics) {
      if (metric.isAbnormal) {
        switch (metric.severity) {
          case 'CRITICAL':
            riskScore += 25;
            emergencyFlags.push(`CRITICAL: ${metric.name} = ${metric.value} ${metric.unit}`);
            break;
          case 'HIGH':
            riskScore += 15;
            break;
          case 'MEDIUM':
            riskScore += 10;
            break;
        }
      }
    }

    // Cap risk score at 100
    riskScore = Math.min(100, riskScore);

    // Generate recommendations based on abnormalities
    if (abnormalMetrics.length > 0) {
      for (const metric of abnormalMetrics) {
        if (metric.name.includes('Blood Pressure') && metric.value > 140) {
          recommendations.push('⚠️ Blood pressure elevated - Contact healthcare provider');
        }
        if (metric.name.includes('Heart Rate') && metric.value > 100) {
          recommendations.push('Monitor heart rate and seek medical evaluation');
        }
        if (metric.name.includes('Glucose') && metric.value > 200) {
          recommendations.push('⚠️ Glucose significantly elevated - Consult doctor immediately');
        }
        if (metric.name.includes('Cholesterol') && metric.value > 240) {
          recommendations.push('Cholesterol high - Discuss cardiovascular risk with healthcare provider');
        }
      }
    }

    return {
      extractedMetrics: metrics,
      abnormalMetrics,
      riskScore,
      emergencyFlags,
      recommendations,
    };
  }

  /**
   * Identify emergency conditions
   */
  identifyEmergencies(metrics: LabValue[]): string[] {
    const emergencies: string[] = [];

    for (const metric of metrics) {
      if (!metric.isAbnormal) continue;

      // Critical thresholds
      if (metric.name === 'Systolic Blood Pressure' && metric.value > 180) {
        emergencies.push('🚨 CRITICAL: Hypertensive crisis - Seek emergency care immediately');
      }
      if (metric.name === 'Heart Rate' && (metric.value > 120 || metric.value < 40)) {
        emergencies.push('🚨 CRITICAL: Abnormal heart rate - Call emergency services');
      }
      if (metric.name === 'Oxygen Saturation (SpO2)' && metric.value < 90) {
        emergencies.push('🚨 CRITICAL: Low oxygen - Seek emergency care');
      }
      if (metric.name === 'Fasting Blood Glucose' && (metric.value > 400 || metric.value < 40)) {
        emergencies.push('🚨 CRITICAL: Extreme glucose level - Call 911');
      }
    }

    return emergencies;
  }

  /**
   * Generate comprehensive medical summary
   */
  generateSummary(analysis: MedicalAnalysis): string {
    let summary = '';

    summary += `## Medical Analysis Report\n\n`;
    summary += `**Risk Level**: ${this.getRiskLevel(analysis.riskScore)} (Score: ${analysis.riskScore}/100)\n\n`;

    if (analysis.abnormalMetrics.length > 0) {
      summary += `### Abnormal Metrics (${analysis.abnormalMetrics.length})\n`;
      for (const metric of analysis.abnormalMetrics) {
        summary += `- **${metric.name}**: ${metric.value} ${metric.unit} (Normal: ${metric.normalMin}-${metric.normalMax}) [${metric.severity}]\n`;
      }
      summary += '\n';
    }

    if (analysis.emergencyFlags.length > 0) {
      summary += `### ⚠️ Emergency Alerts\n`;
      for (const flag of analysis.emergencyFlags) {
        summary += `- ${flag}\n`;
      }
      summary += '\n';
    }

    if (analysis.recommendations.length > 0) {
      summary += `### Recommendations\n`;
      for (const rec of analysis.recommendations) {
        summary += `- ${rec}\n`;
      }
      summary += '\n';
    }

    summary += `\n**DISCLAIMER**: This analysis is for informational purposes only and does not constitute medical advice. Always consult with a healthcare professional.`;

    return summary;
  }

  /**
   * Get risk level label
   */
  private getRiskLevel(score: number): string {
    if (score >= 80) return '🔴 CRITICAL';
    if (score >= 60) return '🟠 HIGH';
    if (score >= 40) return '🟡 MEDIUM';
    return '🟢 LOW';
  }
}

export const medicalProcessingService = new MedicalProcessingService();
