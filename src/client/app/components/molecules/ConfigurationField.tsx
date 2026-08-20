import ConfigurationNumberInput from '../atoms/ConfigurationNumberInput';

interface ConfigurationFieldProps {
  id: string;
  configurationKey: string;
  label: string;
  description: string;
  value: string;
  onChange?: (value: string) => void;
  error?: string;
  readOnly?: boolean;
  integer?: boolean;
  prefix?: string;
}

export default function ConfigurationField({
  id,
  configurationKey,
  label,
  description,
  value,
  onChange,
  error,
  readOnly = false,
  integer = false,
  prefix,
}: ConfigurationFieldProps) {
  const descriptionId = `${id}-description`;
  const errorId = `${id}-error`;

  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-2 block font-hankenGrotesk text-xs font-bold uppercase leading-4 tracking-[0.05em] text-slate-600 dark:text-neutral-300">
        {label}
      </label>
      <ConfigurationNumberInput
        id={id}
        name={configurationKey}
        value={value}
        onValueChange={onChange}
        readOnly={readOnly}
        invalid={Boolean(error)}
        aria-describedby={`${descriptionId}${error ? ` ${errorId}` : ''}`}
        autoComplete="off"
        pattern={integer ? '[0-9]*' : undefined}
        stepper={integer}
        prefix={prefix}
        controlLabel={label}
      />
      <p id={descriptionId} className="mt-2 max-w-80 font-manrope text-xs leading-5 text-slate-500 dark:text-neutral-400">
        {description}
      </p>
      {error && (
        <p id={errorId} role="alert" className="mt-2 text-xs font-semibold text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
