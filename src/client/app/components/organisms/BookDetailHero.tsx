import BookCover from '../atoms/BookCover';

interface BookDetailHeroProps {
  title: string;
  author: string;
  description: string;
  coverImage: string;
  compact?: boolean;
}

export default function BookDetailHero({ title, author, description, coverImage, compact = false }: BookDetailHeroProps) {

  if (compact) {
    return (
      <div className="relative w-full aspect-[3/4.5] md:aspect-[3/4.2] overflow-hidden rounded-3xl transition-transform duration-500">
        <BookCover
          src={coverImage}
          alt={title}
          containerClassName="w-full h-full"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row gap-12 w-full">
      <div className="w-full md:w-[479px] shrink-0 rounded-3xl overflow-hidden shadow-lg">
        <BookCover
          src={coverImage}
          alt={title}
          containerClassName="w-full"
        />
      </div>
      <div className="flex flex-col gap-6 flex-grow">
        <div className="flex flex-col gap-2">
          <h1 className="text-[#091426] dark:text-neutral-200 text-4xl md:text-5xl font-bold leading-tight tracking-[0.0833em]">
            {title}
          </h1>
          <p className="text-[#45474C] dark:text-neutral-400 text-2xl font-semibold">
            {author}
          </p>
        </div>
        <div className="flex flex-col gap-4 text-[#0B1C30] dark:text-neutral-300 text-lg leading-relaxed">
          <p>{description}</p>
        </div>
      </div>
    </div>
  );
}
