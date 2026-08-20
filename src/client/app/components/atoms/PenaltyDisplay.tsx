interface PenaltyDisplayProps {
  amount: number;
  label: string;
  type?: 'damage' | 'overdue' | 'lost' | 'total';
}

export default function PenaltyDisplay({ amount, label, type = 'damage' }: PenaltyDisplayProps) {
  const num = typeof amount === 'number' ? amount : Number(amount);
  const colorMap = {
    damage: 'text-[#BA1A1A] dark:text-red-400',
    overdue: 'text-[#BA1A1A] dark:text-red-400',
    lost: 'text-[#BA1A1A] dark:text-red-400',
    total: 'text-[#006C4D] dark:text-emerald-400',
  };

  return (
    <div className="flex justify-between items-center w-full">
      <span className="text-[#0B1C30] dark:text-neutral-200 font-manrope text-sm">{label}</span>
      <span className={`font-manrope text-sm font-semibold ${colorMap[type]}`}>
        ${num.toFixed(2)}
      </span>
    </div>
  );
}
