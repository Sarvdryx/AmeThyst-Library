import React from 'react';
import Link from 'next/link';

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
}

export const NavLink: React.FC<NavLinkProps> = ({ href, children }) => {
  return (
    <Link href={href} className="text-sm font-medium text-gray-600 hover:text-black transition-colors duration-200 relative group">
      {children}
      <span className="absolute left-0 -bottom-1 w-0 h-0.5 bg-black transition-all duration-200 group-hover:w-full"></span>
    </Link>
  );
};
