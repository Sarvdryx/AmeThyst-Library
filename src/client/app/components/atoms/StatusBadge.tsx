type BadgeVariant = 'active' | 'overdue' | 'returned' | 'paid' | 'pending' | 'waived';

interface StatusBadgeProps {
  variant: BadgeVariant;
  label: string;
}

const config: Record<BadgeVariant, { bg: string; text: string }> = {
  active: {
    bg: 'bg-[#E8F0FE] dark:bg-blue-900/30',
    text: 'text-[#1A73E8] dark:text-blue-300',
  },
  overdue: {
    bg: 'bg-[#FCE8E6] dark:bg-red-900/30',
    text: 'text-[#D93025] dark:text-red-300',
  },
  returned: {
    bg: 'bg-[#E6F4EA] dark:bg-green-900/30',
    text: 'text-[#137333] dark:text-green-300',
  },
  paid: {
    bg: 'bg-[#E6F4EA] dark:bg-green-900/30',
    text: 'text-[#137333] dark:text-green-300',
  },
  pending: {
    bg: 'bg-amber-50 dark:bg-amber-900/30',
    text: 'text-amber-700 dark:text-amber-300',
  },
  waived: {
    bg: 'bg-neutral-100 dark:bg-neutral-800',
    text: 'text-neutral-500 dark:text-neutral-400',
  },
};

export default function StatusBadge({ variant, label }: StatusBadgeProps) {
  const { bg, text } = config[variant];
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold leading-4 ${bg} ${text}`}>
      {label}
    </span>
  );
}
