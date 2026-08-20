import * as recService from '../services/recommendation.services.mjs';
import { getRetrainStatus } from '../services/scheduler.services.mjs';

/**
 * GET /api/dashboard/user/recommendations
 * Fetches personalized and trending recommendations.
 */
export const getRecommendations = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const [historyBased, trending] = await Promise.all([
      recService.getUserRecommendations(userId),
      recService.getTrendingRecommendations(userId)
    ]);
    
    res.json({
      success: true,
      data: {
        historyBased,
        trending
      }
    });
  } catch (error) {
    console.error('Error fetching recommendations in controller:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch recommendations.' }
    });
  }
};

/**
 * POST /api/dashboard/user/recommendations/renew
 * Invalidates current active feed and regenerates recommendations.
 */
export const renewRecommendations = async (req, res) => {
  try {
    const userId = req.user.userId;
    const historyBased = await recService.renewUserRecommendations(userId);
    
    res.json({
      success: true,
      message: 'Recommendations successfully regenerated.',
      data: {
        historyBased
      }
    });
  } catch (error) {
    console.error('Error renewing recommendations in controller:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to renew recommendations.' }
    });
  }
};

/**
 * POST /api/dashboard/user/recommendations/:bookId/click
 * Records a recommendation click interaction.
 */
export const clickRecommendation = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { bookId } = req.params;
    
    const logged = await recService.logRecommendationClick(userId, bookId);
    
    res.json({
      success: true,
      message: logged ? 'Recommendation click interaction successfully logged.' : 'No active recommendation record updated.'
    });
  } catch (error) {
    console.error('Error tracking recommendation click in controller:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to log recommendation click.' }
    });
  }
};

/**
 * GET /api/dashboard/admin/recommendations/retrain-status
 * Fetches background cron machine learning retraining status.
 */
export const getRetrainingStatusController = async (req, res) => {
  try {
    const status = getRetrainStatus();
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Error fetching retraining status in controller:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch retraining status.' }
    });
  }
};
