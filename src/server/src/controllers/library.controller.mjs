import {
  getBookById,
  getRecommendations,
  getRelatedBooks as getRelatedBooksService,
  getBooksList,
  createReservation,
  createBookService,
  updateBookService,
  deleteBookService,
  getAllBranchesService
} from '../services/library.services.mjs';
import { uploadToCloudinary } from '../services/user.services.mjs';

const getAllBooks = async (req, res) => {
  try {
    const page = req.query.page === undefined ? 1 : Number(req.query.page);
    const limit = req.query.limit === undefined ? 24 : Number(req.query.limit);
    if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) {
      return res.status(400).json({ error: 'page must be >= 1 and limit must be between 1 and 100' });
    }
    const { genres, branches, availableOnly, startYear, endYear } = req.query;

    const filters = {
      genres: genres ? genres.split(',') : [],
      branches: branches ? branches.split(',').map(Number) : [],
      availableOnly: availableOnly === 'true',
      startYear: startYear ? parseInt(startYear) : null,
      endYear: endYear ? parseInt(endYear) : null
    };

    const result = await getBooksList(page, limit, filters);
    res.json(result);
  } catch (error) {
    console.error('Error fetching books from database:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const getBookDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    const book = await getBookById(id, userId);
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }
    res.json(book);
  } catch (error) {
    console.error('Error fetching book details:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const getBookRecommendations = async (req, res) => {
  try {
    const { id } = req.params;
    const recommendations = await getRecommendations(id);
    res.json(recommendations);
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const getRelatedBooks = async (req, res) => {
  try {
    const { id } = req.params;
    const related = await getRelatedBooksService(id);
    res.json(related);
  } catch (error) {
    console.error('Error fetching related books:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const reserveBook = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { bookId, branchId } = req.body;

    if (!bookId || !branchId) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_PARAMETERS', message: 'bookId and branchId are required' }
      });
    }

    const result = await createReservation(userId, bookId, branchId);

    if (result.error) {
      return res.status(result.statusCode || 400).json({
        success: false,
        error: result.error
      });
    }

    res.status(201).json({ success: true, data: result.reservation });
  } catch (error) {
    console.error('Error reserving book:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' }
    });
  }
};

const createBook = async (req, res) => {
  try {
    const createdBook = await createBookService(req.body);
    res.status(201).json({ success: true, data: createdBook });
  } catch (error) {
    console.error('Error in createBook controller:', error);
    const statusCode = error.statusCode || (error.code === '23505' ? 400 : 500);
    res.status(statusCode).json({
      success: false,
      error: error.message || 'Failed to create book',
      code: error.code || 'CREATE_BOOK_FAILED'
    });
  }
};

const updateBook = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedBook = await updateBookService(id, req.body);
    res.json({ success: true, data: updatedBook });
  } catch (error) {
    console.error('Error in updateBook controller:', error);
    const statusCode = error.statusCode || (error.code === '23505' ? 400 : 500);
    res.status(statusCode).json({
      success: false,
      error: error.message || 'Failed to update book',
      code: error.code || 'UPDATE_BOOK_FAILED'
    });
  }
};

const deleteBook = async (req, res) => {
  try {
    const { id } = req.params;
    const branchId = req.query.branch_id ? parseInt(req.query.branch_id, 10) : null;
    const result = await deleteBookService(id, branchId);
    res.json(result);
  } catch (error) {
    console.error('Error in deleteBook controller:', error);
    res.status(500).json({ error: error.message || 'Failed to delete book' });
  }
};

const getBranches = async (req, res) => {
  try {
    const branches = await getAllBranchesService();
    res.json(branches);
  } catch (error) {
    console.error('Error fetching branches:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const uploadCoverController = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided for book cover upload' });
    }
    const secureUrl = await uploadToCloudinary(req.file.buffer);
    res.json({ success: true, image_url: secureUrl });
  } catch (error) {
    console.error('Error uploading book cover to Cloudinary:', error);
    res.status(500).json({ error: error.message || 'Failed to upload cover image to Cloudinary' });
  }
};

export {
  getAllBooks,
  getBookDetails,
  getBookRecommendations,
  getRelatedBooks,
  reserveBook,
  createBook,
  updateBook,
  deleteBook,
  getBranches,
  uploadCoverController
};
