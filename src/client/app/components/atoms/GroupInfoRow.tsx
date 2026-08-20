interface GroupInfoRowProps {
  label: string;
  value: string;
}

export default function GroupInfoRow({ label, value }: GroupInfoRowProps) {
  return (
    <div className="flex flex-col items-start gap-1">
      <p className="text-[#45464D] dark:text-gray-400 font-inter text-xs font-semibold leading-3 tracking-wider">
        {label}
      </p>
      <p className="text-[#0D1C2E] dark:text-white font-inter text-lg font-semibold leading-relaxed">
        {value}
      </p>
    </div>
  );
}
