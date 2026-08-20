interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  id?: string;
  activeColor?: string;
  inactiveColor?: string;
}

export default function ToggleSwitch({
  checked,
  onChange,
  id,
  activeColor = 'bg-[#006F66] dark:bg-teal',
  inactiveColor = 'bg-gray-200 dark:bg-neutral-700',
}: ToggleSwitchProps) {
  return (
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only peer"
        id={id}
      />
      <div
        className={`w-11 h-6 rounded-full peer-focus:outline-none after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${
          checked
            ? `${activeColor} peer-checked:after:translate-x-full peer-checked:after:border-white`
            : `${inactiveColor}`
        }`}
      />
    </label>
  );
}
