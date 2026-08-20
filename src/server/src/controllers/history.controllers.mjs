import { getUserSearchHistory, getTopRecentSearchesService, logBookClick, logSearchHistory } from '../services/history.services.mjs';

/**
 * Retrieves top recent search history for the authenticated user.
 * GET /api/search/history?limit=5
 */
export const getHistory = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(200).json({ success: true, history: [], data: [] });
    }
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 5;
    const history = await getTopRecentSearchesService(userId, limit);
    return res.status(200).json({ success: true, history, data: history });
  } catch (error) {
    console.error('Error in getHistory controller:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Saves or updates a recent search query for the authenticated user.
 * POST /api/search/history
 */
export const saveHistory = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const { search_content, query, filters } = req.body;
    const term = search_content || query;
    if (!term || !term.trim()) {
      return res.status(400).json({ success: false, error: 'search_content is required' });
    }
    const entry = await logSearchHistory(userId, term, filters);
    return res.status(201).json({ success: true, data: entry });
  } catch (error) {
    console.error('Error in saveHistory controller:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Logs click interaction on a book card.
 * POST /api/search/history/click
 */
export const logClick = async (req, res) => {
  try {
    const { searchHistoryId, bookId, query, searchMode = 'standard', filters } = req.body;
    
    if (!bookId) {
      return res.status(400).json({ error: 'Missing bookId' });
    }

    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: User must be logged in to log interaction history.' });
    }

    let updatedHistory;
    if (!searchHistoryId) {
      updatedHistory = await logSearchHistory(userId, query, filters, bookId);
    } else {
      updatedHistory = await logBookClick(searchHistoryId, bookId);
    }

    if (!updatedHistory) {
      return res.status(404).json({ error: 'Search history entry not found or failed to log click' });
    }

    return res.status(200).json({
      message: 'Click interaction logged successfully',
      searchHistoryId: updatedHistory.id,
      bookClicked: updatedHistory.bookClicked
    });
  } catch (error) {
    console.error('Error in logClick controller:', error);
    return res.status(500).json({ error: error.message });
  }
};
