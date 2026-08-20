'use client';

import React, { useState, useEffect } from 'react';
import { authHeaders } from '../../utils/apiClient';

/**
 * Reusable ImageUploader Component.
 * Supports:
 * 1. Entering an external web image URL (instantly updates image_url in books table).
 * 2. Uploading local image files from device.
 * 3. Live image preview rendering with graceful fallback.
 */
export default function ImageUploader({
  imageUrl,
  currentUrl,
  onImageChange,
  onImageUploaded,
  label = 'Book Cover Image'
}) {
  const activeUrl = currentUrl !== undefined ? currentUrl : (imageUrl !== undefined ? imageUrl : '');
  const notifyChange = onImageUploaded || onImageChange || (() => {});

  const [activeTab, setActiveTab] = useState(activeUrl ? 'url' : 'url'); // Default to URL mode for easy pasting
  const [urlInput, setUrlInput] = useState(activeUrl || '');
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  useEffect(() => {
    setUrlInput(activeUrl || '');
  }, [activeUrl]);

  // Handle image URL input change live
  const handleUrlChange = (val) => {
    setUrlInput(val);
    setErrorMsg('');
    notifyChange(val.trim());
  };

  // Handle local file selection from device
  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (JPG, PNG, WEBP).');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg('Image file size must be less than 2MB.');
      return;
    }

    setErrorMsg('');
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const res = await fetch(`${API_BASE}/api/books/upload-cover`, {
        method: 'POST',
        headers: await authHeaders(),
        credentials: 'include',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload image.');
      }

      const uploadedPath = data.image_url.startsWith('http')
        ? data.image_url
        : `${API_BASE}${data.image_url}`;

      setUrlInput(uploadedPath);
      notifyChange(uploadedPath);
    } catch (err) {
      setErrorMsg(err.message || 'Error uploading file from device.');
    } finally {
      setIsUploading(false);
    }
  };

  const previewSource = activeUrl || urlInput;

  return (
    <div className="w-full space-y-3 font-sans">
      <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200">
        {label}
      </label>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-700">
        <button
          type="button"
          onClick={() => { setActiveTab('url'); setErrorMsg(''); }}
          className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'url'
              ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          Paste Image Web URL
        </button>
        <button
          type="button"
          onClick={() => { setActiveTab('device'); setErrorMsg(''); }}
          className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'device'
              ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          Upload from Device
        </button>
      </div>

      {/* URL Input Mode */}
      {activeTab === 'url' && (
        <div className="space-y-1.5">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder="Paste image URL (e.g. https://images.gr-assets.com/books/...)"
            className="w-full px-3 py-2 text-sm border rounded-md dark:bg-slate-800 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 font-mono"
          />
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Paste any direct image URL link here. The image link will automatically update in <span className="font-mono text-indigo-600 dark:text-indigo-400">books.image_url</span>.
          </p>
        </div>
      )}

      {/* Device Upload Mode */}
      {activeTab === 'device' && (
        <div className="flex items-center space-x-4">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="block w-full text-sm text-slate-500 dark:text-slate-400
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-indigo-50 file:text-indigo-700
              hover:file:bg-indigo-100
              dark:file:bg-indigo-950 dark:file:text-indigo-300"
            disabled={isUploading}
          />
          {isUploading && (
            <span className="text-xs text-indigo-600 animate-pulse font-medium">Uploading...</span>
          )}
        </div>
      )}

      {/* Error Message */}
      {errorMsg && (
        <p className="text-xs text-red-500">{errorMsg}</p>
      )}

      {/* Live Image Preview */}
      {previewSource && (
        <div className="mt-2 flex items-center space-x-3 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Preview:</span>
          <img
            src={previewSource}
            alt="Cover preview"
            className="h-20 w-14 object-cover rounded shadow-md border border-slate-200 dark:border-slate-700"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://via.placeholder.com/150?text=No+Cover';
            }}
          />
          <span className="text-xs font-mono text-slate-600 dark:text-slate-400 truncate max-w-xs">
            {previewSource}
          </span>
        </div>
      )}
    </div>
  );
}
