import { executeSearch } from '../services/search.services.mjs';
import { logSearchHistory } from '../services/history.services.mjs';

/**
 * Executes hybrid search and logs history for logged-in users.
 * POST /api/search
 */
export const searchBooks = async (req, res) => {
  try {
    const { query, logHistory = true, filters } = req.body;

    // 1. Run the hybrid search (exact keyword + trigram typo tolerance + semantic vector)
    const books = await executeSearch(query, filters);

    // 2. Log search history if user is authenticated and logHistory is true
    let searchHistoryId = null;
    if (logHistory && req.user && req.user.userId) {
      const historyEntry = await logSearchHistory(req.user.userId, query, filters);
      if (historyEntry) {
        searchHistoryId = historyEntry.id;
      }
    }

    // 3. Send response according to contract
    return res.status(200).json({
      books,
      totalResults: books.length,
      searchHistoryId
    });
  } catch (error) {
    console.error('Error in searchBooks controller:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
