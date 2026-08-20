import React from 'react';
import { Label } from '../atoms/Label';
import { Input } from '../atoms/Input';
import { ErrorMessage } from '../atoms/ErrorMessage';

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  labelProps?: React.LabelHTMLAttributes<HTMLLabelElement>;
  hideLabel?: boolean;
  rightLabel?: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({ label, error, labelProps, hideLabel, rightLabel, ...inputProps }) => {
  return (
    <div className="flex flex-col gap-1.5">
      {!hideLabel && (
        <div className="flex justify-between items-center">
          <Label htmlFor={inputProps.id} {...labelProps}>{label}</Label>
          {rightLabel}
        </div>
      )}
      <div className="relative">
        <Input {...inputProps} />
        {error && <ErrorMessage message={error} />}
      </div>
    </div>
  );
};