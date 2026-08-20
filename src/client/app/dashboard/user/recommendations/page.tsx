'use client';

import { useState, useEffect, useCallback } from 'react';
import RecommendationCarousel from '../../../components/organisms/RecommendationCarousel';
import { useI18n } from '../../../providers/I18nProvider';
import { apiFetch } from '../../../utils/apiClient';

interface RecommendedBook {
  id: string;
  title: string;
  author: string;
  coverImage: string;
}

export default function RecommendationsPage() {
  const { t } = useI18n();
  const [historyBooks, setHistoryBooks] = useState<RecommendedBook[]>([]);
  const [trendingBooks, setTrendingBooks] = useState<RecommendedBook[]>([]);
  const [wishlistBooks, setWishlistBooks] = useState<RecommendedBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [renewing, setRenewing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendations = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    setError(null);
    try {
      const [recommendationResult, wishlistResult] = await Promise.all([
        apiFetch<{ historyBased: RecommendedBook[]; trending: RecommendedBook[] }>('/api/dashboard/user/recommendations'),
        apiFetch<any[]>('/api/wishlist')
      ]);
      if (recommendationResult.success && recommendationResult.data) {
        setHistoryBooks(recommendationResult.data.historyBased || []);
        setTrendingBooks(recommendationResult.data.trending || []);
      } else {
        throw new Error(recommendationResult.message || 'Failed to parse response');
      }

      // Map wishlist books to match the RecommendedBook interface keys
      const mappedWishlist = (wishlistResult.data || []).map((item: any) => ({
        id: item.id,
        title: item.title,
        author: item.author,
        coverImage: item.coverImage
      }));
      setWishlistBooks(mappedWishlist);
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      setError(t('dashboard.error_fetching') || 'Could not load recommendations. Please try again later.');
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  const handleRenew = async () => {
    setRenewing(true);
    setError(null);
    try {
      const result = await apiFetch<{ historyBased: RecommendedBook[] }>('/api/dashboard/user/recommendations/renew', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (result.success && result.data) {
        setHistoryBooks(result.data.historyBased || []);
      } else {
        throw new Error(result.message || 'Failed to parse renew response');
      }
    } catch (err) {
      console.error('Error renewing recommendations:', err);
      setError(t('dashboard.error_renewing') || 'Failed to renew recommendations. Please try again.');
    } finally {
      setRenewing(false);
    }
  };

  return (
    <div className="flex flex-col w-full min-w-0 gap-8 pb-12">
      {/* Header section with Renew Action */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#C5C6CD] dark:border-neutral-600 pb-4">
        <div>
          <h1 className="text-[#091426] dark:text-neutral-100 text-3xl font-manrope font-bold leading-tight">
            {t('dashboard.recommendations_title') || 'AI Recommendations'}
          </h1>
          <p className="text-gray-500 dark:text-neutral-400 font-inter text-sm mt-1">
            {t('dashboard.recommendations_subtitle') || 'Personalized suggestions based on your reading history and preferences.'}
          </p>
        </div>
        <button
          onClick={handleRenew}
          disabled={loading || renewing}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#006F66] text-white font-semibold font-inter text-sm rounded-lg hover:bg-[#005c54] active:scale-95 transition-all shadow-sm disabled:opacity-50 disabled:pointer-events-none"
        >
          <svg
            className={`w-6 h-6 flex-none shrink-0 text-white ${renewing ? 'animate-spin' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
              d="M20 11A8 8 0 1 1 17.33 5.33L20 8M20 3v5h-5"
            />
          </svg>
          {renewing 
            ? (t('dashboard.renewing') || 'Renewing...') 
            : (t('dashboard.renew_recommendations') || 'Renew')}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-pulse flex flex-col items-center gap-2">
            <div className="h-4 w-24 bg-gray-200 dark:bg-neutral-700 rounded"></div>
            <span className="text-gray-500 dark:text-neutral-400 font-inter text-sm">
              {t('dashboard.loading') || 'Loading recommendations...'}
            </span>
          </div>
        </div>
      ) : error ? (
        <div className="flex flex-col justify-center items-center h-64 gap-4 bg-red-50 dark:bg-neutral-900/30 border border-red-100 dark:border-red-950/20 rounded-xl p-6">
          <span className="text-red-500 dark:text-red-400 font-inter text-sm font-semibold">{error}</span>
          <button
            onClick={() => fetchRecommendations()}
            className="px-5 py-2 bg-[#006F66] text-white rounded-lg font-inter text-sm font-semibold hover:bg-[#005c54] transition shadow-sm"
          >
            {t('dashboard.retry') || 'Retry'}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <RecommendationCarousel
            books={historyBooks}
            title={t('dashboard.recommended_for_you') || 'Based on your reading history'}
            emptyFallback={
              <div className="text-center py-12 border-2 border-dashed border-[#C5C6CD] dark:border-neutral-700 rounded-xl bg-gray-50/50 dark:bg-neutral-900/10 text-gray-500 dark:text-neutral-400 font-inter text-sm">
                {t('dashboard.recommendations_empty') || 'Start reading or add books to your wishlist to unlock personalized recommendations!'}
              </div>
            }
          />

          <RecommendationCarousel
            books={trendingBooks}
            title={t('dashboard.trending_this_week') || 'Trending this week'}
            emptyFallback={
              <div className="text-center py-12 border-2 border-dashed border-[#C5C6CD] dark:border-neutral-700 rounded-xl bg-gray-50/50 dark:bg-neutral-900/10 text-gray-500 dark:text-neutral-400 font-inter text-sm">
                {t('dashboard.trending_empty') || 'No trending books available right now.'}
              </div>
            }
          />

          <RecommendationCarousel
            books={wishlistBooks}
            title={t('dashboard.my_wishlist') || 'My Wishlist'}
            emptyFallback={
              <div className="text-center py-12 border-2 border-dashed border-[#C5C6CD] dark:border-neutral-700 rounded-xl bg-gray-50/50 dark:bg-neutral-900/10 text-gray-500 dark:text-neutral-400 font-inter text-sm">
                {t('dashboard.wishlist_empty') || 'Your wishlist is empty. Explore books and click the heart icon to save them here!'}
              </div>
            }
          />
        </div>
      )}
    </div>
  );
}
