import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  FileText,
  Image as ImageIcon,
  Mic,
  Plus,
  Search,
} from 'lucide-react';
import {
  formatReadableDate,
  formatTimeDisplay,
  getLocalYYYYMMDD,
  localizeDigits,
  PRIORITY_META,
  UI_TEXT,
} from '../i18n/translations';
import {
  HolidayItem,
  Language,
  NoteItem,
  SmartFilter,
} from '../types/note';
import { isNoteExpired, sortNotesChronologically } from '../utils/lifecycle';
import { NoteCard } from './NoteCard';

interface TimelineNotesViewProps {
  lang: Language;
  now: Date;
  notes: NoteItem[];
  holidays: HolidayItem[];
  onOpenNewModal: () => void;
  onToggleComplete: (note: NoteItem) => void;
  onToggleChecklistItem: (note: NoteItem, itemId: string) => void;
  onEdit: (note: NoteItem) => void;
  onMoveToTrash: (note: NoteItem) => void;
}

export const TimelineNotesView: React.FC<TimelineNotesViewProps> = ({
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
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<SmartFilter>('all');

  const holidayMap = useMemo(() => {
    const map = new Map<string, HolidayItem[]>();
    for (const h of holidays) {
      const list = map.get(h.date) || [];
      list.push(h);
      map.set(h.date, list);
    }
    return map;
  }, [holidays]);

  const upcomingFive = useMemo(
    () =>
      sortNotesChronologically(
        notes.filter(
          (n) =>
            n.status === 'active' &&
            !isNoteExpired(n, now) &&
            n.eventDate >= todayStr
        )
      ).slice(0, 5),
    [notes, now, todayStr]
  );

  const filteredNotes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = notes.filter((n) => {
      if (n.status === 'trashed') return false;

      const expired = isNoteExpired(n, now);
      if (filter === 'upcoming' && (n.status !== 'active' || expired)) return false;
      if (filter === 'completed' && n.status !== 'completed') return false;
      if (filter === 'google_calendar' && n.source !== 'google_calendar') return false;

      if (q) {
        const haystack = [
          n.title,
          n.description,
          n.categoryLabel,
          ...n.checklist.map((c) => c.text),
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      return true;
    });

    return sortNotesChronologically(list);
  }, [notes, searchQuery, filter, now]);

  const groupedByDate = useMemo(() => {
    const groups = new Map<string, NoteItem[]>();
    for (const note of filteredNotes) {
      const existing = groups.get(note.eventDate) || [];
      existing.push(note);
      groups.set(note.eventDate, existing);
    }
    return Array.from(groups.entries());
  }, [filteredNotes]);

  const filterTabs: { id: SmartFilter; label: string }[] = [
    { id: 'all', label: t.filterAll },
    { id: 'upcoming', label: t.filterUpcoming },
    { id: 'completed', label: t.filterCompleted },
    { id: 'google_calendar', label: t.filterGoogle },
  ];

  return (
    <div className="space-y-5">
      {/* Upcoming task (Next 5 at a Glance) */}
      <section className="carved-panel p-5 space-y-3.5">
        <div className="flex items-center justify-between gap-3 pb-2.5 border-b border-slate-200/80 dark:border-slate-700/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-400 to-sky-500 text-white flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
              {t.upcomingFiveTitle}
            </h2>
          </div>
          <span className="text-xs font-mono-tabular font-semibold text-teal-700 dark:text-teal-300">
            {localizeDigits(upcomingFive.length, lang)}/{localizeDigits(5, lang)}
          </span>
        </div>

        {upcomingFive.length === 0 ? (
          <div className="carved-well p-4 text-xs sm:text-sm text-slate-600 dark:text-slate-400 text-center">
            {t.upcomingFiveEmpty}
          </div>
        ) : (
          <div className="space-y-2">
            {upcomingFive.map((item, idx) => {
              const pMeta = PRIORITY_META[item.priority] || PRIORITY_META.medium;
              const hasVoice = item.attachments?.some((a) => a.type === 'voice');
              const hasPdf = item.attachments?.some((a) => a.type === 'pdf');
              const hasImage = item.attachments?.some((a) => a.type === 'image');

              return (
                <div
                  key={item.id}
                  className="carved-tile px-3.5 py-2.5 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold font-mono-tabular text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
                      {localizeDigits(idx + 1, lang)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => onEdit(item)}
                        className="text-sm font-semibold text-slate-900 dark:text-slate-100 hover:text-teal-600 dark:hover:text-teal-300 text-left truncate block w-full cursor-pointer"
                      >
                        {item.title}
                      </button>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500 dark:text-slate-400 font-mono-tabular mt-0.5">
                        <span>{formatReadableDate(item.eventDate, lang)}</span>
                        <span aria-hidden="true">·</span>
                        <span>
                          {formatTimeDisplay(item.eventTime, item.isAllDay, lang)}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className={`font-sans font-medium ${pMeta.textClass}`}>
                          {lang === 'bn' ? pMeta.labelBn : pMeta.labelEn}
                        </span>
                        {hasVoice && <Mic className="w-3 h-3 text-rose-500" />}
                        {hasPdf && <FileText className="w-3 h-3 text-amber-500" />}
                        {hasImage && <ImageIcon className="w-3 h-3 text-sky-500" />}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onToggleComplete(item)}
                    className="carved-btn-surface p-2 rounded-lg text-teal-600 dark:text-teal-400 shrink-0 cursor-pointer"
                    title={t.markComplete}
                    aria-label={t.markComplete}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Simple & Easy Single-Row Search + 4 Clean Filter Tabs */}
      <section className="carved-panel p-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full pl-10 pr-4 py-2 text-sm bg-white/90 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-teal-500"
          />
        </div>

        <div className="carved-pill-track grid grid-cols-4 sm:inline-flex gap-1 p-1 shrink-0">
          {filterTabs.map((tab) => {
            const active = filter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                  active
                    ? 'carved-pill-active text-slate-900 dark:text-slate-100 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </section>

      {groupedByDate.length === 0 ? (
        <section className="carved-panel p-10 text-center space-y-3">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {t.notesEmptyTitle}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {t.notesEmptyDesc}
          </p>
          <button
            type="button"
            onClick={onOpenNewModal}
            className="carved-btn-primary inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white rounded-xl cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            {t.createFirstNote}
          </button>
        </section>
      ) : (
        <div className="space-y-6">
          {groupedByDate.map(([dateStr, dateNotes]) => {
            const dayHolidays = holidayMap.get(dateStr) || [];
            return (
              <section key={dateStr} className="space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 font-mono-tabular">
                      {formatReadableDate(dateStr, lang)}
                    </h3>
                    {dayHolidays.map((h) => (
                      <span
                        key={h.id}
                        className="text-xs font-medium text-indigo-700 dark:text-indigo-300 inline-flex items-center gap-1"
                      >
                        <span aria-hidden="true">· {h.emoji}</span>
                        <span>{lang === 'bn' ? h.nameBn : h.nameEn}</span>
                      </span>
                    ))}
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-mono-tabular">
                    {localizeDigits(dateNotes.length, lang)}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {dateNotes.map((note) => (
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
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
};
