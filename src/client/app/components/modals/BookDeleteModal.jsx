'use client';

import React, { useState, useEffect } from 'react';
import { authHeaders } from '../../utils/apiClient';

export default function BookDeleteModal({ isOpen, onClose, onSuccess, book, targetBranchId = null }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

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

  if (!isOpen || !book) return null;

  const handleDelete = async () => {
    setErrorMsg('');
    setIsDeleting(true);

    try {
      let url = `${API_BASE}/api/books/${book.book_id}`;
      if (targetBranchId) {
        url += `?branch_id=${targetBranchId}`;
      }

      const res = await fetch(url, {
        method: 'DELETE',
        headers: await authHeaders(),
        credentials: 'include',
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete book/stock.');
      }

      onSuccess();
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Error deleting book/stock record.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
        <h2 className="text-lg font-bold text-red-600 dark:text-red-400">Confirm Removal</h2>

        {errorMsg ? (
          <div className="p-3 text-sm text-red-700 bg-red-100 dark:bg-red-950 dark:text-red-300 rounded-md">
            {errorMsg}
          </div>
        ) : (
          <p className="text-sm text-slate-700 dark:text-slate-300">
            Are you sure you want to delete {targetBranchId ? `stock at Branch ${targetBranchId}` : `the entire book catalog entry`} for{' '}
            <strong className="text-slate-900 dark:text-slate-100">&quot;{book.title}&quot;</strong>? This action will remove rows from PostgreSQL database and Memgraph.
          </p>
        )}

        <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors disabled:opacity-50"
          >
            {isDeleting ? 'Removing...' : 'Confirm Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
