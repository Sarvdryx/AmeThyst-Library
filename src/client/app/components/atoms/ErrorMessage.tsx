import React from 'react';

interface ErrorMessageProps {
  message: string;
  variant?: 'error' | 'success';
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, variant = 'error' }) => {
  const color = variant === 'success' ? 'text-green-600' : 'text-red-500';
  return (
    <span className={`${color} text-xs mt-1`}>{message}</span>
  );
};