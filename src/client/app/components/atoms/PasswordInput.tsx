import React, { useState } from 'react';
import { Label } from './Label';
import { Input } from './Input';
import { ErrorMessage } from './ErrorMessage';

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  labelProps?: React.LabelHTMLAttributes<HTMLLabelElement>;
  hideLabel?: boolean;
  rightLabel?: React.ReactNode;
}

export const PasswordInput: React.FC<PasswordInputProps> = ({
  label,
  error,
  labelProps,
  hideLabel,
  rightLabel,
  ...inputProps
}) => {
  const [show, setShow] = useState(false);

  return (
    <div className="flex flex-col gap-1.5">
      {!hideLabel && (
        <div className="flex justify-between items-center">
          <Label htmlFor={inputProps.id} {...labelProps}>{label}</Label>
          {rightLabel}
        </div>
      )}
      <div className="relative">
        <div className="relative">
          <Input
            {...inputProps}
            type={show ? 'text' : 'password'}
            className={`pr-12 ${inputProps.className || ''}`}
          />
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300 focus:outline-none flex items-center justify-center"
            aria-label={show ? 'Hide password' : 'Show password'}
          >
            {show ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                <path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                <line x1="2" y1="2" x2="22" y2="22" />
              </svg>
            )}
          </button>
        </div>
        {error && <ErrorMessage message={error} />}
      </div>
    </div>
  );
};
