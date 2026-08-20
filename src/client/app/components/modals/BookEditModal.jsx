'use client';

import React, { useState, useEffect, useMemo } from 'react';
import ImageUploader from '../ui/ImageUploader';
import { authHeaders } from '../../utils/apiClient';

const LANGUAGE_OPTIONS = [
  { value: 'eng', label: 'English (eng)' },
  { value: 'vie', label: 'Vietnamese (vie)' },
  { value: 'fre', label: 'French (fre)' },
  { value: 'ger', label: 'German (ger)' },
  { value: 'jpn', label: 'Japanese (jpn)' },
  { value: 'zho', label: 'Chinese (zho)' },
];

const BOOK_FORMAT_OPTIONS = [
  { value: 'Paperback', label: 'Paperback' },
  { value: 'Hardcover', label: 'Hardcover' },
  { value: 'Mass Market Paperback', label: 'Mass Market Paperback' },
  { value: 'E-book', label: 'E-book' },
  { value: 'Audiobook', label: 'Audiobook' },
];

export default function BookEditModal({ isOpen, onClose, onSuccess, book, branches }) {
  const [formData, setFormData] = useState({
    title: '',
    original_title: '',
    description: '',
    isbn: '',
    author: '',
    publisher: '',
    publication_date: '',
    price: '',
    num_pages: '',
    language_code: 'eng',
    book_format: 'Paperback',
    genres: '',
    image_url: ''
  });

  const [stockInputs, setStockInputs] = useState({});
  const [availInputs, setAvailInputs] = useState({});
  const [shelfNumberInputs, setShelfNumberInputs] = useState({});
  const [initialStateSnapshot, setInitialStateSnapshot] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  const activeBranches = (branches && branches.length > 0)
    ? branches
    : [
        { branch_id: 1, name: 'Nguyen Van Cu', name_short: 'NVC' },
        { branch_id: 2, name: 'Thu Duc', name_short: 'TD' }
      ];

  // Freeze outer page scroll when modal opens
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const extractShelfNumber = (shelfStr) => {
    if (!shelfStr) return '101';
    const match = String(shelfStr).match(/\d+$/);
    if (match) {
      return match[0].slice(-3);
    }
    const digits = String(shelfStr).replace(/\D/g, '');
    return digits ? digits.slice(-3) : '101';
  };

  useEffect(() => {
    if (book) {
      const loadBookData = (targetBook) => {
        const cover = targetBook.image_url || targetBook.coverImage || targetBook.coverSrc || '';
        const pages = (targetBook.num_pages !== undefined && targetBook.num_pages !== null && targetBook.num_pages !== '')
          ? targetBook.num_pages
          : ((targetBook.numPages !== undefined && targetBook.numPages !== 'N/A') ? targetBook.numPages : '');
        const pr = (targetBook.price !== undefined && targetBook.price !== null) ? targetBook.price : '';

        const initialForm = {
          title: targetBook.title || '',
          original_title: targetBook.original_title || '',
          description: targetBook.description || '',
          isbn: targetBook.isbn || '',
          author: Array.isArray(targetBook.author) ? targetBook.author.join(', ') : (targetBook.author || ''),
          publisher: targetBook.publisher || '',
          publication_date: targetBook.publication_date ? new Date(targetBook.publication_date).toISOString().split('T')[0] : '',
          price: pr,
          num_pages: pages,
          language_code: targetBook.language_code || (targetBook.language ? targetBook.language.toLowerCase() : 'eng'),
          book_format: targetBook.book_format || 'Paperback',
          genres: Array.isArray(targetBook.genres) ? targetBook.genres.join(', ') : (targetBook.genres || ''),
          image_url: cover
        };

        setFormData(initialForm);

        const initialStock = {};
        const initialAvail = {};
        const initialShelf = {};

        const dbStocks = targetBook.branch_stocks || targetBook.inventory || targetBook.branchStocks || [];
        if (Array.isArray(dbStocks)) {
          dbStocks.forEach((s) => {
            const bId = s.branch_id || s.branchId;
            if (bId) {
              initialStock[bId] = s.quantity !== undefined ? s.quantity : 0;
              initialAvail[bId] = s.available_quantity !== undefined ? s.available_quantity : (s.availableCopies !== undefined ? s.availableCopies : initialStock[bId]);
              initialShelf[bId] = extractShelfNumber(s.shelf);
            }
          });
        }

        activeBranches.forEach((b) => {
          if (initialStock[b.branch_id] === undefined) {
            initialStock[b.branch_id] = 0;
            initialAvail[b.branch_id] = 0;
            initialShelf[b.branch_id] = '101';
          }
        });

        setStockInputs(initialStock);
        setAvailInputs(initialAvail);
        setShelfNumberInputs(initialShelf);

        setInitialStateSnapshot({
          formData: initialForm,
          stockInputs: initialStock,
          availInputs: initialAvail,
          shelfNumberInputs: initialShelf
        });
      };

      loadBookData(book);

      const targetId = book.book_id || book.id;
      if (targetId) {
        fetch(`${API_BASE}/api/library/books/${targetId}`, {
          credentials: 'include',
        })
          .then((res) => (res.ok ? res.json() : null))
          .then((fullData) => {
            if (fullData) {
              loadBookData(fullData);
            }
          })
          .catch((err) => console.warn('Optional fetch for full book details failed:', err));
      }
    }
  }, [book, branches]);

  const isModified = useMemo(() => {
    if (!initialStateSnapshot) return false;

    const formChanged = JSON.stringify(formData) !== JSON.stringify(initialStateSnapshot.formData);
    const stockChanged = JSON.stringify(stockInputs) !== JSON.stringify(initialStateSnapshot.stockInputs);
    const availChanged = JSON.stringify(availInputs) !== JSON.stringify(initialStateSnapshot.availInputs);
    const shelfChanged = JSON.stringify(shelfNumberInputs) !== JSON.stringify(initialStateSnapshot.shelfNumberInputs);

    return formChanged || stockChanged || availChanged || shelfChanged;
  }, [formData, stockInputs, availInputs, shelfNumberInputs, initialStateSnapshot]);

  const computeTitleFirstLetter = (t) => {
    const trimmed = (t || '').replace(/^["'“`{\[\(\s]+/, '').trim();
    if (trimmed.length > 0) {
      const firstChar = trimmed.charAt(0).toUpperCase();
      return /[A-Z]/.test(firstChar) ? firstChar : 'X';
    }
    return 'Z';
  };

  const currentTitleLetter = computeTitleFirstLetter(formData.title);

  if (!isOpen || !book) return null;

  const handleStockChange = (branchId, value) => {
    const newQty = Math.max(0, parseInt(value || 0, 10));
    const currentAvail = availInputs[branchId] !== undefined ? availInputs[branchId] : newQty;
    const clampedAvail = Math.min(newQty, currentAvail);

    setStockInputs((prev) => ({ ...prev, [branchId]: newQty }));
    setAvailInputs((prev) => ({ ...prev, [branchId]: clampedAvail }));
  };

  const handleAvailChange = (branchId, value) => {
    const qty = stockInputs[branchId] !== undefined ? parseInt(stockInputs[branchId], 10) : 0;
    const requestedAvail = Math.max(0, parseInt(value || 0, 10));
    const clampedAvail = Math.min(qty, requestedAvail);

    setAvailInputs((prev) => ({ ...prev, [branchId]: clampedAvail }));
  };

  const handleShelfInputChange = (branchId, rawVal) => {
    const digitsOnly = (rawVal || '').replace(/\D/g, '').slice(0, 3);
    setShelfNumberInputs((prev) => ({ ...prev, [branchId]: digitsOnly }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isModified) return;

    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const branch_stocks = activeBranches.map((b) => {
        const qty = parseInt(stockInputs[b.branch_id] || 0, 10);
        const avail = Math.min(qty, parseInt(availInputs[b.branch_id] !== undefined ? availInputs[b.branch_id] : qty, 10));
        const userShelf = (shelfNumberInputs[b.branch_id] || '101').replace(/\D/g, '').slice(0, 3) || '101';
        const shortName = b.name_short || `CS${b.branch_id}`;
        const generatedShelf = `${shortName}.${currentTitleLetter}${userShelf}`;

        return {
          branch_id: b.branch_id,
          quantity: qty,
          available_quantity: avail,
          shelf: generatedShelf,
          user_shelf_number: userShelf
        };
      });

      const payload = {
        ...formData,
        num_pages: formData.num_pages ? parseInt(formData.num_pages, 10) : null,
        price: formData.price ? parseFloat(formData.price) : 0,
        author: formData.author ? formData.author.split(',').map((s) => s.trim()) : [],
        genres: formData.genres ? formData.genres.split(',').map((s) => s.trim()) : [],
        branch_stocks
      };

      const res = await fetch(`${API_BASE}/api/books/${book.book_id || book.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(await authHeaders())
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        const errorText = typeof data.error === 'string' ? data.error : (data.error?.message || data.message || 'Failed to update catalog book.');
        throw new Error(errorText);
      }

      onSuccess();
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Error updating book.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto backdrop-blur-xs font-manrope">
      <div className="bg-white dark:bg-neutral-800 border border-[#E8E2D5] dark:border-neutral-700 rounded-xl shadow-2xl max-w-3xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto modal-custom-scrollbar text-[#1D1C16] dark:text-neutral-100">
        <div className="flex justify-between items-center border-b pb-3 border-[#E8E2D5] dark:border-neutral-700">
          <h2 className="text-xl font-bold text-[#1D1C16] dark:text-neutral-100">
            Edit Book Catalog (ID: {book.book_id || book.id})
          </h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 text-2xl font-bold">
            &times;
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 text-sm text-red-700 bg-red-100 dark:bg-red-950 dark:text-red-300 rounded-md border border-red-200 dark:border-red-800">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 text-sm">
          {/* Title & ISBN */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-1 text-[#1D1C16] dark:text-neutral-200">Title *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-[#E8E2D5] dark:border-neutral-700 rounded-md bg-[#FBF9F5] dark:bg-neutral-900 text-[#1D1C16] dark:text-neutral-100 font-medium outline-none focus:ring-2 focus:ring-[#006F66] dark:focus:ring-teal-400"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-[#1D1C16] dark:text-neutral-200">ISBN *</label>
              <input
                type="text"
                required
                value={formData.isbn}
                onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                className="w-full px-3 py-2 border border-[#E8E2D5] dark:border-neutral-700 rounded-md bg-[#FBF9F5] dark:bg-neutral-900 text-[#1D1C16] dark:text-neutral-100 font-mono outline-none focus:ring-2 focus:ring-[#006F66] dark:focus:ring-teal-400"
              />
            </div>
          </div>

          {/* Language & Book Format */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-1 text-[#1D1C16] dark:text-neutral-200">Language</label>
              <select
                value={formData.language_code}
                onChange={(e) => setFormData({ ...formData, language_code: e.target.value })}
                className="w-full px-3 py-2 border border-[#E8E2D5] dark:border-neutral-700 rounded-md bg-[#FBF9F5] dark:bg-neutral-900 text-[#1D1C16] dark:text-neutral-100 font-medium outline-none focus:ring-2 focus:ring-[#006F66] dark:focus:ring-teal-400"
              >
                {LANGUAGE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-[#1D1C16] dark:text-neutral-200">Book Format</label>
              <select
                value={formData.book_format}
                onChange={(e) => setFormData({ ...formData, book_format: e.target.value })}
                className="w-full px-3 py-2 border border-[#E8E2D5] dark:border-neutral-700 rounded-md bg-[#FBF9F5] dark:bg-neutral-900 text-[#1D1C16] dark:text-neutral-100 font-medium outline-none focus:ring-2 focus:ring-[#006F66] dark:focus:ring-teal-400"
              >
                {BOOK_FORMAT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Authors & Publisher */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-1 text-[#1D1C16] dark:text-neutral-200">Authors (comma separated)</label>
              <input
                type="text"
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                className="w-full px-3 py-2 border border-[#E8E2D5] dark:border-neutral-700 rounded-md bg-[#FBF9F5] dark:bg-neutral-900 text-[#1D1C16] dark:text-neutral-100 outline-none focus:ring-2 focus:ring-[#006F66] dark:focus:ring-teal-400"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-[#1D1C16] dark:text-neutral-200">Publisher</label>
              <input
                type="text"
                value={formData.publisher}
                onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                className="w-full px-3 py-2 border border-[#E8E2D5] dark:border-neutral-700 rounded-md bg-[#FBF9F5] dark:bg-neutral-900 text-[#1D1C16] dark:text-neutral-100 outline-none focus:ring-2 focus:ring-[#006F66] dark:focus:ring-teal-400"
              />
            </div>
          </div>

          {/* Pages, Price, Genres */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold mb-1 text-[#1D1C16] dark:text-neutral-200">Number of Pages</label>
              <input
                type="number"
                value={formData.num_pages}
                onChange={(e) => setFormData({ ...formData, num_pages: e.target.value })}
                placeholder="e.g. 309"
                className="w-full px-3 py-2 border border-[#E8E2D5] dark:border-neutral-700 rounded-md bg-[#FBF9F5] dark:bg-neutral-900 text-[#1D1C16] dark:text-neutral-100 font-mono outline-none focus:ring-2 focus:ring-[#006F66] dark:focus:ring-teal-400"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-[#1D1C16] dark:text-neutral-200">Price ($)</label>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="e.g. 19.99"
                className="w-full px-3 py-2 border border-[#E8E2D5] dark:border-neutral-700 rounded-md bg-[#FBF9F5] dark:bg-neutral-900 text-[#1D1C16] dark:text-neutral-100 font-mono outline-none focus:ring-2 focus:ring-[#006F66] dark:focus:ring-teal-400"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-[#1D1C16] dark:text-neutral-200">Genres (comma separated)</label>
              <input
                type="text"
                value={formData.genres}
                onChange={(e) => setFormData({ ...formData, genres: e.target.value })}
                placeholder="Fantasy, Fiction"
                className="w-full px-3 py-2 border border-[#E8E2D5] dark:border-neutral-700 rounded-md bg-[#FBF9F5] dark:bg-neutral-900 text-[#1D1C16] dark:text-neutral-100 outline-none focus:ring-2 focus:ring-[#006F66] dark:focus:ring-teal-400"
              />
            </div>
          </div>

          {/* Cover Image Upload / URL */}
          <div>
            <ImageUploader
              label="Book Cover Image"
              currentUrl={formData.image_url}
              onImageUploaded={(url) => setFormData({ ...formData, image_url: url })}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block font-semibold mb-1 text-[#1D1C16] dark:text-neutral-200">Description</label>
            <textarea
              rows="4"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Book summary or detailed description..."
              className="w-full px-3 py-2 border border-[#E8E2D5] dark:border-neutral-700 rounded-md bg-[#FBF9F5] dark:bg-neutral-900 text-[#1D1C16] dark:text-neutral-100 outline-none focus:ring-2 focus:ring-[#006F66] dark:focus:ring-teal-400"
            />
          </div>

          {/* Branch Physical Stock Section */}
          <div className="pt-4 border-t border-[#E8E2D5] dark:border-neutral-700 space-y-4">
            <div>
              <h3 className="font-bold text-base text-[#1D1C16] dark:text-neutral-100">
                Branch Physical Stock & Bookshelf Location Configuration
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                Auto-generated location format: <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">&apos;[BranchShortName].{currentTitleLetter}[Number]&apos;</span> (e.g. NVC.B91). Max 3 digits for shelf number.
              </p>
            </div>

            <div className="space-y-4">
              {activeBranches.map((b) => {
                const shortName = b.name_short || `CS${b.branch_id}`;
                const userShelfNum = (shelfNumberInputs[b.branch_id] !== undefined ? shelfNumberInputs[b.branch_id] : '101').replace(/\D/g, '').slice(0, 3);
                const generatedShelf = `${shortName}.${currentTitleLetter}${userShelfNum || '101'}`;

                const qty = stockInputs[b.branch_id] !== undefined ? stockInputs[b.branch_id] : 0;
                const avail = availInputs[b.branch_id] !== undefined ? availInputs[b.branch_id] : qty;

                return (
                  <div
                    key={b.branch_id}
                    className="p-4 bg-[#F8F3E9] dark:bg-neutral-900/60 border border-[#E8E2D5] dark:border-neutral-700 rounded-xl space-y-3"
                  >
                    {/* Header: NVC (1) Nguyen Van Cu */}
                    <div className="flex items-center justify-between border-b pb-2 border-[#E8E2D5] dark:border-neutral-700">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 px-2.5 py-1 rounded-md border border-indigo-200 dark:border-indigo-800">
                          {shortName} ({b.branch_id})
                        </span>
                        <span className="font-bold text-sm text-[#1D1C16] dark:text-neutral-100">{b.name}</span>
                      </div>
                      <span className="text-xs font-mono font-bold text-indigo-800 dark:text-indigo-300 bg-white dark:bg-neutral-800 px-2.5 py-1 rounded-md border border-indigo-200 dark:border-indigo-800">
                        {generatedShelf}
                      </span>
                    </div>

                    {/* Inputs */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                      {/* Quantity */}
                      <div>
                        <label className="font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                          Quantity:
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={qty}
                          onChange={(e) => handleStockChange(b.branch_id, e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-[#E8E2D5] dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-900 font-mono font-bold text-[#1D1C16] dark:text-neutral-100"
                        />
                      </div>

                      {/* Available for borrowing */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="font-semibold text-neutral-700 dark:text-neutral-300">
                            Available for borrowing:
                          </label>
                        </div>
                        <input
                          type="number"
                          min="0"
                          max={qty}
                          value={avail}
                          onChange={(e) => handleAvailChange(b.branch_id, e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-[#E8E2D5] dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-900 font-mono font-bold text-emerald-600 dark:text-emerald-400"
                        />
                        <span className="text-[10px] text-neutral-400 italic block mt-1">(must not exceed Quantity)</span>
                      </div>

                      {/* Shelf Input */}
                      <div>
                        <label className="font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                          Shelf Number (max 3 digits):
                        </label>
                        <input
                          type="text"
                          maxLength={3}
                          value={userShelfNum}
                          onChange={(e) => handleShelfInputChange(b.branch_id, e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-[#E8E2D5] dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-900 font-mono text-xs text-[#1D1C16] dark:text-neutral-100"
                          placeholder="e.g. 91 or 101"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-[#E8E2D5] dark:border-neutral-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-[#F8F3E9] dark:hover:bg-neutral-700 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !isModified}
              className={`px-5 py-2 text-sm font-bold text-white rounded-md transition-colors shadow-sm ${
                isSubmitting || !isModified
                  ? 'bg-indigo-400 dark:bg-indigo-950/60 opacity-50 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 cursor-pointer'
              }`}
            >
              {isSubmitting ? 'Updating...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
