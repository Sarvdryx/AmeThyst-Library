import React from 'react';

interface GenreTagProps {
  genre: string;
  selected: boolean;
  onClick: () => void;
}

export default function GenreTag({ genre, selected, onClick }: GenreTagProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 rounded-full font-inter text-sm font-semibold transition-all duration-200 cursor-pointer active:scale-95 ${
        selected
          ? 'bg-[#006F66] dark:bg-teal text-white shadow-sm'
          : 'bg-white dark:bg-neutral-800 text-[#45474C] dark:text-neutral-300 border border-[#C5C6CD] dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-700'
      }`}
    >
      {genre}
    </button>
  );
}
