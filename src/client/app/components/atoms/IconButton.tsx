import React from 'react';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function IconButton({ children, label, size = 'md', className = '', ...props }: IconButtonProps) {
  const sizes = {
    sm: 'p-1',
    md: 'p-2',
    lg: 'p-3',
  };

  return (
    <button
      className={`${sizes[size]} rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors ${className}`}
      aria-label={label}
      title={label}
      {...props}
    >
      {children}
    </button>
  );
}
