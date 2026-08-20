import { apiFetch } from './apiClient';

export interface RecentSearchItem {
  id: string;
  userId: string;
  searchContent: string;
  timestamp: string;
}

/**
 * Fetches top recent search queries for the logged in user.
 */
export async function getTopRecentSearches(limit = 5): Promise<RecentSearchItem[]> {
  try {
    const res = await apiFetch<RecentSearchItem[] | { history: RecentSearchItem[] }>(`/api/search/history?limit=${limit}`);
    if (res.success && res.data) {
      if (Array.isArray(res.data)) {
        return res.data;
      }
      if ('history' in res.data && Array.isArray((res.data as any).history)) {
        return (res.data as any).history;
      }
    }
    return [];
  } catch (err) {
    console.error('Error fetching recent searches:', err);
    return [];
  }
}

/**
 * Records or updates a recent search query for the logged in user.
 */
export async function saveRecentSearch(searchContent: string): Promise<boolean> {
  if (!searchContent || !searchContent.trim()) return false;
  try {
    const res = await apiFetch('/api/search/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ search_content: searchContent.trim() })
    });
    return res.success;
  } catch (err) {
    console.error('Error saving recent search:', err);
    return false;
  }
}
