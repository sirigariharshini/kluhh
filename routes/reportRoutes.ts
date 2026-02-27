// backend/routes/reportRoutes.ts
// Medical report API endpoints

import { Router, Response } from 'express';
import multer from 'multer';
import { reportService } from '../services/reportService';
import { ocrService } from '../services/ocrService';
import { medicalProcessingService } from '../services/medicalProcessingService';
import { geminiService } from '../services/geminiService';
import { verifyAuth, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// All report routes require authentication
router.use(verifyAuth);

/**
 * POST /api/reports/upload - Upload medical document
 */
router.post(
  '/upload',
  upload.single('file'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const { title } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    if (!title) {
      return res.status(400).json({ error: 'Title required' });
    }

    // Save uploaded file
    const filePath = await ocrService.saveUploadedFile(req.file.buffer, req.file.originalname, userId);

    // Process OCR
    let ocrResult;
    try {
      ocrResult = await ocrService.processImage(filePath);
    } catch (error) {
      logger.error('OCR processing failed', error as Error, userId);
      ocrResult = {
        text: 'OCR processing not available. Please ensure actual OCR library is installed.',
        confidence: 0,
        processingTime: 0,
      };
    }

    // Normalize extracted text
    const normalizedText = ocrService.normalizeText(ocrResult.text);

    // Create report in database
    const report = await reportService.createReport({
      user_id: userId,
      title,
      extracted_text: normalizedText,
      file_path: filePath,
      mime_type: req.file.mimetype,
      file_size_bytes: req.file.size,
      is_analyzed: false,
    });

    if (!report) {
      return res.status(500).json({ error: 'Failed to create report' });
    }

    res.status(201).json({
      reportId: report.id,
      title: report.title,
      extractedText: normalizedText,
      confidence: ocrResult.confidence,
      processingTime: ocrResult.processingTime,
    });
  })
);

/**
 * GET /api/reports - Get user's reports
 */
router.get(
  '/',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);

    const reports = await reportService.getUserReports(userId, limit);
    res.json(reports);
  })
);

/**
 * GET /api/reports/:reportId - Get single report
 */
router.get(
  '/:reportId',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { reportId } = req.params;
    const userId = req.user!.id;

    const report = await reportService.getReport(reportId, userId);

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.json(report);
  })
);

/**
 * POST /api/reports/:reportId/analyze - Analyze report with AI
 */
router.post(
  '/:reportId/analyze',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { reportId } = req.params;
    const userId = req.user!.id;

    // Get report
    const report = await reportService.getReport(reportId, userId);

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Extract medical data
    const metrics = medicalProcessingService.parseLabValues(report.extracted_text);
    const analysis = medicalProcessingService.analyzeMetrics(metrics);

    // Generate AI analysis
    let aiAnalysis: string;
    try {
      aiAnalysis = await geminiService.analyzeReport(report.extracted_text);
    } catch (error) {
      logger.error('AI analysis failed', error as Error, userId);
      aiAnalysis = 'AI analysis unavailable. Proceeding with structural analysis.';
    }

    // Generate comprehensive summary
    const summary = medicalProcessingService.generateSummary(analysis);

    // Update report with analysis
    const success = await reportService.updateReportAnalysis(reportId, userId, summary, analysis.riskScore);

    if (!success) {
      return res.status(500).json({ error: 'Failed to save analysis' });
    }

    res.json({
      reportId,
      riskScore: analysis.riskScore,
      abnormalMetrics: analysis.abnormalMetrics,
      emergencyFlags: analysis.emergencyFlags,
      recommendations: analysis.recommendations,
      summary,
      aiAnalysis,
    });
  })
);

/**
 * DELETE /api/reports/:reportId - Delete report
 */
router.delete(
  '/:reportId',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { reportId } = req.params;
    const userId = req.user!.id;

    const success = await reportService.deleteReport(reportId, userId);

    if (!success) {
      return res.status(500).json({ error: 'Failed to delete report' });
    }

    res.json({ success: true });
  })
);

/**
 * GET /api/reports/stats/high-risk - Get high-risk reports
 */
router.get(
  '/stats/high-risk',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);

    const reports = await reportService.getHighRiskReports(userId, limit);
    res.json(reports);
  })
);

export default router;
