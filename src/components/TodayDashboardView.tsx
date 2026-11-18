import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Bell,
  CalendarDays,
  CheckCircle2,
  Compass,
  Flame,
  Plus,
  RefreshCw,
  Rocket,
  Sparkles,
  Sun,
  Target,
  Trophy,
  Zap,
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
  fetchCurrentWeather,
  WeatherSnapshot,
} from '../services/weatherService';
import { HolidayItem, Language, NoteItem } from '../types/note';
import {
  isNoteExpired,
  isOneDayBeforeReminderDue,
  sortNotesChronologically,
} from '../utils/lifecycle';
import { getDailyGreeting, GreetingIconKey } from '../utils/greetings';
import { NoteCard } from './NoteCard';

const GREETING_ICON_MAP: Record<GreetingIconKey, React.ComponentType<{ className?: string }>> = {
  rocket: Rocket,
  sparkles: Sparkles,
  flame: Flame,
  sun: Sun,
  zap: Zap,
  trophy: Trophy,
  target: Target,
  compass: Compass,
};

interface TodayDashboardViewProps {
  lang: Language;
  now: Date;
  notes: NoteItem[];
  holidays: HolidayItem[];
  weatherCity?: string;
  weatherLat?: number;
  weatherLon?: number;
  onOpenNewModal: (defaultDate?: string) => void;
  onOpenCalendar: () => void;
  onToggleComplete: (note: NoteItem) => void;
  onToggleChecklistItem: (note: NoteItem, itemId: string) => void;
  onEdit: (note: NoteItem) => void;
  onMoveToTrash: (note: NoteItem) => void;
}

