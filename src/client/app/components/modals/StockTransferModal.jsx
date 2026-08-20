'use client';

import React, { useState, useEffect } from 'react';
import { authHeaders } from '../../utils/apiClient';

export default function StockTransferModal({ isOpen, onClose, onSuccess, book, branches }) {
  const [fromBranchId, setFromBranchId] = useState('');
  const [toBranchId, setToBranchId] = useState('');
  const [transferQty, setTransferQty] = useState(1);
  const [destShelfNum, setDestShelfNum] = useState('101');
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const handleTransfer = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!fromBranchId || !toBranchId) {
      setErrorMsg('Please select both source and destination branches.');
      return;
    }

    if (fromBranchId === toBranchId) {
      setErrorMsg('Source and destination branches must be different.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        book_id: book.book_id,
        from_branch_id: parseInt(fromBranchId, 10),
        to_branch_id: parseInt(toBranchId, 10),
        transfer_quantity: parseInt(transferQty, 10),
        destination_shelf_number: destShelfNum
      };

      const res = await fetch(`${API_BASE}/api/books/transfer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(await authHeaders())
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to transfer stock.');
      }

      onSuccess();
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Error transferring inventory.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
        <div className="flex justify-between items-center border-b pb-3 border-slate-200 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Inter-Branch Stock Transfer</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl font-bold">
            &times;
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 text-sm text-red-700 bg-red-100 dark:bg-red-950 dark:text-red-300 rounded-md">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleTransfer} className="space-y-4 text-sm text-slate-800 dark:text-slate-200">
          <div>
            <label className="block font-medium mb-1">Source Branch</label>
            <select
              required
              value={fromBranchId}
              onChange={(e) => setFromBranchId(e.target.value)}
              className="w-full px-3 py-2 border rounded-md dark:bg-slate-800 dark:border-slate-700 text-slate-900 dark:text-slate-100"
            >
              <option value="">-- Select Source Branch --</option>
              {(book.branch_stocks || []).map((s) => {
                const branchObj = branches?.find((b) => b.branch_id === s.branch_id);
                return (
                  <option key={s.branch_id} value={s.branch_id}>
                    {branchObj ? branchObj.name : `Branch ${s.branch_id}`} (Avail: {s.available_quantity})
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="block font-medium mb-1">Destination Branch</label>
            <select
              required
              value={toBranchId}
              onChange={(e) => setToBranchId(e.target.value)}
              className="w-full px-3 py-2 border rounded-md dark:bg-slate-800 dark:border-slate-700 text-slate-900 dark:text-slate-100"
            >
              <option value="">-- Select Destination Branch --</option>
              {(branches || []).map((b) => (
                <option key={b.branch_id} value={b.branch_id}>
                  {b.name} ({b.name_short})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium mb-1">Transfer Quantity</label>
              <input
                type="number"
                min="1"
                required
                value={transferQty}
                onChange={(e) => setTransferQty(e.target.value)}
                className="w-full px-3 py-2 border rounded-md dark:bg-slate-800 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Dest. Shelf No.</label>
              <input
                type="text"
                required
                value={destShelfNum}
                onChange={(e) => setDestShelfNum(e.target.value)}
                placeholder="201"
                className="w-full px-3 py-2 border rounded-md dark:bg-slate-800 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Transferring...' : 'Execute Transfer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
