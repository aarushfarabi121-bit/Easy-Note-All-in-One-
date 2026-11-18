import React, { useEffect, useState } from 'react';
import {
  Bell,
  Calendar,
  Check,
  CheckSquare,
  ChevronDown,
  ChevronUp,
  Clock,
  Download,
  Edit3,
  FileText,
  Mic,
  Square,
  Trash2,
  X,
} from 'lucide-react';
import {
  COLOR_TAG_META,
  formatReadableDate,
  formatTimeDisplay,
  localizeDigits,
  PRIORITY_META,
  UI_TEXT,
} from '../i18n/translations';
import { Language, NoteAttachment, NoteItem } from '../types/note';
import {
  getDaysUntilAutoTrash,
  isNoteExpired,
  isOneDayBeforeReminderDue,
} from '../utils/lifecycle';

interface NoteCardProps {
  note: NoteItem;
  lang: Language;
  now: Date;
  showDateInMeta?: boolean;
  onToggleComplete: (note: NoteItem) => void;
  onToggleChecklistItem: (note: NoteItem, itemId: string) => void;
  onEdit: (note: NoteItem) => void;
  onMoveToTrash: (note: NoteItem) => void;
}

function formatBytes(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const NoteCard: React.FC<NoteCardProps> = ({
  note,
  lang,
  now,
  showDateInMeta = false,
  onToggleComplete,
  onToggleChecklistItem,
  onEdit,
  onMoveToTrash,
}) => {
  const [checklistExpanded, setChecklistExpanded] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState<NoteAttachment | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!previewAttachment || previewAttachment.type !== 'pdf') {
      setPdfBlobUrl(null);
      return;
    }
    let objectUrl: string | null = null;
    try {
      const parts = previewAttachment.dataUrl.split(',');
      const b64 = parts[1];
      if (b64) {
        const bin = atob(b64);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) {
          bytes[i] = bin.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: 'application/pdf' });
        objectUrl = URL.createObjectURL(blob);
        setPdfBlobUrl(objectUrl);
      } else {
        setPdfBlobUrl(previewAttachment.dataUrl);
      }
    } catch {
      setPdfBlobUrl(previewAttachment.dataUrl);
    }

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [previewAttachment]);
  const t = UI_TEXT[lang];
  const expired = isNoteExpired(note, now);
  const completed = note.status === 'completed';
  const isCrossed = expired || completed;
  const reminderTomorrow = isOneDayBeforeReminderDue(note, now);
  const daysLeft = expired ? getDaysUntilAutoTrash(note, now) : 7;

  const colorMeta = COLOR_TAG_META[note.colorTag] || COLOR_TAG_META.teal;
  const priorityMeta = PRIORITY_META[note.priority] || PRIORITY_META.medium;

  const doneCount = note.checklist.filter((c) => c.done).length;
  const totalCount = note.checklist.length;
  const attachments = note.attachments || [];
  const voiceAttachments = attachments.filter((a) => a.type === 'voice');
  const imageAttachments = attachments.filter((a) => a.type === 'image');
  const pdfAttachments = attachments.filter((a) => a.type === 'pdf');

  const timeRangeText = note.isAllDay
    ? formatTimeDisplay('', true, lang)
    : note.endTime
      ? `${formatTimeDisplay(note.eventTime, false, lang)} – ${formatTimeDisplay(
          note.endTime,
          false,
          lang
        )}`
      : formatTimeDisplay(note.eventTime, false, lang);

  return (
    <>
      <article
        className={`group p-4 transition-all duration-150 ${
          isCrossed ? 'carved-well opacity-90' : 'carved-tile'
        }`}
      >
        <div className="flex items-start gap-3.5">
          <button
            type="button"
            onClick={() => onToggleComplete(note)}
            aria-label={completed ? t.markActive : t.markComplete}
            title={completed ? t.markActive : t.markComplete}
            className={`mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all cursor-pointer ${
              completed
                ? 'bg-teal-600 border-teal-700 text-white shadow-sm'
                : expired
                  ? 'bg-white/70 dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-400 hover:border-teal-500'
                  : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-transparent hover:border-teal-500'
            }`}
          >
            <Check className="w-3 h-3 stroke-[2.5]" />
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full shrink-0 ring-2 ring-white dark:ring-slate-900 ${colorMeta.dotClass}`}
                    aria-hidden="true"
                  />
                  <h3
                    className={`text-[15px] font-semibold leading-snug break-words ${
                      isCrossed
                        ? 'line-through text-slate-500 dark:text-slate-400 decoration-slate-400 decoration-[1.5px]'
                        : 'text-slate-900 dark:text-slate-100'
                    }`}
                  >
                    {note.title}
                  </h3>
                </div>

                <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                  <span className="inline-flex items-center gap-1 font-mono-tabular text-slate-700 dark:text-slate-300 font-medium">
                    <Clock className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                    {timeRangeText}
                  </span>

                  {showDateInMeta && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono-tabular">
                        {formatReadableDate(note.eventDate, lang)}
                      </span>
                    </>
                  )}

                  <span aria-hidden="true">·</span>
                  <span className={`font-medium ${priorityMeta.textClass}`}>
                    {lang === 'bn' ? priorityMeta.labelBn : priorityMeta.labelEn}
                  </span>

                  {note.categoryLabel && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="text-slate-600 dark:text-slate-300">
                        {note.categoryLabel}
                      </span>
                    </>
                  )}

                  {note.source === 'google_calendar' && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="inline-flex items-center gap-1 text-sky-700 dark:text-sky-400 font-medium">
                        <Calendar className="w-3 h-3 shrink-0" />
                        {t.sourceGoogle}
                      </span>
                    </>
                  )}

                  {reminderTomorrow && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400 font-medium">
                        <Bell className="w-3 h-3 shrink-0" />
                        {lang === 'bn' ? 'আগামীকালের রিমাইন্ডার' : '1-day reminder'}
                      </span>
                    </>
                  )}

                  {expired && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="text-amber-700 dark:text-amber-400 font-medium font-mono-tabular">
                        {t.expiredLabel} ·{' '}
                        {daysLeft <= 0
                          ? t.todayLastDay
                          : `${t.autoTrashIn} ${localizeDigits(daysLeft, lang)} ${t.daysUnit}`}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0 opacity-90 group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => onEdit(note)}
                  className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-teal-700 dark:hover:text-teal-300 hover:bg-teal-50/80 dark:hover:bg-teal-950/60 transition-colors cursor-pointer"
                  aria-label={t.edit}
                  title={t.edit}
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onMoveToTrash(note)}
                  className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50/80 dark:hover:bg-rose-950/60 transition-colors cursor-pointer"
                  aria-label={t.moveToTrash}
                  title={t.moveToTrash}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {note.description && (
              <p
                className={`mt-2 text-sm leading-relaxed whitespace-pre-line break-words ${
                  isCrossed
                    ? 'line-through text-slate-400 dark:text-slate-500'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                {note.description}
              </p>
            )}

            {/* Voice, Image & PDF Note Attachments */}
            {attachments.length > 0 && (
              <div className="mt-3 space-y-2.5">
                {voiceAttachments.map((att) => (
                  <div
                    key={att.id}
                    className="carved-well p-2.5 flex flex-col sm:flex-row sm:items-center gap-2"
                  >
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 shrink-0">
                      <Mic className="w-3.5 h-3.5" />
                      {att.name}
                    </span>
                    <audio controls src={att.dataUrl} className="w-full h-8" />
                  </div>
                ))}

                {imageAttachments.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {imageAttachments.map((att) => (
                      <button
                        key={att.id}
                        type="button"
                        onClick={() => setPreviewAttachment(att)}
                        className="group/img relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm hover:scale-105 transition-transform cursor-pointer"
                        title={att.name}
                      >
                        <img
                          src={att.dataUrl}
                          alt={att.name}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}

                {pdfAttachments.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {pdfAttachments.map((att) => (
                      <div
                        key={att.id}
                        className="carved-well px-3 py-2 inline-flex items-center gap-2.5 text-xs"
                      >
                        <FileText className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                        <button
                          type="button"
                          onClick={() => setPreviewAttachment(att)}
                          className="font-semibold text-slate-800 dark:text-slate-200 hover:text-teal-600 dark:hover:text-teal-400 truncate max-w-[170px] cursor-pointer"
                        >
                          {att.name}
                        </button>
                        {att.sizeBytes && (
                          <span className="text-slate-400 font-mono-tabular">
                            {formatBytes(att.sizeBytes)}
                          </span>
                        )}
                        <a
                          href={att.dataUrl}
                          download={att.name}
                          className="p-1 rounded-md text-slate-500 hover:text-teal-600 dark:hover:text-teal-300"
                          title={t.downloadFile}
                          aria-label={t.downloadFile}
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {totalCount > 0 && (
              <div className="mt-3 pt-2.5 border-t border-slate-200/70 dark:border-slate-700/70">
                <button
                  type="button"
                  onClick={() => setChecklistExpanded((v) => !v)}
                  className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-teal-700 dark:hover:text-teal-300 transition-colors cursor-pointer"
                >
                  <CheckSquare className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                  <span className="font-mono-tabular">
                    {t.subtasksLabel}: {localizeDigits(doneCount, lang)}/
                    {localizeDigits(totalCount, lang)}
                  </span>
                  {checklistExpanded ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>

                {(checklistExpanded || totalCount <= 3) && (
                  <ul className="mt-2 space-y-1.5">
                    {note.checklist.map((item) => (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => onToggleChecklistItem(note, item.id)}
                          className="flex items-center gap-2 text-left text-xs sm:text-sm text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white w-full py-0.5 cursor-pointer"
                        >
                          {item.done ? (
                            <CheckSquare className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400 shrink-0" />
                          )}
                          <span
                            className={
                              item.done
                                ? 'line-through text-slate-400 dark:text-slate-500'
                                : 'text-slate-700 dark:text-slate-200'
                            }
                          >
                            {item.text}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      </article>

      {/* In-App Image & PDF Preview Lightbox Modal */}
      {previewAttachment && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setPreviewAttachment(null)}
        >
          <div
            className="carved-panel max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200/80 dark:border-slate-700/70">
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                {previewAttachment.name}
              </span>
              <div className="flex items-center gap-2">
                <a
                  href={previewAttachment.dataUrl}
                  download={previewAttachment.name}
                  className="carved-btn-surface inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-teal-700 dark:text-teal-300 rounded-lg"
                >
                  <Download className="w-3.5 h-3.5" />
                  {t.downloadFile}
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewAttachment(null)}
                  className="carved-btn-surface p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-100 cursor-pointer"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-100/60 dark:bg-slate-950/60">
              {previewAttachment.type === 'image' ? (
                <img
                  src={previewAttachment.dataUrl}
                  alt={previewAttachment.name}
                  className="max-h-[75vh] w-auto rounded-xl shadow-lg object-contain"
                />
              ) : (
                <object
                  data={pdfBlobUrl || previewAttachment.dataUrl}
                  type="application/pdf"
                  aria-label={previewAttachment.name}
                  className="w-full h-[72vh] rounded-xl border border-slate-200 dark:border-slate-700 bg-white"
                >
                  <div className="p-8 text-center space-y-3">
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      {previewAttachment.name}
                    </p>
                    <a
                      href={previewAttachment.dataUrl}
                      download={previewAttachment.name}
                      className="carved-btn-primary inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white rounded-lg"
                    >
                      <Download className="w-3.5 h-3.5" />
                      {t.downloadFile}
                    </a>
                  </div>
                </object>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
