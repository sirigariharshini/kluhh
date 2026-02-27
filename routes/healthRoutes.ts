// backend/routes/healthRoutes.ts
// Health metrics API endpoints

import { Router, Response } from 'express';
import { supabase } from '../config/supabase';
import { verifyAuth, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { healthMetricSchema } from '../utils/validation';

const router = Router();

// All health routes require authentication
router.use(verifyAuth);

/**
 * POST /api/health - Add health metric
 */
router.post(
  '/',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const { heartRate, oxygen, temperature, bloodPressure, notes } = req.body;

    // Validate input
    const validation = healthMetricSchema.safeParse({
      user_id: userId,
      heartRate,
      oxygen,
      temperature,
      bloodPressure,
      notes,
    });

    if (!validation.success) {
      return res.status(400).json({ errors: validation.error.errors });
    }

    // Save to Supabase
    const { data, error } = await supabase
      .from('health_metrics')
      .insert([
        {
          user_id: userId,
          heart_rate: heartRate,
          oxygen_level: oxygen,
          temperature,
          blood_pressure: bloodPressure,
          notes,
        },
      ])
      .select()
      .single();

    if (error) {
      logger.error('Failed to save health metric', error as Error, userId);
      return res.status(500).json({ error: 'Failed to save health metric' });
    }

    res.status(201).json(data);
  })
);

/**
 * GET /api/health - Get user's health metrics
 */
router.get(
  '/',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 500);

    const { data, error } = await supabase
      .from('health_metrics')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      logger.error('Failed to fetch health metrics', error as Error, userId);
      return res.status(500).json({ error: 'Failed to fetch metrics' });
    }

    res.json(data);
  })
);

/**
 * GET /api/health/stats/summary - Get health summary
 */
router.get(
  '/stats/summary',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;

    // Get latest metric
    const { data: latestData } = await supabase
      .from('health_metrics')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Get average over last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: weekData } = await supabase
      .from('health_metrics')
      .select('heart_rate, oxygen_level, temperature')
      .eq('user_id', userId)
      .gte('created_at', sevenDaysAgo.toISOString());

    let avgHeartRate = 0;
    let avgOxygen = 0;
    let avgTemperature = 0;

    if (weekData && weekData.length > 0) {
      avgHeartRate =
        weekData.reduce((sum, m) => sum + (m.heart_rate || 0), 0) / weekData.length;
      avgOxygen = weekData.reduce((sum, m) => sum + (m.oxygen_level || 0), 0) / weekData.length;
      avgTemperature =
        weekData.reduce((sum, m) => sum + (m.temperature || 0), 0) / weekData.length;
    }

    res.json({
      latest: latestData,
      weeklyAverage: {
        heartRate: Math.round(avgHeartRate),
        oxygen: Math.round(avgOxygen * 10) / 10,
        temperature: Math.round(avgTemperature * 10) / 10,
      },
      totalReadings: weekData?.length || 0,
    });
  })
);

/**
 * DELETE /api/health/:metricId - Delete health metric
 */
router.delete(
  '/:metricId',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { metricId } = req.params;
    const userId = req.user!.id;

    const { error } = await supabase
      .from('health_metrics')
      .delete()
      .eq('id', metricId)
      .eq('user_id', userId);

    if (error) {
      logger.error('Failed to delete metric', error as Error, userId);
      return res.status(500).json({ error: 'Failed to delete metric' });
    }

    res.json({ success: true });
  })
);

export default router;
