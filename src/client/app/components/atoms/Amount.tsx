interface AmountProps {
  value: number;
  currency?: string;
  className?: string;
}

export default function Amount({ value, currency = '$', className = '' }: AmountProps) {
  const num = typeof value === 'number' ? value : Number(value);
  const formatted = `${currency}${num.toFixed(2)}`;
  return (
    <span className={`font-manrope font-bold tabular-nums ${className}`}>
      {formatted}
    </span>
  );
}
