interface NotificationDotProps {
  visible: boolean;
}

/**
 * Small unread indicator dot, meant to be positioned absolutely over an
 * icon (e.g. the notification bell). Only renders when `visible` is true
 * so callers control read/unread logic rather than baking it in here.
 */
export default function NotificationDot({ visible }: NotificationDotProps) {
  if (!visible) return null;

  return (
    <span
      className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-orange ring-1 ring-black dark:ring-neutral-950"
      aria-hidden="true"
    />
  );
}
