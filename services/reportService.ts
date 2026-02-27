// backend/services/reportService.ts
// Medical report management

import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';

export interface MedicalReport {
    id?: string;
    user_id: string;
    title: string;
    extracted_text: string;
    file_path?: string;
    mime_type: string;
    file_size_bytes: number;
    ai_analysis?: string;
    risk_score?: number;
    is_analyzed: boolean;
    created_at?: string;
    updated_at?: string;
}

export class ReportService {
    /**
     * Create new report
     */
    async createReport(report: Omit<MedicalReport, 'id' | 'created_at' | 'updated_at'>): Promise<MedicalReport | null> {
        try {
            const { data, error } = await supabase.from('medical_reports').insert([report]).select().single();

            if (error) {
                logger.error('Failed to create report', error as Error, report.user_id);
                return null;
            }

            logger.info('Report created', { reportId: data.id }, report.user_id);
            return data as MedicalReport;
        } catch (error) {
            logger.error('Report creation error', error as Error);
            return null;
        }
    }

    /**
     * Get user's reports
     */
    async getUserReports(userId: string, limit = 50): Promise<MedicalReport[]> {
        try {
            const { data, error } = await supabase
                .from('medical_reports')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) {
                logger.error('Failed to fetch reports', error as Error, userId);
                return [];
            }

            return data as MedicalReport[];
        } catch (error) {
            logger.error('Fetch reports error', error as Error, userId);
            return [];
        }
    }

    /**
     * Get single report
     */
    async getReport(reportId: string, userId: string): Promise<MedicalReport | null> {
        try {
            const { data, error } = await supabase
                .from('medical_reports')
                .select('*')
                .eq('id', reportId)
                .eq('user_id', userId)
                .single();

            if (error) {
                logger.error('Failed to fetch report', error as Error, userId);
                return null;
            }

            return data as MedicalReport;
        } catch (error) {
            logger.error('Fetch report error', error as Error, userId);
            return null;
        }
    }

    /**
     * Update report with AI analysis
     */
    async updateReportAnalysis(
        reportId: string,
        userId: string,
        analysis: string,
        riskScore: number
    ): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('medical_reports')
                .update({
                    ai_analysis: analysis,
                    risk_score: riskScore,
                    is_analyzed: true,
                })
                .eq('id', reportId)
                .eq('user_id', userId);

            if (error) {
                logger.error('Failed to update report analysis', error as Error, userId);
                return false;
            }

            logger.info('Report analysis updated', { reportId }, userId);
            return true;
        } catch (error) {
            logger.error('Update analysis error', error as Error, userId);
            return false;
        }
    }

    /**
     * Delete report
     */
    async deleteReport(reportId: string, userId: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('medical_reports')
                .delete()
                .eq('id', reportId)
                .eq('user_id', userId);

            if (error) {
                logger.error('Failed to delete report', error as Error, userId);
                return false;
            }

            logger.info('Report deleted', { reportId }, userId);
            return true;
        } catch (error) {
            logger.error('Delete report error', error as Error, userId);
            return false;
        }
    }

    /**
     * Get reports by risk level
     */
    async getReportsByRiskLevel(
        userId: string,
        riskLevel: 'HIGH' | 'MEDIUM' | 'LOW'
    ): Promise<MedicalReport[]> {
        try {
            const riskScoreMap = { HIGH: [70, 100], MEDIUM: [40, 69], LOW: [0, 39] };
            const [minScore, maxScore] = riskScoreMap[riskLevel];

            const { data, error } = await supabase
                .from('medical_reports')
                .select('*')
                .eq('user_id', userId)
                .gte('risk_score', minScore)
                .lte('risk_score', maxScore)
                .order('created_at', { ascending: false });

            if (error) {
                logger.error('Failed to fetch reports by risk level', error as Error, userId);
                return [];
            }

            return data as MedicalReport[];
        } catch (error) {
            logger.error('Fetch reports by risk error', error as Error, userId);
            return [];
        }
    }

    /**
     * Get analyzed reports count
     */
    async getAnalyzedReportsCount(userId: string): Promise<number> {
        try {
            const { data, error } = await supabase
                .from('medical_reports')
                .select('*', { count: 'exact' })
                .eq('user_id', userId)
                .eq('is_analyzed', true);

            if (error) {
                return 0;
            }

            return data.length;
        } catch {
            return 0;
        }
    }

    /**
     * Get recent high-risk reports
     */
    async getHighRiskReports(userId: string, limit = 10): Promise<MedicalReport[]> {
        try {
            const { data, error } = await supabase
                .from('medical_reports')
                .select('*')
                .eq('user_id', userId)
                .gte('risk_score', 70)
                .order('risk_score', { ascending: false })
                .limit(limit);

            if (error) {
                logger.error('Failed to fetch high-risk reports', error as Error, userId);
                return [];
            }

            return data as MedicalReport[];
        } catch (error) {
            logger.error('Fetch high-risk reports error', error as Error, userId);
            return [];
        }
    }
}

export const reportService = new ReportService();
