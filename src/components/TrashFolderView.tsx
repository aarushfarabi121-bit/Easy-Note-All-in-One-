import React from 'react';
import { Calendar, RotateCcw, Trash2 } from 'lucide-react';
import {
  formatReadableDate,
  formatTimeDisplay,
  UI_TEXT,
} from '../i18n/translations';
import { Language, NoteItem } from '../types/note';

interface TrashFolderViewProps {
  lang: Language;
  trashedNotes: NoteItem[];
  onRestore: (note: NoteItem) => void;
  onPermanentDelete: (note: NoteItem) => void;
  onEmptyTrash: () => void;
}

export const TrashFolderView: React.FC<TrashFolderViewProps> = ({
  lang,
  trashedNotes,
  onRestore,
  onPermanentDelete,
  onEmptyTrash,
}) => {
  const t = UI_TEXT[lang];

  const sortedTrash = [...trashedNotes].sort(
    (a, b) => (b.trashedAtMs || 0) - (a.trashedAtMs || 0)
  );

  return (
    <div className="space-y-6">
      <section className="carved-panel p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            {t.trashTitle}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
            {t.trashSubtitle}
          </p>
        </div>

        {sortedTrash.length > 0 && (
          <button
            type="button"
            onClick={onEmptyTrash}
            className="carved-btn-surface inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/70 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {t.emptyTrash}
          </button>
        )}
      </section>

      {sortedTrash.length === 0 ? (
        <section className="carved-panel p-10 text-center space-y-2">
          <div className="carved-well w-12 h-12 mx-auto flex items-center justify-center text-slate-400 dark:text-slate-500">
            <Trash2 className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 pt-1">
            {t.trashEmptyState}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {t.trashEmptyDesc}
          </p>
        </section>
      ) : (
        <section className="carved-panel p-4 sm:p-5">
          <div className="carved-well p-3 space-y-2.5">
            {sortedTrash.map((note) => {
              const trashedDate = note.trashedAtMs
                ? new Date(note.trashedAtMs).toLocaleDateString(
                    lang === 'bn' ? 'bn-BD' : 'en-US',
                    { month: 'short', day: 'numeric', year: 'numeric' }
                  )
                : '';
              return (
                <article
                  key={note.id}
                  className="carved-tile p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 line-through decoration-slate-400 dark:decoration-slate-500">
                      {note.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400 font-mono-tabular">
                      <span>
                        {formatReadableDate(note.eventDate, lang)} ·{' '}
                        {formatTimeDisplay(note.eventTime, note.isAllDay, lang)}
                      </span>
                      {trashedDate && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>
                            {t.movedToTrashOn}: {trashedDate}
                          </span>
                        </>
                      )}
                      {note.source === 'google_calendar' && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="inline-flex items-center gap-1 text-sky-700 dark:text-sky-400 font-sans font-medium">
                            <Calendar className="w-3 h-3" />
                            {t.sourceGoogle}
                          </span>
                        </>
                      )}
                    </div>
                    {note.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 pt-0.5">
                        {note.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => onRestore(note)}
                      className="carved-btn-surface inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-teal-700 dark:text-teal-300 rounded-lg whitespace-nowrap cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      {t.restore}
                    </button>
                    <button
                      type="button"
                      onClick={() => onPermanentDelete(note)}
                      className="carved-btn-surface inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/70 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 whitespace-nowrap cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      {t.deleteForever}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};
