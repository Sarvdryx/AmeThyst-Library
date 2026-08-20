import React from 'react';

interface HamburgerIconProps {
  isOpen: boolean;
  onClick: () => void;
}

export const HamburgerIcon: React.FC<HamburgerIconProps> = ({ isOpen, onClick }) => {
  return (
    <button onClick={onClick} aria-label={isOpen ? 'Close menu' : 'Open menu'} className="p-2 rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006F66] dark:focus-visible:outline-[#FFB95F] md:hidden transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800">
      <div className={`w-6 h-0.5 bg-black transition-all duration-300 ${isOpen ? 'rotate-45 translate-y-1.5' : ''}`}></div>
      <div className={`w-6 h-0.5 bg-black my-1.5 transition-all duration-300 ${isOpen ? 'opacity-0' : ''}`}></div>
      <div className={`w-6 h-0.5 bg-black transition-all duration-300 ${isOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></div>
    </button>
  );
};
