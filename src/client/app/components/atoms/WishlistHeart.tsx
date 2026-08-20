'use client';

import React from 'react';

interface WishlistHeartProps {
  isWishlisted: boolean;
  onClick: (e: React.MouseEvent) => void;
  className?: string;
}

export const WishlistHeart: React.FC<WishlistHeartProps> = ({
  isWishlisted,
  onClick,
  className = '',
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onClick(e);
  };

  return (
    <button
      onClick={handleClick}
      className={`flex items-center justify-center p-2 rounded-full bg-white/90 dark:bg-neutral-800/90 shadow-md hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer group ${className}`}
      aria-label="Toggle Wishlist"
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill={isWishlisted ? '#EF4444' : 'none'}
        stroke={isWishlisted ? '#EF4444' : 'currentColor'}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`transition-colors duration-200 ${
          isWishlisted
            ? 'text-red-500'
            : 'text-neutral-500 dark:text-neutral-400 group-hover:text-red-500'
        }`}
      >
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
      </svg>
    </button>
  );
};

export default WishlistHeart;
