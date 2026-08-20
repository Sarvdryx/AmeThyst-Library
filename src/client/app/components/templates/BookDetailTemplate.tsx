'use client';

import React from 'react';
import BookDetailHero from '../organisms/BookDetailHero';
import InfoGridItem from '../molecules/InfoGridItem';
import ActionButton from '../atoms/ActionButton';
import RecommendationCarousel from '../organisms/RecommendationCarousel';
import NavBar from '../organisms/NavBar';
import Footer from '../organisms/Footer';
import { useI18n } from '../../providers/I18nProvider';
import { PublisherIcon, CalendarIcon, PageIcon, StarIcon, MapPinIcon } from '../atoms/BookIcons';
import WishlistHeart from '../atoms/WishlistHeart';
import Toast from '../atoms/Toast';

export interface BookDetails {
  id: string;
  title: string;
  author: string;
  description: string;
  isbn: string;
  language: string;
  publisher: string;
  publicationYear: string | number;
  numPages: string | number;
  rating: string;
  coverImage: string;
  inventory?: {
    branchId?: number;
    location: string;
    address: string;
    shelf: string;
    availableCopies: number;
  }[];
  userReservation?: {
    reservationId: string;
    branchId: number;
    branchName: string;
    reserveDate: string;
    expiresAt: string;
    status: string;
  } | null;
}

export interface RecommendedBook {
  id: string;
  title: string;
  author: string;
  coverImage: string;
}

export interface BookDetailTemplateProps {
  book: BookDetails | null;
  recommendations: RecommendedBook[];
  loading: boolean;
  isReserving: boolean;
  reserved: boolean;
  selectedBranchId: number | null;
  onBranchSelect: (branchId: number | null) => void;
  error: string | null;
  onReserve: () => void;
  userRole?: string;
  isWishlisted?: boolean;
  onWishlistToggle?: () => void;
  toast?: { message: string; type: 'info' | 'error' | 'warning' | 'success' } | null;
  onDismissToast?: () => void;
}

