import type { InputHTMLAttributes } from 'react';

export interface ConfigurationNumberInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  invalid?: boolean;
  stepper?: boolean;
  prefix?: string;
  onValueChange?: (value: string) => void;
  controlLabel?: string;
}

export default function ConfigurationNumberInput({
  className = '',
  invalid = false,
  readOnly,
  stepper = false,
  prefix,
  value,
  onValueChange,
  onChange,
  controlLabel,
  ...props
}: ConfigurationNumberInputProps) {
  const adjustValue = (amount: number) => {
    const current = Number(value);
    const next = Number.isFinite(current) ? Math.max(1, Math.trunc(current) + amount) : 1;
    onValueChange?.(String(next));
  };

  const input = (
    <input
      {...props}
      value={value}
      onChange={(event) => {
        onChange?.(event);
        onValueChange?.(event.target.value);
      }}
      type="text"
      inputMode={stepper ? 'numeric' : 'decimal'}
      readOnly={readOnly}
      aria-invalid={invalid || undefined}
      className={`h-12 min-w-0 flex-1 bg-transparent px-4 font-manrope text-base tabular-nums text-slate-900 outline-none dark:text-neutral-100 ${
        prefix ? 'pl-8' : ''
      } ${stepper ? 'text-center font-bold' : ''} ${className}`}
    />
  );

  return (
    <div className={`relative flex w-full max-w-80 items-center overflow-hidden rounded-lg border bg-white transition-colors focus-within:border-slate-600 focus-within:ring-2 focus-within:ring-slate-900/10 dark:bg-neutral-900 dark:focus-within:border-neutral-300 ${
      invalid
        ? 'border-red-500 bg-red-50 dark:border-red-400 dark:bg-red-950/20'
        : readOnly
          ? 'border-stone-200 bg-stone-100 opacity-70 dark:border-neutral-700 dark:bg-neutral-800'
          : 'border-stone-300 hover:border-slate-400 dark:border-neutral-600'
    }`}>
      {stepper && !readOnly && (
        <button type="button" onClick={() => adjustValue(-1)} className="flex h-12 w-12 shrink-0 items-center justify-center border-r border-stone-200 text-xl text-slate-800 transition-colors hover:bg-stone-50 dark:border-neutral-700 dark:text-neutral-100 dark:hover:bg-neutral-800" aria-label={`− ${controlLabel ?? props.name ?? ''}`}>
          <span aria-hidden="true">−</span>
        </button>
      )}
      {prefix && <span className="pointer-events-none absolute left-4 font-manrope font-bold text-slate-600 dark:text-neutral-300">{prefix}</span>}
      {input}
      {stepper && !readOnly && (
        <button type="button" onClick={() => adjustValue(1)} className="flex h-12 w-12 shrink-0 items-center justify-center border-l border-stone-200 text-xl text-slate-800 transition-colors hover:bg-stone-50 dark:border-neutral-700 dark:text-neutral-100 dark:hover:bg-neutral-800" aria-label={`+ ${controlLabel ?? props.name ?? ''}`}>
          <span aria-hidden="true">+</span>
        </button>
      )}
    </div>
  );
}
