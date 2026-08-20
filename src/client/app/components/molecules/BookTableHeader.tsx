"use client";

import { useI18n } from '../../providers/I18nProvider';

export interface ColumnDef {
  key: string;
  width: string;
  align: 'items-start' | 'items-center' | 'items-end';
}

const DEFAULT_COLUMNS: ColumnDef[] = [
  { key: 'title', width: 'w-[220px]', align: 'items-start' },
  { key: 'author', width: 'w-[160px]', align: 'items-start' },
  { key: 'isbn', width: 'w-[140px]', align: 'items-start' },
  { key: 'availability', width: 'w-[200px]', align: 'items-start' },
  { key: 'location', width: 'w-[160px]', align: 'items-start' },
  { key: 'actions', width: 'w-[120px]', align: 'items-end' },
];

interface BookTableHeaderProps {
  columns?: ColumnDef[];
}

export default function BookTableHeader({ columns }: BookTableHeaderProps) {
  const { t } = useI18n();
  const cols = columns ?? DEFAULT_COLUMNS;

  return (
    <div className="flex justify-center items-start border-b border-[#E8E2D5] dark:border-neutral-700 bg-[#F8F3E9] dark:bg-neutral-800 w-full">
      {cols.map((col) => (
        <div
          key={col.key}
          className={`flex py-4 px-6 flex-col ${col.align} ${col.width}`}
        >
          <p className="text-[#43474D] dark:text-neutral-300 font-hankenGrotesk text-xs font-bold leading-4 tracking-[0.05em]">
            {col.key.startsWith('pickup_') || col.key.startsWith('return_')
              ? t(`librarian.${col.key}`)
              : t(`librarian.table_${col.key}`)}
          </p>
        </div>
      ))}
    </div>
  );
}
