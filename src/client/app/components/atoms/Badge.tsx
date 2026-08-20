interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'error';
}

export default function Badge({ children, variant = 'success' }: BadgeProps) {
  const colors = {
    success: 'bg-[#006A61] text-white dark:bg-[#006A61]',
    warning: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    error: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colors[variant]}`}>
      {children}
    </span>
  );
}
