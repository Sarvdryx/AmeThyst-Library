import * as wishlistService from '../services/wishlist.services.mjs';

/**
 * Retrieves the wishlist of the authenticated user.
 * GET /api/wishlist
 */
export const getWishlist = async (req, res) => {
  try {
    const userId = req.user.userId;
    const wishlist = await wishlistService.getUserWishlist(userId);
    return res.status(200).json(wishlist);
  } catch (error) {
    console.error('Error in getWishlist controller:', error);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Checks the wishlist status of a specific book for the authenticated user.
 * GET /api/wishlist/status/:bookId
 */
export const checkStatus = async (req, res) => {
  try {
    const { bookId } = req.params;
    const userId = req.user.userId;
    const wishlisted = await wishlistService.checkWishlistStatus(userId, bookId);
    return res.status(200).json({ wishlisted });
  } catch (error) {
    console.error('Error in checkStatus controller:', error);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Adds a book to the authenticated user's wishlist.
 * POST /api/wishlist/:bookId
 */
export const addBook = async (req, res) => {
  try {
    const { bookId } = req.params;
    const userId = req.user.userId;

    const isWishlisted = await wishlistService.checkWishlistStatus(userId, bookId);
    if (isWishlisted) {
      return res.status(400).json({ error: 'Book is already in the wishlist' });
    }

    await wishlistService.addToWishlist(userId, bookId);
    return res.status(200).json({
      success: true,
      message: 'Book successfully added to wishlist'
    });
  } catch (error) {
    console.error('Error in addBook controller:', error);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Removes a book from the authenticated user's wishlist.
 * DELETE /api/wishlist/:bookId
 */
export const removeBook = async (req, res) => {
  try {
    const { bookId } = req.params;
    const userId = req.user.userId;

    await wishlistService.removeFromWishlist(userId, bookId);
    return res.status(200).json({
      success: true,
      message: 'Book successfully removed from wishlist'
    });
  } catch (error) {
    console.error('Error in removeBook controller:', error);
    if (error.message.includes('not in')) {
      return res.status(404).json({ error: error.message });
    }
    return res.status(500).json({ error: error.message });
  }
};