export default function BookDetailTemplate({
  book,
  recommendations,
  loading,
  isReserving,
  reserved,
  selectedBranchId,
  onBranchSelect,
  error,
  onReserve,
  userRole = '',
  isWishlisted = false,
  onWishlistToggle,
  toast = null,
  onDismissToast,
}: BookDetailTemplateProps) {
  const { t } = useI18n();

  if (loading) return <div className="min-h-screen bg-[#F8EFE6] dark:bg-[#091426] flex items-center justify-center font-inter text-navy dark:text-neutral-200 animate-pulse text-lg">{t('book.loading')}</div>;
  if (!book) return <div className="min-h-screen bg-[#F8EFE6] dark:bg-[#091426] flex items-center justify-center font-inter text-navy dark:text-neutral-200 text-xl">{t('book.not_found')}</div>;

  const canReserve = userRole === 'user';
  const hasAvailability = book.inventory && book.inventory.some(loc => loc.availableCopies > 0);
  const hasActiveReservation = book.userReservation && ['reserved', 'pending', 'borrowed'].includes(book.userReservation.status);

  const handleBranchClick = (branchId: number | undefined, availableCopies: number) => {
    if (availableCopies <= 0) return;
    if (!branchId) return;
    onBranchSelect(branchId === selectedBranchId ? null : branchId);
  };

  return (
    <div className="bg-[#F8EFE6] dark:bg-[#091426] min-h-screen flex flex-col font-inter selection:bg-teal selection:text-white">
      <NavBar />
      <main className="flex-grow container mx-auto px-4 py-8 md:py-12 max-w-6xl">
        <div className="flex flex-col gap-8">
          
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="w-full md:w-[300px] shrink-0 relative">
              <BookDetailHero
                title={book.title}
                author={book.author}
                description=""
                coverImage={book.coverImage}
                compact={true}
              />
              {onWishlistToggle && (
                <WishlistHeart
                  isWishlisted={isWishlisted}
                  onClick={onWishlistToggle}
                  className="absolute top-4 right-4 z-10"
                />
              )}
            </div>

            <div className="flex flex-col gap-6 flex-grow min-w-0">
              <div className="flex flex-col gap-3">
                <h1 className="text-[#091426] dark:text-neutral-200 text-3xl md:text-4xl font-extrabold leading-tight tracking-tight break-words">
                  {book.title}
                </h1>
                <p className="text-[#006F66] dark:text-[#FFB95F] text-xl font-semibold">{book.author}</p>
                <div className="text-[#45474C] dark:text-neutral-400 text-base leading-relaxed max-w-3xl">
                   {book.description}
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-xl border border-[#C5C6CD] dark:border-neutral-600 bg-white dark:bg-neutral-800 shadow-sm">
                <InfoGridItem label={t('book.label_publisher')} value={book.publisher} icon={<PublisherIcon />} />
                <InfoGridItem label={t('book.label_year')} value={book.publicationYear} icon={<CalendarIcon />} />
                <InfoGridItem label={t('book.label_pages')} value={book.numPages} icon={<PageIcon />} />
                <InfoGridItem label={t('book.label_rating')} value={book.rating} icon={<StarIcon />} />
              </div>

              <div className="flex flex-col gap-4 mt-2">
                <h3 className="text-lg font-bold text-[#091426] dark:text-neutral-200 border-b border-[#C5C6CD] dark:border-neutral-600 pb-2">{t('book.availability_locations')}</h3>
                
                {book.inventory && book.inventory.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {book.inventory.map((loc) => (
                      <div 
                        key={loc.branchId}
                        className={`flex flex-col p-4 rounded-lg border bg-white dark:bg-neutral-800 shadow-sm transition-all duration-200 ${
                          loc.availableCopies > 0 && canReserve
                            ? selectedBranchId === loc.branchId
                              ? 'border-[#006F66] dark:border-[#FFB95F] ring-2 ring-[#006F66] dark:ring-[#FFB95F]'
                              : 'border-[#E0E0E0] dark:border-neutral-700 hover:border-[#006F66] dark:hover:border-[#FFB95F] cursor-pointer'
                            : 'border-[#E0E0E0] dark:border-neutral-700 opacity-60'
                        }`}
                        onClick={() => canReserve && handleBranchClick(loc.branchId, loc.availableCopies)}
                      >
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <div className="flex items-start gap-2">
                            <MapPinIcon />
                            <div>
                              <h4 className="font-semibold text-[#091426] dark:text-neutral-200 text-sm leading-tight">{loc.location}</h4>
                              <p className="text-xs text-[#6B7280] dark:text-neutral-400 mt-1">{loc.address}</p>
                            </div>
                          </div>
                          {selectedBranchId === loc.branchId && (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-[#006F66] dark:text-[#FFB95F] shrink-0">
                              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                              <polyline points="22 4 12 14.01 9 11.01"/>
                            </svg>
                          )}
                        </div>
                        <div className="mt-auto flex justify-between items-center text-sm pt-3 border-t border-[#F3F4F6] dark:border-neutral-700">
                          <span className="text-[#45474C] dark:text-neutral-300">{t('book.shelf')}: <span className="font-medium text-[#006F66] dark:text-[#FFB95F]">{loc.shelf}</span></span>
                          <span className={`font-semibold ${loc.availableCopies > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                            {loc.availableCopies} {loc.availableCopies === 1 ? t('book.copy') : t('book.copies')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[#6B7280]">{t('book.no_location_data')}</p>
                )}

                {hasActiveReservation && book.userReservation && (
                  <div className="p-4 rounded-lg border border-[#006F66] dark:border-[#FFB95F] bg-[#006F66]/5 dark:bg-[#FFB95F]/5">
                    <h4 className="font-semibold text-[#006F66] dark:text-[#FFB95F] mb-2">{t('book.active_reservation')}</h4>
                    <div className="text-sm text-[#45474C] dark:text-neutral-300 space-y-1">
                      <p>{t('book.branch')}: {book.userReservation.branchName}</p>
                      {book.userReservation.expiresAt && (
                        <p>{t('book.expires')}: {new Date(book.userReservation.expiresAt).toLocaleString()}</p>
                      )}
                    </div>
                  </div>
                )}

                {error && (
                  <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                  </div>
                )}
                
                {canReserve && (
                  <div className="w-full max-w-sm mt-4">
                    <ActionButton 
                      onClick={onReserve} 
                      disabled={isReserving || reserved || !hasAvailability || !selectedBranchId || hasActiveReservation}
                      icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V6l-3-4Z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>}
                    >
                      {reserved ? t('book.reserved') : isReserving ? t('book.reserving') : t('book.reserve')}
                    </ActionButton>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="w-full pt-8 border-t border-[#C5C6CD] dark:border-neutral-600">
            <RecommendationCarousel books={recommendations} />
          </div>

        </div>
      </main>
      <Footer />
      {toast && onDismissToast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDismiss={onDismissToast}
        />
      )}
    </div>
  );
}
