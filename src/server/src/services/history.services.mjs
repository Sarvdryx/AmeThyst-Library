import { createSearchHistory, addClickedBook, getSearchHistoryByUserId, getTopRecentSearches } from '../models/history.models.mjs';

/**
 * Logs search query and configuration for an authenticated user.
 * 
 * @param {string} userId - The user ID
 * @param {string} query - The search query string
 * @param {object} filters - The active filters
 * @param {string|null} bookClicked - Optional clicked book ID
 * @returns {Promise<object|null>} The logged entry or null if skipped
 */
export const logSearchHistory = async (userId, query, filters, bookClicked = null) => {
  if (!userId) return null;

  const cleanQuery = query && query.trim() ? query.trim() : null;
  const hasFilters = filters && Object.keys(filters).length > 0;

  if (!cleanQuery && !hasFilters && !bookClicked) {
    console.log('Skipping search history log for empty query, empty filters, and no book click.');
    return null;
  }

  try {
    return await createSearchHistory(userId, cleanQuery, filters, bookClicked);
  } catch (error) {
    console.error('Error logging search history:', error);
    return null;
  }
};

/**
 * Retrieves top 5 recent search entries for a given user.
 * 
 * @param {string} userId - The user ID
 * @param {number} limit - Maximum number of search terms
 * @returns {Promise<Array>} List of recent search objects
 */
export const getTopRecentSearchesService = async (userId, limit = 5) => {
  if (!userId) return [];
  try {
    return await getTopRecentSearches(userId, limit);
  } catch (error) {
    console.error('Error fetching top recent searches:', error);
    return [];
  }
};

/**
 * Retrieves search history entries for a given user.
 * 
 * @param {string} userId - The user ID
 * @returns {Promise<Array>} List of user search histories
 */
export const getUserSearchHistory = async (userId) => {
  if (!userId) return [];
  try {
    return await getSearchHistoryByUserId(userId);
  } catch (error) {
    console.error('Error fetching user search history:', error);
    return [];
  }
};

/**
 * Appends a book ID to a search history's click log.
 * 
 * @param {string} searchHistoryId - UUID of the search log
 * @param {string} bookId - ID of the clicked book
 * @returns {Promise<object|null>} The updated history or null
 */
export const logBookClick = async (searchHistoryId, bookId) => {
  if (!searchHistoryId || !bookId) {
    throw new Error('Missing searchHistoryId or bookId');
  }
  try {
    return await addClickedBook(searchHistoryId, bookId);
  } catch (error) {
    console.error('Error logging book click interaction:', error);
    throw error;
  }
};
