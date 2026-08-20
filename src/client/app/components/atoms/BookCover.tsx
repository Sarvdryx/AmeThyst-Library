'use client';

interface BookCoverProps {
  src?: string;
  alt: string;
  className?: string;
  containerClassName?: string;
}

const FALLBACK_SRC = "/Rectangle1248.png";

function handleError(e: React.SyntheticEvent<HTMLImageElement>) {
  const img = e.target as HTMLImageElement;
  const currentSrc = img.src;
  if (currentSrc.includes('/b/olid/') && !currentSrc.includes('?fallback=1')) {
    const parts = currentSrc.split('/b/olid/');
    if (parts[1]) {
      const olid = parts[1].replace('-L.jpg', '');
      img.src = `https://covers.openlibrary.org/b/id/${olid}-L.jpg?fallback=1`;
      return;
    }
  }
  img.src = FALLBACK_SRC;
}

export default function BookCover({ src, alt, className, containerClassName }: BookCoverProps) {
  if (!src) {
    return (
      <div className={`flex items-center justify-center bg-[#EAEAEA] dark:bg-neutral-700 ${className || ''}`}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="opacity-40">
          <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12z" fill="#75777D" />
        </svg>
      </div>
    );
  }

  return (
    <div className={`overflow-hidden ${containerClassName || ''}`}>
      <img
        src={src}
        alt={alt}
        className={`w-full h-full object-cover ${className || ''}`}
        onError={handleError}
      />
    </div>
  );
}
