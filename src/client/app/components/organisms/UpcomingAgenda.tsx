"use client";

import { useState } from 'react';
import { useI18n } from '../../providers/I18nProvider';
import { AgendaEventRow } from '../atoms';

interface AgendaEvent {
  id: number | string;
  title: string;
  time: string;
  location: string;
  type: string;
}

interface UpcomingAgendaProps {
  today: AgendaEvent[];
  tomorrow: AgendaEvent[];
  onAddTask?: () => void;
  isLoading?: boolean;
}

export default function UpcomingAgenda({ today, tomorrow, onAddTask, isLoading }: UpcomingAgendaProps) {
  const { t } = useI18n();
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-xl w-[331px] h-[761px] p-8 flex flex-col gap-6 shrink-0 overflow-y-auto">
      <h3 className="text-[rgba(0,0,0,0.50)] dark:text-neutral-400 font-inter text-base leading-6 tracking-[0.2em]">
        {t('dashboard.agenda_title')}
      </h3>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <span className="text-neutral-400 dark:text-neutral-500 font-manrope text-sm">{t('dashboard.agenda_loading')}</span>
        </div>
      ) : (
        <>
          <div>
            <div className="flex items-center gap-2 pb-4">
              <span className="text-black dark:text-neutral-100 font-hankenGrotesk text-xs font-bold leading-4">
                {t('dashboard.agenda_today')}
              </span>
              <div className="bg-[#E8E2D5] dark:bg-neutral-700 flex-1 h-px" />
            </div>
            {today.length === 0 ? (
              <p className="text-neutral-400 dark:text-neutral-500 font-manrope text-xs py-4 text-center">{t('dashboard.agenda_no_events_today')}</p>
            ) : (
              <div className="flex flex-col gap-5">
                {today.map((ev) => (
                  <AgendaEventRow
                    key={ev.id}
                    time={ev.time}
                    title={ev.title}
                    location={ev.location}
                    type={ev.type}
                    allDayLabel={t('dashboard.agenda_all_day')}
                  />
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 pb-4">
              <span className="text-[rgba(67,71,77,0.60)] dark:text-neutral-400 font-hankenGrotesk text-xs font-bold leading-4">
                {t('dashboard.agenda_tomorrow')}
              </span>
              <div className="bg-[#E8E2D5] dark:bg-neutral-700 flex-1 h-px" />
            </div>
            {tomorrow.length === 0 ? (
              <p className="text-neutral-400 dark:text-neutral-500 font-manrope text-xs py-4 text-center">{t('dashboard.agenda_no_events_tomorrow')}</p>
            ) : (
              <div className="flex flex-col gap-5">
                {tomorrow.map((ev) => (
                  <AgendaEventRow
                    key={ev.id}
                    time={ev.time}
                    title={ev.title}
                    location={ev.location}
                    type={ev.type}
                    allDayLabel={t('dashboard.agenda_all_day')}
                  />
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => setShowForm(!showForm)}
            className="cursor-pointer flex py-3 px-0 justify-center items-center gap-2 rounded-full border-2 border-dashed border-[#E8E2D5] dark:border-neutral-600 bg-[#F8EFE6] dark:bg-neutral-700 hover:bg-[#f0e4d6] dark:hover:bg-neutral-600 transition-colors mt-2"
          >
            <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
              <path d="M3.5 4.66667H0V3.5H3.5V0H4.66667V3.5H8.16667V4.66667H4.66667V8.16667H3.5V4.66667Z" fill="#43474D" className="dark:fill-neutral-300" />
            </svg>
            <span className="text-[#43474D] dark:text-neutral-300 font-manrope text-xs font-bold leading-4">
              {t('dashboard.agenda_add_task')}
            </span>
          </button>

          {showForm && (
            <form className="flex flex-col gap-3 p-4 border border-dashed border-[#E8E2D5] dark:border-neutral-600 rounded-lg mt-2">
              <input name="title" placeholder={t('dashboard.agenda_task_title')} className="text-sm p-2 border rounded dark:bg-neutral-700 dark:border-neutral-600 dark:text-neutral-100" />
              <input name="date" type="date" className="text-sm p-2 border rounded dark:bg-neutral-700 dark:border-neutral-600 dark:text-neutral-100" />
              <input name="time" type="time" className="text-sm p-2 border rounded dark:bg-neutral-700 dark:border-neutral-600 dark:text-neutral-100" />
              <button type="submit" className="py-2 px-4 bg-black text-white dark:bg-neutral-100 dark:text-black rounded-full text-sm font-bold hover:opacity-80 transition-opacity">
                {t('dashboard.agenda_save')}
              </button>
            </form>
          )}
        </>
      )}
    </div>
  );
}
