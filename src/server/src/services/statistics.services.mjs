import {
  getBranchesModel,
  getSummaryMetricsModel,
  getTopCategoriesModel,
  getTopBorrowedBooksModel,
  getTopReservedRoomsModel,
  getStudyGroupRoomReservationsByBranchModel,
} from '../models/statistics.models.mjs';

/**
 * Service to aggregate Admin Statistics Dashboard data
 */
export const getAdminStatisticsService = async ({ timeframe = 'week', branchId = 'all' }) => {
  try {
    const [
      branches,
      summaryMetrics,
      topCategories,
      topBooks,
      topRoomsByBranch,
      studyGroupRoomReservationsByBranch,
    ] = await Promise.all([
      getBranchesModel(),
      getSummaryMetricsModel({ timeframe, branchId }),
      getTopCategoriesModel({ timeframe, branchId }),
      getTopBorrowedBooksModel({ timeframe, branchId }),
      getTopReservedRoomsModel({ timeframe, branchId }),
      getStudyGroupRoomReservationsByBranchModel({ timeframe }),
    ]);

    return {
      filter: {
        timeframe,
        branchId,
      },
      branches,
      summaryMetrics,
      topCategories,
      topBooks,
      topRoomsByBranch,
      studyGroupRoomReservationsByBranch,
    };
  } catch (error) {
    console.error('Error in getAdminStatisticsService:', error);
    throw error;
  }
};
