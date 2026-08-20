interface ActionButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  icon?: React.ReactNode;
}

export default function ActionButton({ onClick, children, variant = 'primary', disabled = false, icon }: ActionButtonProps) {
  const baseStyles = "flex py-4 px-8 items-center gap-2 rounded-lg font-semibold transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-[#091426] text-white hover:bg-[#1a2b4a] dark:bg-[#FFB95F] dark:text-[#091426] dark:hover:bg-[#e6a54d]",
    secondary: "border-2 border-[#000] text-[#45474C] hover:bg-gray-100 dark:border-neutral-500 dark:text-neutral-300 dark:hover:bg-neutral-700",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]}`}
    >
      {icon}
      <span>{children}</span>
    </button>
  );
}
