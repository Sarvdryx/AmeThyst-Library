"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useI18n } from '../../providers/I18nProvider';
import { getInitials } from '../../utils/user';
import { mapServerError } from '../../utils/errors';
import { authHeaders } from '../../utils/apiClient';

interface AvatarUploaderProps {
  avatarUrl: string;
  onAvatarUpdate: (newUrl: string) => void;
  username: string;
}

// Kích thước vùng crop hiển thị trên UI (px) và kích thước ảnh xuất ra
// việc làm vậy là để cho nó rõ nét, khỏi bị lố
const CROP_DISPLAY_SIZE = 280;
const CROP_OUTPUT_SIZE = 512;
const MIN_ZOOM = 1.0;
const MAX_ZOOM = 5.0;

export default function AvatarUploader({ avatarUrl, onAvatarUpdate, username }: AvatarUploaderProps) {
  const { t } = useI18n();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUrlInputOpen, setIsUrlInputOpen] = useState(false);
  const [inputUrl, setInputUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  // --- State cho crop/zoom modal ---
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [zoom, setZoom] = useState(1.0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [baseScale, setBaseScale] = useState(1.0);
  const [isMounted, setIsMounted] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => setIsMounted(true), []);

  const API = process.env.NEXT_PUBLIC_API_URL;

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  // ----- Đóng menu/khung input khi click ra ngoài -----
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
        setIsUrlInputOpen(false);
        setInputUrl('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ----- Mở crop modal từ File -----
  const openCropFromFile = (file: File) => {
    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      setError(t('profile.avatar_size_error') || 'File size exceeds 2MB limit');
      setIsMenuOpen(false);
      return;
    }
    if (!file.type.startsWith('image/')) {
      setError(t('profile.avatar_type_error') || 'Invalid file type, only images are allowed!');
      setIsMenuOpen(false);
      return;
    }
    setError('');

    const objectUrl = URL.createObjectURL(file);
    setImageFile(file);
    setImageSrc(objectUrl);
    setZoom(1.0);
    setOffset({ x: 0, y: 0 });
    setCropModalOpen(true);
    setIsMenuOpen(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    openCropFromFile(file);
    e.target.value = '';
  };

  // ----- Mở crop modal từ URL -----
  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim()) return;

    if (!isValidUrl(inputUrl)) {
      setError(t('profile.avatar_url_invalid') || 'Invalid URL format');
      return;
    }

    setError('');
    setImageFile(null);
    setImageSrc(inputUrl);
    setZoom(1.0);
    setOffset({ x: 0, y: 0 });
    setCropModalOpen(true);
    setIsUrlInputOpen(false);
  };

  // Giới hạn offset để ảnh luôn phủ kín khung crop
  const clampOffset = useCallback((newOffset: { x: number; y: number }, currentZoom: number) => {
    const img = imageRef.current;
    if (!img) return newOffset;
    const scale = baseScale * currentZoom;
    const drawW = img.naturalWidth * scale;
    const drawH = img.naturalHeight * scale;
    const maxX = Math.max(0, (drawW - CROP_DISPLAY_SIZE) / 2);
    const maxY = Math.max(0, (drawH - CROP_DISPLAY_SIZE) / 2);
    return {
      x: Math.min(maxX, Math.max(-maxX, newOffset.x)),
      y: Math.min(maxY, Math.max(-maxY, newOffset.y)),
    };
  }, [baseScale]);

  // ----- Vẽ canvas preview -----
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = CROP_DISPLAY_SIZE;
    canvas.height = CROP_DISPLAY_SIZE;
    ctx.clearRect(0, 0, CROP_DISPLAY_SIZE, CROP_DISPLAY_SIZE);

    const scale = baseScale * zoom;
    const drawW = img.naturalWidth * scale;
    const drawH = img.naturalHeight * scale;
    const dx = (CROP_DISPLAY_SIZE - drawW) / 2 + offset.x;
    const dy = (CROP_DISPLAY_SIZE - drawH) / 2 + offset.y;

    ctx.save();
    ctx.beginPath();
    ctx.arc(CROP_DISPLAY_SIZE / 2, CROP_DISPLAY_SIZE / 2, CROP_DISPLAY_SIZE / 2, 0, Math.PI * 2);
    ctx.clip();
    try {
      ctx.drawImage(img, dx, dy, drawW, drawH);
    } catch {
      // ignore draw error
    }
    ctx.restore();

    // viền tròn
    ctx.beginPath();
    ctx.arc(CROP_DISPLAY_SIZE / 2, CROP_DISPLAY_SIZE / 2, CROP_DISPLAY_SIZE / 2 - 1, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }, [zoom, offset, baseScale]);

  // Preload Image when imageSrc changes and calculate baseScale
  useEffect(() => {
    if (!imageSrc) return;

    const img = new Image();
    // img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageRef.current = img;
      const bScale = Math.max(
        CROP_DISPLAY_SIZE / img.naturalWidth,
        CROP_DISPLAY_SIZE / img.naturalHeight
      );
      setBaseScale(bScale);
    };
    img.onerror = () => {
      setError(t('profile.avatar_crop_failed') || 'Could not process this image');
      closeCropModal();
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Object URL cleanup on unmount or when imageSrc changes
  useEffect(() => {
    return () => {
      if (imageSrc && imageSrc.startsWith('blob:')) {
        URL.revokeObjectURL(imageSrc);
      }
    };
  }, [imageSrc]);

  // Redraw canvas on zoom, offset, or baseScale changes
  useEffect(() => {
    if (cropModalOpen && imageSrc) {
      drawCanvas();
    }
  }, [zoom, offset, drawCanvas, cropModalOpen, imageSrc]);

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    
    setOffset((prev) => {
      const nextOffset = { x: prev.x + dx, y: prev.y + dy };
      return clampOffset(nextOffset, zoom);
    });
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Wheel zoom handler
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomStep = 0.05;
    const newZoom = e.deltaY < 0 ? zoom + zoomStep : zoom - zoomStep;
    const clampedZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, newZoom));
    setZoom(clampedZoom);
    setOffset((prev) => clampOffset(prev, clampedZoom));
  };

  const closeCropModal = () => {
    setCropModalOpen(false);
    if (imageSrc && imageSrc.startsWith('blob:')) {
      URL.revokeObjectURL(imageSrc);
    }
    setImageSrc(null);
    setImageFile(null);
    setInputUrl('');
  };

  const handleSave = async () => {
    setIsLoading(true);
    setError('');
    try {
      let response;
      if (imageFile) {
        // Multipart Form Data flow
        const formData = new FormData();
        formData.append('avatar', imageFile);
        formData.append('zoom', zoom.toString());
        formData.append('offsetX', offset.x.toString());
        formData.append('offsetY', offset.y.toString());

        response = await fetch(`${API}/user/avatar/crop`, {
          method: 'POST',
          headers: await authHeaders(),
          credentials: 'include',
          body: formData,
        });
      } else if (imageSrc) {
        // JSON paste URL flow
        const payload = {
          imageUrl: imageSrc,
          zoom,
          offsetX: offset.x,
          offsetY: offset.y,
        };

        response = await fetch(`${API}/user/avatar/crop`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(await authHeaders()),
          },
          credentials: 'include',
          body: JSON.stringify(payload),
        });
      } else {
        throw new Error('No image loaded');
      }

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'profile.avatar_upload_failed');
      }

      const data = await response.json();
      if (data.avatar) {
        onAvatarUpdate(data.avatar);
      }
      closeCropModal();
    } catch (err: any) {
      setError(mapServerError(err.message, t, 'profile.avatar_upload_failed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex flex-col items-center gap-3" ref={rootRef}>
      <div className="relative group w-28 h-28">
        {/* Avatar Display */}
        {isLoading ? (
          <div className="w-full h-full rounded-full bg-slate-200 dark:bg-neutral-800 flex items-center justify-center border border-slate-300 dark:border-neutral-700">
            <svg className="animate-spin h-8 w-8 text-[#006F66] dark:text-[#86F2E4]" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        ) : avatarUrl ? (
          <img
            src={avatarUrl}
            alt={username}
            className="w-full h-full rounded-full object-cover border border-slate-300 dark:border-neutral-700 shadow-sm"
          />
        ) : (
          <div className="w-full h-full rounded-full bg-[#486C7E] text-white flex items-center justify-center font-bold text-3xl shadow-sm">
            {getInitials(username) || 'U'}
          </div>
        )}

        {/* Hover Overlay */}
        {!isLoading && (
          <div
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-all duration-200"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
            </svg>
          </div>
        )}
      </div>

      {/* Edit Options Menu */}
      {isMenuOpen && (
        <div className="absolute top-32 bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg shadow-lg py-2 w-48 z-10 font-medium">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full px-4 py-2 text-left text-sm text-neutral-700 dark:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-700 flex items-center gap-2"
          >
            <span>📁</span> {t('profile.avatar_upload_file') || 'Upload File'}
          </button>
          <button
            onClick={() => {
              setIsUrlInputOpen(true);
              setIsMenuOpen(false);
            }}
            className="w-full px-4 py-2 text-left text-sm text-neutral-700 dark:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-700 flex items-center gap-2"
          >
            <span>🔗</span> {t('profile.avatar_paste_url') || 'Paste Image URL'}
          </button>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* Paste URL Modal/Input */}
      {isUrlInputOpen && (
        <div className="w-full mt-2 flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
          <input
            type="text"
            placeholder={t('profile.avatar_url_placeholder') || 'https://example.com/image.jpg'}
            value={inputUrl}
            disabled={isLoading}
            onChange={(e) => setInputUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleUrlSubmit(e as any)}
            className="w-full text-sm px-3 py-2 border border-slate-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
            autoFocus
          />

          {/* Thumbnail Preview */}
          {inputUrl && isValidUrl(inputUrl) && (
            <img
              src={inputUrl}
              alt="Preview"
              className="w-8 h-8 rounded object-cover border border-slate-200 dark:border-neutral-700 shadow-sm"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          )}

          <div className="flex gap-2">
            <button
              onClick={handleUrlSubmit}
              disabled={isLoading || !inputUrl.trim()}
              className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-1"
            >
              {t('profile.continue') || 'Continue'}
            </button>
            <button
              onClick={() => {
                setIsUrlInputOpen(false);
                setInputUrl('');
              }}
              disabled={isLoading}
              className="flex-1 py-1.5 border border-slate-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-neutral-700 text-xs font-semibold rounded-lg transition-all disabled:opacity-50"
            >
              {t('profile.cancel') || 'Cancel'}
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <span className="text-xs text-red-600 dark:text-red-400 text-center font-medium max-w-xs px-2 mt-1">
          {error}
        </span>
      )}

      {/* ----- Crop/Zoom Modal ----- */}
      {isMounted && cropModalOpen && imageSrc && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/60 flex items-center justify-center p-4">
          <div
            className="bg-white dark:bg-neutral-800 rounded-xl shadow-xl p-5 w-full max-w-sm flex flex-col items-center gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-100 self-start">
              {t('profile.avatar_crop_title') || 'Adjust your photo'}
            </h3>

            <canvas
              ref={canvasRef}
              width={CROP_DISPLAY_SIZE}
              height={CROP_DISPLAY_SIZE}
              className="rounded-full bg-slate-100 dark:bg-neutral-900 cursor-grab active:cursor-grabbing touch-none"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={handleWheel}
            />

            <div className="text-[10px] text-neutral-400 dark:text-neutral-500 text-center font-medium">
              {t('profile.avatar_crop_hint') || 'Use mouse drag to move and wheel scroll to zoom'}
            </div>

            <div className="w-full flex items-center gap-3">
              <span className="text-xs text-neutral-500 dark:text-neutral-400">−</span>
              <input
                type="range"
                min={MIN_ZOOM}
                max={MAX_ZOOM}
                step={0.01}
                value={zoom}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setZoom(val);
                  setOffset((prev) => clampOffset(prev, val));
                }}
                className="flex-1 accent-emerald-600"
              />
              <span className="text-xs text-neutral-500 dark:text-neutral-400">+</span>
            </div>

            <div className="flex gap-2 w-full">
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg transition-all disabled:opacity-50"
              >
                {t('profile.save') || 'Save'}
              </button>
              <button
                onClick={closeCropModal}
                disabled={isLoading}
                className="flex-1 py-2 border border-slate-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-neutral-700 text-sm font-semibold rounded-lg transition-all disabled:opacity-50"
              >
                {t('profile.cancel') || 'Cancel'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
