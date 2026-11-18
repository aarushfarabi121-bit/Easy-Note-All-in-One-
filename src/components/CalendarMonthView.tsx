import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import {
  COLOR_TAG_META,
  formatMonthYear,
  formatReadableDate,
  getLocalYYYYMMDD,
  getWeekdayLabels,
  localizeDigits,
  UI_TEXT,
} from '../i18n/translations';
import { HolidayItem, Language, NoteItem } from '../types/note';
import { isNoteExpired, sortNotesChronologically } from '../utils/lifecycle';
import { NoteCard } from './NoteCard';

interface CalendarMonthViewProps {
  lang: Language;
  now: Date;
  notes: NoteItem[];
  holidays: HolidayItem[];
  onOpenNewModal: (defaultDate: string) => void;
  onToggleComplete: (note: NoteItem) => void;
  onToggleChecklistItem: (note: NoteItem, itemId: string) => void;
  onEdit: (note: NoteItem) => void;
  onMoveToTrash: (note: NoteItem) => void;
}

export const CalendarMonthView: React.FC<CalendarMonthViewProps> = ({
  lang,
  now,
  notes,
  holidays,
  onOpenNewModal,
  onToggleComplete,
  onToggleChecklistItem,
  onEdit,
  onMoveToTrash,
}) => {
  const t = UI_TEXT[lang];
  const todayStr = getLocalYYYYMMDD(now);

  const [cursorYear, setCursorYear] = useState(now.getFullYear());
  const [cursorMonth, setCursorMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState(todayStr);

  const nonTrashed = useMemo(
    () => notes.filter((n) => n.status !== 'trashed'),
    [notes]
  );

  const notesByDate = useMemo(() => {
    const map = new Map<string, NoteItem[]>();
    for (const note of nonTrashed) {
      const list = map.get(note.eventDate) || [];
      list.push(note);
      map.set(note.eventDate, list);
    }
    return map;
  }, [nonTrashed]);

  const holidaysByDate = useMemo(() => {
    const map = new Map<string, HolidayItem[]>();
    for (const h of holidays) {
      const list = map.get(h.date) || [];
      list.push(h);
      map.set(h.date, list);
    }
    return map;
  }, [holidays]);

  const calendarCells = useMemo(() => {
    const firstDayOfMonth = new Date(cursorYear, cursorMonth, 1);
    const startWeekday = firstDayOfMonth.getDay();
    const daysInMonth = new Date(cursorYear, cursorMonth + 1, 0).getDate();
    const cells: { dateStr: string; dayNum: number; inCurrentMonth: boolean }[] = [];

    const prevMonthLastDay = new Date(cursorYear, cursorMonth, 0).getDate();
    for (let i = startWeekday - 1; i >= 0; i--) {
      const dayNum = prevMonthLastDay - i;
      const dt = new Date(cursorYear, cursorMonth - 1, dayNum);
      cells.push({
        dateStr: getLocalYYYYMMDD(dt),
        dayNum,
        inCurrentMonth: false,
      });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dt = new Date(cursorYear, cursorMonth, d);
      cells.push({
        dateStr: getLocalYYYYMMDD(dt),
        dayNum: d,
        inCurrentMonth: true,
      });
    }

    const targetCells = cells.length > 35 ? 42 : 35;
    let nextDay = 1;
    while (cells.length < targetCells) {
      const dt = new Date(cursorYear, cursorMonth + 1, nextDay);
      cells.push({
        dateStr: getLocalYYYYMMDD(dt),
        dayNum: nextDay,
        inCurrentMonth: false,
      });
      nextDay += 1;
    }

    return cells;
  }, [cursorYear, cursorMonth]);

  const goPrevMonth = () => {
    if (cursorMonth === 0) {
      setCursorYear((y) => y - 1);
      setCursorMonth(11);
    } else {
      setCursorMonth((m) => m - 1);
    }
  };

  const goNextMonth = () => {
    if (cursorMonth === 11) {
      setCursorYear((y) => y + 1);
      setCursorMonth(0);
    } else {
      setCursorMonth((m) => m + 1);
    }
  };

  const goToday = () => {
    setCursorYear(now.getFullYear());
    setCursorMonth(now.getMonth());
    setSelectedDate(todayStr);
  };

  const selectedDayNotes = sortNotesChronologically(notesByDate.get(selectedDate) || []);
  const selectedDayHolidays = holidaysByDate.get(selectedDate) || [];
  const weekdays = getWeekdayLabels(lang);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <section className="lg:col-span-8 carved-panel p-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
            {formatMonthYear(cursorYear, cursorMonth, lang)}
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={goToday}
              className="carved-btn-surface px-3 py-1.5 text-xs font-semibold text-teal-700 dark:text-teal-300 rounded-lg whitespace-nowrap cursor-pointer"
            >
              {lang === 'bn' ? 'আজ' : 'Today'}
            </button>
            <button
              type="button"
              onClick={goPrevMonth}
              className="carved-btn-surface p-1.5 rounded-lg text-slate-600 dark:text-slate-300 cursor-pointer"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={goNextMonth}
              className="carved-btn-surface p-1.5 rounded-lg text-slate-600 dark:text-slate-300 cursor-pointer"
              aria-label="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="carved-well p-2.5 space-y-2">
          <div className="grid grid-cols-7 gap-1.5">
            {weekdays.map((wd) => (
              <div
                key={wd}
                className="py-1.5 text-center text-xs font-semibold text-slate-500 dark:text-slate-400"
              >
                {wd}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {calendarCells.map((cell) => {
              const cellNotes = notesByDate.get(cell.dateStr) || [];
              const cellHolidays = holidaysByDate.get(cell.dateStr) || [];
              const isToday = cell.dateStr === todayStr;
              const isSelected = cell.dateStr === selectedDate;
              const hasHoliday = cellHolidays.length > 0;

              return (
                <button
                  key={cell.dateStr}
                  type="button"
                  onClick={() => setSelectedDate(cell.dateStr)}
                  className={`min-h-[82px] sm:min-h-[96px] p-2 rounded-xl text-left flex flex-col justify-between transition-all cursor-pointer ${
                    !cell.inCurrentMonth
                      ? 'bg-slate-200/40 dark:bg-slate-900/40 text-slate-400 dark:text-slate-600 border border-transparent'
                      : hasHoliday
                        ? 'carved-tile bg-gradient-to-b from-indigo-50/90 to-white dark:from-indigo-950/60 dark:to-slate-900/80 border-indigo-200/80 dark:border-indigo-800/70'
                        : 'carved-tile'
                  } ${isSelected ? 'ring-2 ring-teal-500 border-teal-500' : ''}`}
                >
                  <div className="flex items-start justify-between gap-1 w-full">
                    <span
                      className={`inline-flex items-center justify-center w-6 h-6 text-xs font-mono-tabular font-semibold rounded-full ${
                        isToday
                          ? 'bg-gradient-to-br from-teal-500 to-sky-500 text-white shadow-sm'
                          : cell.inCurrentMonth
                            ? 'text-slate-800 dark:text-slate-200'
                            : 'text-slate-400 dark:text-slate-600'
                      }`}
                    >
                      {localizeDigits(cell.dayNum, lang)}
                    </span>
                    {hasHoliday && (
                      <span
                        className="text-sm leading-none"
                        title={
                          lang === 'bn'
                            ? cellHolidays[0].nameBn
                            : cellHolidays[0].nameEn
                        }
                      >
                        {cellHolidays[0].emoji}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 mt-1 w-full overflow-hidden">
                    {hasHoliday && (
                      <p className="text-[11px] font-medium text-indigo-700 dark:text-indigo-300 truncate">
                        {lang === 'bn' ? cellHolidays[0].nameBn : cellHolidays[0].nameEn}
                      </p>
                    )}

                    {cellNotes.slice(0, 2).map((n) => {
                      const expired = isNoteExpired(n, now);
                      const dot = COLOR_TAG_META[n.colorTag]?.dotClass || 'bg-teal-500';
                      return (
                        <div key={n.id} className="flex items-center gap-1 min-w-0">
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />
                          <span
                            className={`text-[11px] truncate ${
                              expired || n.status === 'completed'
                                ? 'line-through text-slate-400 dark:text-slate-500'
                                : 'text-slate-700 dark:text-slate-200'
                            }`}
                          >
                            {n.title}
                          </span>
                        </div>
                      );
                    })}

                    {cellNotes.length > 2 && (
                      <p className="text-[10px] font-mono-tabular text-slate-500 dark:text-slate-400">
                        +{localizeDigits(cellNotes.length - 2, lang)}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <aside className="lg:col-span-4 carved-panel p-5 space-y-4">
        <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-200/80 dark:border-slate-700/70">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {t.calendarDayEvents}
            </p>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 font-mono-tabular mt-0.5">
              {formatReadableDate(selectedDate, lang)}
            </h3>
          </div>
          <button
            type="button"
            onClick={() => onOpenNewModal(selectedDate)}
            className="carved-btn-primary inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            {t.newNote}
          </button>
        </div>

        {selectedDayHolidays.length > 0 && (
          <div className="carved-well p-3.5 space-y-1 bg-indigo-50/70 dark:bg-indigo-950/50">
            <p className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-300">
              {t.holidaysLabel}
            </p>
            {selectedDayHolidays.map((h) => (
              <p key={h.id} className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {h.emoji} {lang === 'bn' ? h.nameBn : h.nameEn}
              </p>
            ))}
          </div>
        )}

        {selectedDayNotes.length === 0 ? (
          <div className="carved-well py-7 px-4 text-center space-y-2.5">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t.noEventsOnDay}
            </p>
            <button
              type="button"
              onClick={() => onOpenNewModal(selectedDate)}
              className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline cursor-pointer"
            >
              + {t.addNoteOnDate}
            </button>
          </div>
        ) : (
          <div className="carved-well p-2.5 space-y-2.5">
            {selectedDayNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                lang={lang}
                now={now}
                onToggleComplete={onToggleComplete}
                onToggleChecklistItem={onToggleChecklistItem}
                onEdit={onEdit}
                onMoveToTrash={onMoveToTrash}
              />
            ))}
          </div>
        )}
      </aside>
    </div>
  );
};
