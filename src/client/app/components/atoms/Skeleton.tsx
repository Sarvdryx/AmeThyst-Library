interface SkeletonProps {
  className?: string;
}

export default function Skeleton({ className }: SkeletonProps) {
  return (
    <div className={`animate-pulse bg-neutral-200 dark:bg-neutral-700 rounded ${className || ''}`} />
  );
}