export const TodayDashboardView: React.FC<TodayDashboardViewProps> = ({
  lang,
  now,
  notes,
  holidays,
  weatherCity,
  weatherLat,
  weatherLon,
  onOpenNewModal,
  onOpenCalendar,
  onToggleComplete,
  onToggleChecklistItem,
  onEdit,
  onMoveToTrash,
}) => {
  const t = UI_TEXT[lang];
  const todayStr = getLocalYYYYMMDD(now);
  const dailyGreeting = getDailyGreeting(now, lang);

  const [weather, setWeather] = useState<WeatherSnapshot | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);

  const loadWeather = async (force = false) => {
    setWeatherLoading(true);
    try {
      const snap = await fetchCurrentWeather(
        { city: weatherCity, lat: weatherLat, lon: weatherLon },
        force
      );
      setWeather(snap);
    } catch {
      // Weather stays gracefully omitted if network fails
    } finally {
      setWeatherLoading(false);
    }
  };

  useEffect(() => {
    void loadWeather(false);
  }, [weatherCity, weatherLat, weatherLon]);

  const nonTrashed = useMemo(
    () => notes.filter((n) => n.status !== 'trashed'),
    [notes]
  );

  const activeCount = useMemo(
    () => nonTrashed.filter((n) => n.status === 'active' && !isNoteExpired(n, now)).length,
    [nonTrashed, now]
  );

  const completedCount = useMemo(
    () => nonTrashed.filter((n) => n.status === 'completed').length,
    [nonTrashed]
  );

  const tomorrowReminders = useMemo(
    () =>
      sortNotesChronologically(
        nonTrashed.filter((n) => isOneDayBeforeReminderDue(n, now))
      ),
    [nonTrashed, now]
  );

  const todayNotes = useMemo(
    () =>
      sortNotesChronologically(nonTrashed.filter((n) => n.eventDate === todayStr)),
    [nonTrashed, todayStr]
  );

  const todayHolidays = holidays.filter((h) => h.date === todayStr);
  const upcomingHolidays = holidays.filter((h) => h.date >= todayStr).slice(0, 4);

  const weatherDateStr = localizeDigits(
    `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(
      2,
      '0'
    )}/${now.getFullYear()}`,
    lang
  );

  const GreetingIcon = GREETING_ICON_MAP[dailyGreeting.icon] || Sparkles;

  return (
    <div className="space-y-5">
      {/* Compact Classy Greeting Banner */}
      <section className="carved-panel px-4 py-3 sm:px-5 sm:py-3.5 bg-gradient-to-r from-slate-50/95 via-teal-50/50 to-indigo-50/55 dark:from-slate-900/90 dark:via-teal-950/35 dark:to-indigo-950/35 flex items-center gap-3.5">
        <div
          className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 via-sky-500 to-indigo-500 text-white flex items-center justify-center shrink-0 shadow-sm"
          aria-hidden="true"
        >
          <GreetingIcon className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-300 leading-tight">
            {dailyGreeting.salutation}
          </p>
          <p className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 leading-snug whitespace-normal break-words">
            {dailyGreeting.text}
          </p>
        </div>
      </section>

      {/* Single-Line Weather & dd/mm/yyyy Date Bar with Generous Spacing */}
      <section className="carved-panel px-5 py-3.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 shrink-0">
          <span
            className="text-2xl leading-none"
            role="img"
            aria-label={weather?.conditionEn || 'Weather'}
          >
            {weather ? weather.emoji : '🌤️'}
          </span>
          <span className="text-lg font-bold font-mono-tabular text-slate-900 dark:text-slate-100">
            {weather ? `${localizeDigits(weather.temperatureC, lang)}°C` : t.weatherLoading}
          </span>
        </div>

        <div className="flex items-center gap-3.5 min-w-0">
          <span className="text-xs sm:text-sm font-semibold font-mono-tabular text-slate-600 dark:text-slate-300 truncate">
            {weatherDateStr}
          </span>
          <button
            type="button"
            onClick={() => loadWeather(true)}
            disabled={weatherLoading}
            aria-label="Refresh weather"
            className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 cursor-pointer shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${weatherLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </section>

      {/* Distinct Colorful 3-KPI Strip: Warm Coral Active, Cool Indigo Tomorrow, Fresh Emerald Done */}
      <section className="grid grid-cols-3 gap-3.5">
        <div className="carved-panel p-4 flex items-center justify-between gap-3 bg-gradient-to-br from-orange-50 via-rose-50/85 to-amber-50/80 dark:from-orange-950/65 dark:via-rose-950/45 dark:to-amber-950/45 border-orange-300/85 dark:border-orange-600/60">
          <div>
            <p className="text-xs font-bold text-orange-800 dark:text-orange-200">
              {t.statActive}
            </p>
            <p className="mt-1 text-2xl font-bold font-mono-tabular text-orange-600 dark:text-orange-400">
              {localizeDigits(activeCount, lang)}
            </p>
          </div>
          <span className="w-3 h-8 rounded-full bg-gradient-to-b from-orange-500 to-rose-500 shadow-sm shrink-0" />
        </div>

        <div className="carved-panel p-4 flex items-center justify-between gap-3 bg-gradient-to-br from-indigo-50/90 via-violet-50/80 to-sky-50/80 dark:from-indigo-950/55 dark:via-violet-950/45 dark:to-sky-950/40 border-indigo-200/85 dark:border-indigo-700/60">
          <div>
            <p className="text-xs font-bold text-indigo-800 dark:text-indigo-200">
              {t.statTomorrow}
            </p>
            <p className="mt-1 text-2xl font-bold font-mono-tabular text-indigo-600 dark:text-indigo-400">
              {localizeDigits(tomorrowReminders.length, lang)}
            </p>
          </div>
          <span className="w-3 h-8 rounded-full bg-gradient-to-b from-indigo-500 to-violet-500 shrink-0" />
        </div>

        <div className="carved-panel p-4 flex items-center justify-between gap-3 bg-gradient-to-br from-emerald-50/85 via-teal-50/80 to-cyan-50/75 dark:from-emerald-950/50 dark:via-teal-950/45 dark:to-cyan-950/40 border-emerald-200/80 dark:border-emerald-700/60">
          <div>
            <p className="text-xs font-bold text-emerald-800 dark:text-emerald-200">
              {t.statCompleted}
            </p>
            <p className="mt-1 text-2xl font-bold font-mono-tabular text-emerald-600 dark:text-emerald-400">
              {localizeDigits(completedCount, lang)}
            </p>
          </div>
          <span className="w-3 h-8 rounded-full bg-gradient-to-b from-emerald-500 to-teal-500 shrink-0" />
        </div>
      </section>

      {/* Today's Holiday Highlight (if applicable) */}
      {todayHolidays.length > 0 && (
        <section className="carved-panel p-4 sm:p-5 bg-gradient-to-r from-indigo-50/90 via-white to-rose-50/70 dark:from-indigo-950/60 dark:via-slate-900/80 dark:to-rose-950/40 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div className="carved-well w-11 h-11 flex items-center justify-center text-2xl shrink-0">
              {todayHolidays[0].emoji}
            </div>
            <div>
              <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                {t.holidayTodayBanner}
              </p>
              <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                {todayHolidays
                  .map((h) => (lang === 'bn' ? h.nameBn : h.nameEn))
                  .join(' · ')}
              </p>
            </div>
          </div>
          <span className="text-xs font-mono-tabular text-indigo-700 dark:text-indigo-300 font-medium">
            {formatReadableDate(todayStr, lang)}
          </span>
        </section>
      )}

      {/* Clean Split Focus Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Primary Column (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Today's Action Plan */}
          <section className="carved-panel p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-slate-700/70">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-400 via-pink-500 to-amber-400 text-white flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {t.todayAgenda}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono-tabular">
                    {formatReadableDate(todayStr, lang)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onOpenNewModal(todayStr)}
                className="carved-btn-surface px-3 py-1.5 rounded-lg text-xs font-semibold text-teal-700 dark:text-teal-300 whitespace-nowrap shrink-0 cursor-pointer"
              >
                + {t.newNote}
              </button>
            </div>

            {todayNotes.length === 0 ? (
              <div className="carved-well p-8 text-center space-y-3">
                <Sparkles className="w-6 h-6 text-teal-500 mx-auto" />
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {t.todayEmptyTitle}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  {t.todayEmptyDesc}
                </p>
                <button
                  type="button"
                  onClick={() => onOpenNewModal(todayStr)}
                  className="carved-btn-primary inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white rounded-xl cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {t.newNote}
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {todayNotes.map((note) => (
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
          </section>
        </div>

        {/* Right Focus Rail (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* 1-Day-Before Reminders */}
          <section className="carved-panel p-5 space-y-3.5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-rose-500 text-white flex items-center justify-center shrink-0">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {t.tomorrowReminderTitle}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t.tomorrowReminderSub}
                </p>
              </div>
            </div>

            {tomorrowReminders.length === 0 ? (
              <div className="carved-well p-4 text-xs text-slate-600 dark:text-slate-400">
                {t.noRemindersTomorrow}
              </div>
            ) : (
              <div className="space-y-2">
                {tomorrowReminders.map((item) => {
                  const pMeta = PRIORITY_META[item.priority] || PRIORITY_META.medium;
                  return (
                    <div
                      key={item.id}
                      className="carved-tile p-3 flex items-center justify-between gap-2.5"
                    >
                      <div className="min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => onEdit(item)}
                          className="text-sm font-semibold text-slate-900 dark:text-slate-100 hover:text-teal-600 dark:hover:text-teal-300 text-left truncate block w-full cursor-pointer"
                        >
                          {item.title}
                        </button>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-mono-tabular mt-0.5">
                          {formatTimeDisplay(item.eventTime, item.isAllDay, lang)} ·{' '}
                          <span className={pMeta.textClass}>
                            {lang === 'bn' ? pMeta.labelBn : pMeta.labelEn}
                          </span>
                        </p>
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

          {/* Upcoming Bangladesh Holidays */}
          <section className="carved-panel p-5 space-y-3.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shrink-0">
                  <CalendarDays className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {t.upcomingHolidays}
                </h2>
              </div>
              <button
                type="button"
                onClick={onOpenCalendar}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <span>{t.openCalendar}</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-2">
              {upcomingHolidays.map((holiday) => (
                <div
                  key={holiday.id}
                  className="carved-tile px-3 py-2.5 flex items-start gap-3"
                >
                  <span className="text-lg leading-none mt-0.5" aria-hidden="true">
                    {holiday.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 leading-snug">
                      {lang === 'bn' ? holiday.nameBn : holiday.nameEn}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono-tabular mt-0.5">
                      {formatReadableDate(holiday.date, lang)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
