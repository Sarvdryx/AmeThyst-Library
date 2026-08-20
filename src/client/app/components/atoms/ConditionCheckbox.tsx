"use client";

interface ConditionCheckboxProps {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export default function ConditionCheckbox({ id, label, checked, onChange, disabled }: ConditionCheckboxProps) {
  return (
    <label
      htmlFor={id}
      className={`flex items-center justify-between py-3 px-4 rounded-lg border transition-colors ${
        disabled
          ? 'border-[#E8E2D5]/50 dark:border-neutral-700/50 bg-neutral-50 dark:bg-neutral-800/50 cursor-not-allowed opacity-50'
          : 'border-[#E8E2D5] dark:border-neutral-700 bg-white dark:bg-neutral-800 cursor-pointer hover:bg-[#F8F3E9] dark:hover:bg-neutral-750'
      }`}
    >
      <div className="flex items-center gap-3">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => {
            if (!disabled) onChange(e.target.checked);
          }}
          disabled={disabled}
          className="w-4 h-4 rounded border-[#C4C6CD] dark:border-neutral-600 text-[#091426] dark:text-white focus:ring-[#091426] dark:focus:ring-white cursor-pointer disabled:cursor-not-allowed"
        />
        <span className={`text-sm font-medium ${disabled ? 'text-[#74777D] dark:text-neutral-500' : 'text-[#1D1C16] dark:text-neutral-200 font-manrope'}`}>
          {label}
        </span>
      </div>
    </label>
  );
}
