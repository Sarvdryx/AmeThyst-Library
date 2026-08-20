import { getAdminStatisticsService } from '../services/statistics.services.mjs';

/**
 * GET /api/admin/statistics
 * Controller for returning Admin Statistics Dashboard dataset
 */
export const getAdminStatistics = async (req, res) => {
  try {
    const timeframe = req.query.timeframe === 'month' ? 'month' : 'week';
    const branchId = req.query.branch_id || 'all';

    const data = await getAdminStatisticsService({ timeframe, branchId });

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error in getAdminStatistics controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve admin statistics data.',
    });
  }
};
