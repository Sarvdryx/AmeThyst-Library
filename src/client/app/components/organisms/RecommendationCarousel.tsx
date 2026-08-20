"use client";

import React, { useRef } from 'react';
import BookCard from '../molecules/BookCard';
import { useI18n } from '../../providers/I18nProvider';

interface RecommendedBook {
  id: string;
  title: string;
  author: string;
  coverImage: string;
}

interface RecommendationCarouselProps {
  books: RecommendedBook[];
  title?: string;
  emptyFallback?: React.ReactNode;
}

export default function RecommendationCarousel({ books, title, emptyFallback }: RecommendationCarouselProps) {
  const carouselRef = useRef<HTMLDivElement>(null);
  const { t } = useI18n();

  if (books.length === 0) {
    if (emptyFallback) {
      return (
        <section className="flex flex-col gap-6 w-full mt-8">
          <div className="flex justify-between items-end border-b border-[#C5C6CD] dark:border-neutral-600 pb-2">
            <h2 className="text-[#091426] dark:text-neutral-200 text-3xl md:text-4xl font-semibold tracking-[0.1em]">
              {title || t('book.you_may_like')}
            </h2>
          </div>
          <div className="py-8 text-center text-neutral-500 dark:text-neutral-400 font-medium">
            {emptyFallback}
          </div>
        </section>
      );
    }
    return null;
  }


  const scroll = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = 300;
      carouselRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <section className="flex flex-col gap-6 w-full mt-8">
      <div className="flex justify-between items-end">
        <h2 className="text-[#091426] dark:text-neutral-200 text-3xl md:text-4xl font-semibold tracking-[0.1em]">
          {title || t('book.you_may_like')}
        </h2>
        <div className="flex items-start gap-2 w-fit">
          <button 
            onClick={() => scroll('left')}
            className="flex p-2 flex-col justify-center items-center rounded-full border border-[#C5C6CD] dark:border-neutral-600 w-fit hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
            aria-label="Previous"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="flex justify-center items-start w-fit"
            >
              <path
                d="M3.825 9L9.425 14.6L8 16L0 8L8 0L9.425 1.4L3.825 7H16V9H3.825Z"
                className="fill-[#0B1C30] dark:fill-neutral-200"
              />
            </svg>
          </button>
          <button 
            onClick={() => scroll('right')}
            className="flex p-2 flex-col justify-center items-center rounded-full border border-[#C5C6CD] dark:border-neutral-600 w-fit hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
            aria-label="Next"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="flex justify-center items-start w-fit"
            >
              <path
                d="M12.175 9H0V7H12.175L6.575 1.4L8 0L16 8L8 16L6.575 14.6L12.175 9Z"
                className="fill-[#0B1C30] dark:fill-neutral-200"
              />
            </svg>
          </button>
        </div>
      </div>
      
      <div 
        ref={carouselRef}
        className="flex overflow-x-auto pb-8 gap-6 scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        {books.map((book) => (
          <div key={book.id} className="w-[160px] md:w-[220px] flex-none">
            <BookCard
              id={book.id}
              title={book.title}
              author={book.author}
              image={book.coverImage}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
