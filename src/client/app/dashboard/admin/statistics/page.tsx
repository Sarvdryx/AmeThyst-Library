"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useI18n } from '../../../providers/I18nProvider';
import { apiFetch } from '../../../utils/apiClient';
import StatisticsHeaderFilter from '../../../components/admin/statistics/StatisticsHeaderFilter';
import KpiSummaryRow from '../../../components/admin/statistics/KpiSummaryRow';
import TopCategoriesBarChart from '../../../components/admin/statistics/TopCategoriesBarChart';
import TopBorrowedBooksCard from '../../../components/admin/statistics/TopBorrowedBooksCard';
import TopReservedRoomsCard from '../../../components/admin/statistics/TopReservedRoomsCard';
import BranchStudyGroupPieCharts from '../../../components/admin/statistics/BranchStudyGroupPieCharts';

export default function AdminStatisticsPage() {
  const { t } = useI18n();
  const [timeframe, setTimeframe] = useState<'week' | 'month'>('week');
  
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState<boolean>(true);
  
  const [statsData, setStatsData] = useState<{
    branches?: Array<{ branch_id: number; name: string; name_short: string }>;
    summaryMetrics?: {
      totalUsers: number;
      usersGrowthPct: number;
      activeBorrows: number;
      totalBorrows: number;
      overdueBooksCount: number;
      totalLateFees: number;
    };
    topCategories?: Array<{
      rank: number;
      categoryId: string;
      categoryName: string;
      borrowTurns: number;
      percentageShare: number;
    }>;
    topBooks?: Array<{
      rank: number;
      bookId: string;
      title: string;
      coverUrl: string;
      borrowCount: number;
      popularityPct: number;
    }>;
    topRoomsByBranch?: Array<{
      roomId: string;
      roomName: string;
      branchId: string;
      branchName: string;
      reservationTurns: number;
    }>;
    studyGroupRoomReservationsByBranch?: Array<{
      branchId: number;
      branchName: string;
      branchShort: string;
      totalHours: number;
      slices: Array<{
        id: string;
        title: string;
        subject: string;
        reservationCount: number;
        totalHours: number;
        percentage: number;
        color: string;
      }>;
    }>;
  }>({});

  const fetchStatistics = useCallback(async () => {
    if (!isAuthorized) return;
    setLoading(true);
    setError(null);

    try {
      const res = await apiFetch<any>(
        `/api/admin/statistics?timeframe=${timeframe}&branch_id=all`
      );

      if (res.success && res.data) {
        const payload = res.data.summaryMetrics ? res.data : (res.data.data || res.data);
        setStatsData(payload);
      } else {
        if (res.error?.code === 'FORBIDDEN' || res.message?.includes('Forbidden')) {
          setIsAuthorized(false);
        }
        setError(res.message || 'Failed to fetch statistics data.');
      }
    } catch (err) {
      console.error('Error fetching admin statistics:', err);
      setError('An error occurred while loading statistics data.');
    } finally {
      setLoading(false);
    }
  }, [timeframe, isAuthorized]);

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-neutral-800 rounded-3xl p-8 shadow-sm border border-red-200 dark:border-red-900/50">
        <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center text-red-600 dark:text-red-400 mb-4">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
        </div>
        <h2 className="text-xl font-bold font-hankenGrotesk text-red-600 dark:text-red-400 mb-2">
          {t('admin.unauthorized_access')}
        </h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-md">
          {t('admin.unauthorized_desc')}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 w-full">
      {/* Header & Filter Controls */}
      <StatisticsHeaderFilter
        timeframe={timeframe}
        setTimeframe={setTimeframe}
      />

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-black/20 dark:border-white/20 border-t-black dark:border-t-white rounded-full animate-spin" />
            <span className="text-sm font-medium text-stone-500 dark:text-neutral-400">
              {t('admin.loading_statistics')}
            </span>
          </div>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 rounded-2xl border border-red-200 dark:border-red-900 flex justify-between items-center">
          <span>{error}</span>
          <button
            type="button"
            onClick={fetchStatistics}
            className="px-4 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition"
          >
            {t('admin.retry')}
          </button>
        </div>
      ) : (
        <>
          {/* Executive KPI Summary Cards */}
          <KpiSummaryRow summaryMetrics={statsData.summaryMetrics} />

          {/* Top 10 Book Categories Borrow Turns Bar Chart */}
          <TopCategoriesBarChart categories={statsData.topCategories || []} />

          {/* Study Group Room Reservation Pie Charts per Branch */}
          <BranchStudyGroupPieCharts branchData={statsData.studyGroupRoomReservationsByBranch || []} />

          {/* Top Borrowed Books & Top Reserved Rooms by Branch */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
            <TopBorrowedBooksCard books={statsData.topBooks || []} />
            <TopReservedRoomsCard rooms={statsData.topRoomsByBranch || []} />
          </div>
        </>
      )}
    </div>
  );
}
