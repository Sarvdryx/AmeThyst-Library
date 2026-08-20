interface OtpExpiredBannerProps {
  title: string;
  message: string;
}

export default function OtpExpiredBanner({ title, message }: OtpExpiredBannerProps) {
  return (
    <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 flex flex-col gap-1">
      <p className="text-sm font-semibold text-red-600 dark:text-red-400">{title}</p>
      <p className="text-sm text-red-500 dark:text-red-400">{message}</p>
    </div>
  );
}
