// backend/services/ocrService.ts
// Optical character recognition and text extraction

import * as fs from 'fs';
import * as path from 'path';
import { Worker } from 'worker_threads';
import { logger } from '../utils/logger';

interface OCRResult {
    text: string;
    confidence: number;
    language?: string;
    processingTime: number;
}

export class OCRService {
    private uploadsDir = path.join(__dirname, '../uploads');

    constructor() {
        // Ensure uploads directory exists
        if (!fs.existsSync(this.uploadsDir)) {
            fs.mkdirSync(this.uploadsDir, { recursive: true });
        }
    }

    /**
     * Process image file and extract text (simple approach without tesseract-ocr)
     * Note: To use actual OCR, install node-tesseract-ocr or use cloud vision API
     * This is a placeholder that extracts metadata and text patterns
     */
    async processImage(filePath: string): Promise<OCRResult> {
        const startTime = performance.now();

        try {
            // Check if file exists
            if (!fs.existsSync(filePath)) {
                throw new Error(`File not found: ${filePath}`);
            }

            // Get file stats
            const stats = fs.statSync(filePath);
            const fileName = path.basename(filePath);
            const fileSize = stats.size;

            logger.info('Processing image file', { fileName, fileSize });

            // For production, integrate actual OCR:
            // const text = await recognizeFile(filePath, { psm: 6 }); // node-tesseract-ocr
            // OR use Google Vision API for better accuracy

            // Placeholder: Extract text assuming text file or simple pattern
            const text = await this.extractTextFromFile(filePath);

            const processingTime = performance.now() - startTime;

            return {
                text: text.trim(),
                confidence: 0.85, // Placeholder confidence
                language: 'en',
                processingTime,
            };
        } catch (error) {
            logger.error('OCR processing failed', error as Error);
            throw error;
        }
    }

    /**
     * Process PDF file
     * Note: Requires pdf-parse or pdfjs-dist
     */
    async processPDF(filePath: string): Promise<OCRResult> {
        const startTime = performance.now();

        try {
            if (!fs.existsSync(filePath)) {
                throw new Error(`PDF not found: ${filePath}`);
            }

            // For production, use libraries like:
            // const pdfParse = require('pdf-parse');
            // const fileData = fs.readFileSync(filePath);
            // const pdfData = await pdfParse(fileData);
            // const text = pdfData.text;

            // Placeholder implementation
            const text = 'PDF text extraction requires pdf-parse library';

            const processingTime = performance.now() - startTime;

            return {
                text,
                confidence: 0.75,
                language: 'en',
                processingTime,
            };
        } catch (error) {
            logger.error('PDF processing failed', error as Error);
            throw error;
        }
    }

    /**
     * Extract text from file (simple implementation)
     */
    private async extractTextFromFile(filePath: string): Promise<string> {
        try {
            const content = fs.readFileSync(filePath, 'utf-8');
            return content;
        } catch {
            // For binary files (images), return empty string
            // Real implementation would call actual OCR library
            return 'Binary data - OCR service requires actual image processing library';
        }
    }

    /**
     * Normalize OCR text output
     */
    normalizeText(text: string): string {
        if (!text) return '';

        return (
            text
                .trim()
                // Fix common OCR errors
                .replace(/\s+/g, ' ') // Multiple spaces to single
                .replace(/([a-z])([A-Z])/g, '$1 $2') // Add space between camelCase
                .replace(/[^\w\s\-./,()]/g, '') // Remove special characters except common ones
        );
    }

    /**
     * Extract medical data patterns from text
     */
    extractMedicalPatterns(text: string): { [key: string]: string[] } {
        const patterns = {
            diagnoses: this.extractDiagnoses(text),
            medications: this.extractMedications(text),
            procedures: this.extractProcedures(text),
            measurements: this.extractMeasurements(text),
            dates: this.extractDates(text),
        };

        return patterns;
    }

    private extractDiagnoses(text: string): string[] {
        const diagnosisPattern = /diagnosis[:\s]+(.*?)(?=\n|procedure|medication|$)/gi;
        const matches = text.matchAll(diagnosisPattern);
        return Array.from(matches).map((m) => m[1] || '').filter(Boolean);
    }

    private extractMedications(text: string): string[] {
        const medicationPattern = /medication[:\s]+(.*?)(?=\n|procedure|diagnosis|$)/gi;
        const matches = text.matchAll(medicationPattern);
        return Array.from(matches).map((m) => m[1] || '').filter(Boolean);
    }

    private extractProcedures(text: string): string[] {
        const procedurePattern = /procedure[:\s]+(.*?)(?=\n|medication|diagnosis|$)/gi;
        const matches = text.matchAll(procedurePattern);
        return Array.from(matches).map((m) => m[1] || '').filter(Boolean);
    }

    private extractMeasurements(text: string): string[] {
        // Extract numbers with units
        const measurementPattern = /(\d+(?:\.\d+)?)\s*(mg|mmHg|bpm|°C|kg|cm|/gi;
        const matches = text.matchAll(measurementPattern);
        return Array.from(matches).map((m) => m[0] || '').filter(Boolean);
    }

    private extractDates(text: string): string[] {
        const datePattern =
            /(\d{1,2}\/\d{1,2}\/\d{4}|\d{1,2}-\d{1,2}-\d{4}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},?\s+\d{4})/gi;
        const matches = text.matchAll(datePattern);
        return Array.from(matches).map((m) => m[0] || '').filter(Boolean);
    }

    /**
     * Save uploaded file
     */
    async saveUploadedFile(
        fileBuffer: Buffer,
        fileName: string,
        userId: string
    ): Promise<string> {
        try {
            const uniqueName = `${userId}-${Date.now()}-${fileName}`;
            const filePath = path.join(this.uploadsDir, uniqueName);

            fs.writeFileSync(filePath, fileBuffer);
            logger.info('File saved', { fileName: uniqueName }, userId);

            return filePath;
        } catch (error) {
            logger.error('File save failed', error as Error, userId);
            throw error;
        }
    }

    /**
     * Delete uploaded file
     */
    async deleteUploadedFile(filePath: string, userId: string): Promise<boolean> {
        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                logger.info('File deleted', { filePath }, userId);
                return true;
            }
            return false;
        } catch (error) {
            logger.error('File delete failed', error as Error, userId);
            return false;
        }
    }
}

export const ocrService = new OCRService();
