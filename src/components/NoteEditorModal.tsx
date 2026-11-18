import React, { useEffect, useRef, useState } from 'react';
import {
  CalendarSync,
  Check,
  CheckSquare,
  ChevronDown,
  ChevronUp,
  Clock,
  FileText,
  Image as ImageIcon,
  Mic,
  Minus,
  Plus,
  Square,
  Square as StopIcon,
  Tag,
  Trash2,
  X,
} from 'lucide-react';
import {
  addDaysYYYYMMDD,
  COLOR_TAG_META,
  formatReadableDate,
  formatTimeDisplay,
  getLocalYYYYMMDD,
  localizeDigits,
  PRIORITY_META,
  UI_TEXT,
} from '../i18n/translations';
import {
  ChecklistItem,
  ColorTag,
  Language,
  NoteAttachment,
  NoteDraft,
  NoteItem,
  PriorityLevel,
} from '../types/note';

interface NoteEditorModalProps {
  isOpen: boolean;
  lang: Language;
  initialNote?: NoteItem | null;
  defaultDate?: string;
  hasGoogleToken: boolean;
  onClose: () => void;
  onSave: (draft: NoteDraft) => Promise<void>;
}

const COLOR_OPTIONS: ColorTag[] = ['teal', 'sky', 'amber', 'rose', 'indigo', 'slate'];
const PRIORITY_OPTIONS: PriorityLevel[] = ['high', 'medium', 'low'];

function addMinutesToTime24(time24: string, addMins: number): string {
  const [hStr, mStr] = (time24 || '09:00').split(':');
  const total = (Number(hStr) || 0) * 60 + (Number(mStr) || 0) + addMins;
  const wrapped = ((total % 1440) + 1440) % 1440;
  const h = Math.floor(wrapped / 60);
  const m = wrapped % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function parse24To12(time24: string): { hour12: number; minute: number; period: 'AM' | 'PM' } {
  const [hStr, mStr] = (time24 || '09:00').split(':');
  const h = Number(hStr);
  const m = Number(mStr);
  const safeH = Number.isNaN(h) ? 9 : Math.max(0, Math.min(23, h));
  const safeM = Number.isNaN(m) ? 0 : Math.max(0, Math.min(59, m));
  const period: 'AM' | 'PM' = safeH >= 12 ? 'PM' : 'AM';
  const hour12 = safeH % 12 === 0 ? 12 : safeH % 12;
  return { hour12, minute: safeM, period };
}

function format12To24(hour12: number, minute: number, period: 'AM' | 'PM'): string {
  let h24 = hour12 % 12;
  if (period === 'PM') h24 += 12;
  return `${String(h24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function formatSeconds(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export const NoteEditorModal: React.FC<NoteEditorModalProps> = ({
  isOpen,
  lang,
  initialNote,
  defaultDate,
  hasGoogleToken,
  onClose,
  onSave,
}) => {
  const t = UI_TEXT[lang];
  const todayStr = getLocalYYYYMMDD();
  const tomorrowStr = addDaysYYYYMMDD(todayStr, 1);
  const nextWeekStr = addDaysYYYYMMDD(todayStr, 7);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState(todayStr);
  const [eventTime, setEventTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [isAllDay, setIsAllDay] = useState(false);
  const [priority, setPriority] = useState<PriorityLevel>('medium');
  const [colorTag, setColorTag] = useState<ColorTag>('teal');
  const [categoryLabel, setCategoryLabel] = useState('');
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [attachments, setAttachments] = useState<NoteAttachment[]>([]);
  const [newSubtask, setNewSubtask] = useState('');
  const [syncToGoogle, setSyncToGoogle] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Progressive disclosure toggles to keep New Note clean and friendly
  const [showTimeAdjuster, setShowTimeAdjuster] = useState(false);
  const [showChecklistSection, setShowChecklistSection] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);

  // Voice recorder state
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<number | null>(null);
  const discardRecordingRef = useRef(false);

  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const pdfInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      discardRecordingRef.current = true;
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((tr) => tr.stop());
      }
      if (recordTimerRef.current) {
        window.clearInterval(recordTimerRef.current);
      }
      setIsRecording(false);
      setRecordSeconds(0);
      return;
    }

    discardRecordingRef.current = false;

    setFormError('');
    setIsSaving(false);
    setShowTimeAdjuster(false);

    if (initialNote) {
      setTitle(initialNote.title);
      setDescription(initialNote.description);
      setEventDate(initialNote.eventDate);
      setEventTime(initialNote.eventTime || '09:00');
      setEndTime(initialNote.endTime || '');
      setIsAllDay(initialNote.isAllDay);
      setPriority(initialNote.priority);
      setColorTag(initialNote.colorTag);
      setCategoryLabel(initialNote.categoryLabel);
      setChecklist(initialNote.checklist || []);
      setAttachments(initialNote.attachments || []);
      setShowChecklistSection((initialNote.checklist || []).length > 0);
      setShowMoreOptions(Boolean(initialNote.categoryLabel));
      setSyncToGoogle(
        initialNote.source === 'google_calendar' || Boolean(initialNote.googleEventId)
      );
    } else {
      setTitle('');
      setDescription('');
      setEventDate(defaultDate || getLocalYYYYMMDD());
      setEventTime('09:00');
      setEndTime('10:00');
      setIsAllDay(false);
      setPriority('medium');
      setColorTag('teal');
      setCategoryLabel('');
      setChecklist([]);
      setAttachments([]);
      setShowChecklistSection(false);
      setShowMoreOptions(false);
      setSyncToGoogle(false);
    }
    setNewSubtask('');
  }, [isOpen, initialNote, defaultDate]);

  if (!isOpen) return null;

  const { hour12, minute, period } = parse24To12(eventTime);

  const getDurationMinutes = (): number => {
    if (!endTime) return 0;
    const [sh, sm] = (eventTime || '09:00').split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    if (!Number.isFinite(sh) || !Number.isFinite(eh)) return 60;
    const startTotal = sh * 60 + (Number.isFinite(sm) ? sm : 0);
    const endTotal = eh * 60 + (Number.isFinite(em) ? em : 0);
    const diff = (endTotal - startTotal + 1440) % 1440;
    return diff > 0 ? diff : 60;
  };

  const applyStartTime = (next24: string) => {
    const dur = getDurationMinutes();
    setEventTime(next24);
    if (dur > 0) {
      setEndTime(addMinutesToTime24(next24, dur));
    }
  };

  const adjustTimeStep = (deltaMinutes: number) => {
    applyStartTime(addMinutesToTime24(eventTime, deltaMinutes));
  };

  const toggleAmPm = () => {
    const nextPeriod = period === 'AM' ? 'PM' : 'AM';
    applyStartTime(format12To24(hour12, minute, nextPeriod));
  };

  const handleToggleVoiceRecord = async () => {
    if (isRecording) {
      discardRecordingRef.current = false;
      mediaRecorderRef.current?.stop();
      if (recordTimerRef.current) {
        window.clearInterval(recordTimerRef.current);
        recordTimerRef.current = null;
      }
      setIsRecording(false);
      return;
    }

    if (attachments.length >= 8) {
      setFormError(
        lang === 'bn' ? 'সর্বোচ্চ ৮টি ফাইল যোগ করা যাবে।' : 'Maximum 8 attachments per note.'
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      chunksRef.current = [];
      discardRecordingRef.current = false;
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      const startedAt = Date.now();
      setRecordSeconds(0);
      recordTimerRef.current = window.setInterval(() => {
        setRecordSeconds(Math.floor((Date.now() - startedAt) / 1000));
      }, 500);

      recorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) chunksRef.current.push(ev.data);
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((tr) => tr.stop());
        if (discardRecordingRef.current) {
          chunksRef.current = [];
          return;
        }
        const elapsed = Math.max(1, Math.round((Date.now() - startedAt) / 1000));
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        });
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = String(reader.result || '');
          if (dataUrl.startsWith('data:')) {
            setAttachments((prev) => [
              ...prev,
              {
                id: `voice_${Date.now()}`,
                type: 'voice',
                name: `${t.voiceRecordedLabel} (${formatSeconds(elapsed)})`,
                mimeType: blob.type || 'audio/webm',
                dataUrl,
                sizeBytes: blob.size,
                durationSec: elapsed,
              },
            ]);
          }
        };
        reader.readAsDataURL(blob);
      };

      recorder.start();
      setIsRecording(true);
      setFormError('');
    } catch {
      setFormError(
        lang === 'bn'
          ? 'মাইক্রোফোন অ্যাক্সেস পাওয়া যায়নি। ব্রাউজার পারমিশন দিন।'
          : 'Microphone access unavailable. Please grant mic permission.'
      );
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (attachments.length >= 8) {
      setFormError(
        lang === 'bn' ? 'সর্বোচ্চ ৮টি ফাইল যোগ করা যাবে।' : 'Maximum 8 attachments per note.'
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 1200;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, w, h);
        const compressed = canvas.toDataURL('image/jpeg', 0.8);
        setAttachments((prev) => [
          ...prev,
          {
            id: `img_${Date.now()}`,
            type: 'image',
            name: file.name,
            mimeType: 'image/jpeg',
            dataUrl: compressed,
            sizeBytes: compressed.length,
          },
        ]);
      };
      img.onerror = () => {
        setFormError(
          lang === 'bn' ? 'ছবি লোড করা যায়নি।' : 'Could not read image file.'
        );
      };
      img.src = String(reader.result || '');
    };
    reader.readAsDataURL(file);
  };

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (attachments.length >= 8) {
      setFormError(
        lang === 'bn' ? 'সর্বোচ্চ ৮টি ফাইল যোগ করা যাবে।' : 'Maximum 8 attachments per note.'
      );
      return;
    }
    if (file.size > 2.5 * 1024 * 1024) {
      setFormError(
        lang === 'bn'
          ? 'পিডিএফ ফাইল ২.৫ এমবি-র কম হতে হবে।'
          : 'PDF file must be under 2.5 MB.'
      );
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      if (dataUrl.startsWith('data:')) {
        setAttachments((prev) => [
          ...prev,
          {
            id: `pdf_${Date.now()}`,
            type: 'pdf',
            name: file.name,
            mimeType: 'application/pdf',
            dataUrl,
            sizeBytes: file.size,
          },
        ]);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleAddSubtask = () => {
    const trimmed = newSubtask.trim();
    if (!trimmed || checklist.length >= 30) return;
    setChecklist((prev) => [
      ...prev,
      {
        id: `sub_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        text: trimmed.slice(0, 200),
        done: false,
      },
    ]);
    setNewSubtask('');
  };

  const handleToggleSubtask = (id: string) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item))
    );
  };

  const handleRemoveSubtask = (id: string) => {
    setChecklist((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isRecording) {
      setFormError(
        lang === 'bn'
          ? 'সেভ করার আগে ভয়েস রেকর্ডিং থামান।'
          : 'Please stop voice recording before saving.'
      );
      return;
    }
    if (!title.trim()) {
      setFormError(lang === 'bn' ? 'নোটের শিরোনাম লিখুন।' : 'Please enter a title.');
      return;
    }
    if (!eventDate) {
      setFormError(lang === 'bn' ? 'তারিখ নির্বাচন করুন।' : 'Please choose a date.');
      return;
    }

    setIsSaving(true);
    setFormError('');
    try {
      await onSave({
        id: initialNote?.id,
        title: title.trim(),
        description: description.trim(),
        eventDate,
        eventTime: isAllDay ? '' : eventTime,
        endTime: isAllDay ? '' : endTime,
        isAllDay,
        priority,
        colorTag,
        categoryLabel: categoryLabel.trim(),
        checklist,
        attachments,
        syncToGoogleCalendar: syncToGoogle,
        googleEventId: initialNote?.googleEventId,
        googleCalendarId: initialNote?.googleCalendarId,
        source: initialNote?.source,
      });
      onClose();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save note.');
    } finally {
      setIsSaving(false);
    }
  };

  const quickTimeSlots = [
    { label: lang === 'bn' ? 'সকাল ৯টা' : '9 AM', time: '09:00' },
    { label: lang === 'bn' ? 'দুপুর ১২টা' : '12 PM', time: '12:00' },
    { label: lang === 'bn' ? 'বিকাল ৩টা' : '3 PM', time: '15:00' },
    { label: lang === 'bn' ? 'সন্ধ্যা ৬টা' : '6 PM', time: '18:00' },
    { label: lang === 'bn' ? 'রাত ৯টা' : '9 PM', time: '21:00' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 dark:bg-slate-950/75 backdrop-blur-[5px] p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="note-editor-title"
    >
      <form
        onSubmit={handleSubmit}
        className="carved-panel max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Clean Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200/80 dark:border-slate-700/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <span
              className={`w-3 h-3 rounded-full ${COLOR_TAG_META[colorTag].dotClass}`}
              aria-hidden="true"
            />
            <h2
              id="note-editor-title"
              className="text-base font-bold text-slate-900 dark:text-slate-100"
            >
              {initialNote ? t.modalEditTitle : t.modalCreateTitle}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="carved-btn-surface p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body: Writing First, Clean Progressive Tools */}
        <div className="overflow-y-auto px-5 py-4 space-y-4 flex-1">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/70 text-xs sm:text-sm text-rose-700 dark:text-rose-300">
              {formError}
            </div>
          )}

          {/* 1. Essential Writing Area: Title + Note Body */}
          <div className="space-y-2.5">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              placeholder={t.fieldTitlePlaceholder}
              className="w-full px-4 py-3 text-base font-semibold bg-white/95 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-teal-500"
              autoFocus
            />

            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={4000}
              placeholder={t.fieldDescriptionPlaceholder}
              className="w-full px-4 py-2.5 text-sm bg-white/85 dark:bg-slate-900/65 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-teal-500 resize-y"
            />
          </div>

          {/* 2. Friendly Schedule Pill & Quick Date/Time Chips */}
          <div className="carved-well p-3.5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { label: t.dateToday, val: todayStr },
                  { label: t.dateTomorrow, val: tomorrowStr },
                  { label: t.dateNextWeek, val: nextWeekStr },
                ].map((chip) => {
                  const selected = eventDate === chip.val;
                  return (
                    <button
                      key={chip.val}
                      type="button"
                      onClick={() => setEventDate(chip.val)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                        selected
                          ? 'carved-btn-primary text-white'
                          : 'carved-btn-surface text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {chip.label}
                    </button>
                  );
                })}
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="px-2.5 py-1.5 text-xs font-mono-tabular bg-white/95 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500"
                />
              </div>

              <button
                type="button"
                onClick={() => setShowTimeAdjuster((v) => !v)}
                className="carved-btn-surface inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-sky-700 dark:text-sky-300 cursor-pointer"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>
                  {isAllDay
                    ? t.fieldAllDay
                    : formatTimeDisplay(eventTime, false, lang)}
                </span>
                {showTimeAdjuster ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            {/* Clean Expandable Modern Time Control */}
            {showTimeAdjuster && (
              <div className="pt-3 border-t border-slate-200/80 dark:border-slate-700/70 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    {formatReadableDate(eventDate, lang)}
                  </span>

                  <div className="carved-pill-track p-0.5 inline-flex gap-0.5">
                    <button
                      type="button"
                      onClick={() => setIsAllDay(false)}
                      className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                        !isAllDay
                          ? 'carved-pill-active text-teal-700 dark:text-teal-300'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {t.fieldStartTime}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAllDay(true)}
                      className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                        isAllDay
                          ? 'carved-pill-active text-indigo-700 dark:text-indigo-300'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {t.fieldAllDay}
                    </button>
                  </div>
                </div>

                {!isAllDay && (
                  <>
                    {/* Friendly Time-of-Day Preset Pills */}
                    <div className="flex flex-wrap gap-1.5">
                      {quickTimeSlots.map((slot) => {
                        const active = eventTime === slot.time;
                        return (
                          <button
                            key={slot.time}
                            type="button"
                            onClick={() => applyStartTime(slot.time)}
                            className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                              active
                                ? 'carved-pill-active text-sky-700 dark:text-sky-300 ring-1 ring-sky-500/40'
                                : 'carved-btn-surface text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            {slot.label}
                          </button>
                        );
                      })}
                    </div>

                    {/* Intuitive +/- Tactile Time Stepper + AM/PM Pill */}
                    <div className="carved-tile p-3 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => adjustTimeStep(-15)}
                          className="carved-btn-surface w-8 h-8 rounded-lg flex items-center justify-center text-slate-700 dark:text-slate-200 cursor-pointer"
                          aria-label="Minus 15 minutes"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-base font-bold font-mono-tabular text-slate-900 dark:text-slate-100 min-w-[82px] text-center">
                          {localizeDigits(String(hour12).padStart(2, '0'), lang)}:
                          {localizeDigits(String(minute).padStart(2, '0'), lang)}
                        </span>
                        <button
                          type="button"
                          onClick={() => adjustTimeStep(15)}
                          className="carved-btn-surface w-8 h-8 rounded-lg flex items-center justify-center text-slate-700 dark:text-slate-200 cursor-pointer"
                          aria-label="Plus 15 minutes"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={toggleAmPm}
                          className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-teal-500 to-sky-500 text-white text-xs font-bold cursor-pointer"
                        >
                          {period}
                        </button>
                      </div>

                      <div className="flex items-center gap-1">
                        {[
                          { label: t.durationNone, mins: 0 },
                          { label: '+30m', mins: 30 },
                          { label: '+1h', mins: 60 },
                          { label: '+2h', mins: 120 },
                        ].map((dur) => {
                          const targetEnd =
                            dur.mins === 0 ? '' : addMinutesToTime24(eventTime, dur.mins);
                          const selected = endTime === targetEnd;
                          return (
                            <button
                              key={dur.label}
                              type="button"
                              onClick={() => setEndTime(targetEnd)}
                              className={`px-2 py-1 text-[11px] font-semibold rounded-lg transition-all cursor-pointer ${
                                selected
                                  ? 'carved-pill-active text-teal-700 dark:text-teal-300'
                                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                              }`}
                            >
                              {dur.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* 3. Compact Priority + Color Dots Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-1">
            <div className="carved-pill-track inline-flex gap-0.5 p-1">
              {PRIORITY_OPTIONS.map((lvl) => {
                const meta = PRIORITY_META[lvl];
                const active = priority === lvl;
                return (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setPriority(lvl)}
                    className={`py-1 px-2.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                      active
                        ? 'carved-pill-active text-slate-900 dark:text-slate-100 font-semibold'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    {lang === 'bn' ? meta.labelBn : meta.labelEn}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              {COLOR_OPTIONS.map((tag) => {
                const meta = COLOR_TAG_META[tag];
                const selected = colorTag === tag;
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setColorTag(tag)}
                    title={lang === 'bn' ? meta.labelBn : meta.labelEn}
                    aria-label={lang === 'bn' ? meta.labelBn : meta.labelEn}
                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-transform cursor-pointer ${
                      meta.dotClass
                    } ${
                      selected
                        ? 'ring-2 ring-offset-2 ring-slate-700 dark:ring-white dark:ring-offset-slate-900 scale-110'
                        : 'opacity-70 hover:opacity-100'
                    }`}
                  >
                    {selected && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. One-Row Friendly Tool Bar: Voice, PDF, Image, Checklist, Tag */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleToggleVoiceRecord}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isRecording
                  ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-md'
                  : 'carved-btn-surface text-rose-600 dark:text-rose-400'
              }`}
            >
              {isRecording ? (
                <>
                  <StopIcon className="w-3.5 h-3.5 fill-current" />
                  <span className="font-mono-tabular">
                    {formatSeconds(recordSeconds)}
                  </span>
                </>
              ) : (
                <>
                  <Mic className="w-3.5 h-3.5" />
                  <span>{t.recordVoiceBtn}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => pdfInputRef.current?.click()}
              className="carved-btn-surface inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-amber-700 dark:text-amber-400 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{t.addPdfBtn}</span>
            </button>

            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              className="carved-btn-surface inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-sky-700 dark:text-sky-400 cursor-pointer"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>{t.addImageBtn}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowChecklistSection((v) => !v)}
              className={`carved-btn-surface inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer ${
                showChecklistSection
                  ? 'text-teal-700 dark:text-teal-300 ring-1 ring-teal-500/40'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>{t.subtasksLabel}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowMoreOptions((v) => !v)}
              className={`carved-btn-surface inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer ${
                showMoreOptions
                  ? 'text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-500/40'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              <Tag className="w-3.5 h-3.5" />
              <span>{t.fieldCategory}</span>
            </button>

            <input
              ref={pdfInputRef}
              type="file"
              accept="application/pdf"
              onChange={handlePdfUpload}
              className="hidden"
            />
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>

          {/* Attachments Preview (shown only when files are attached) */}
          {attachments.length > 0 && (
            <div className="carved-well p-3 space-y-2">
              {attachments.map((att) => (
                <div
                  key={att.id}
                  className="carved-tile p-2.5 flex items-center justify-between gap-2.5"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {att.type === 'image' && (
                      <img
                        src={att.dataUrl}
                        alt={att.name}
                        className="w-10 h-10 rounded-lg object-cover shrink-0"
                      />
                    )}
                    {att.type === 'pdf' && (
                      <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                    )}
                    {att.type === 'voice' && (
                      <div className="w-10 h-10 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                        <Mic className="w-5 h-5" />
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {att.name}
                      </p>
                      {att.type === 'voice' && (
                        <audio controls src={att.dataUrl} className="w-full h-7 mt-1" />
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveAttachment(att.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer shrink-0"
                    aria-label="Remove attachment"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Optional Checklist / Sub-tasks Section */}
          {showChecklistSection && (
            <div className="carved-well p-3.5 space-y-2.5">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSubtask();
                    }
                  }}
                  maxLength={200}
                  placeholder={t.addSubtaskPlaceholder}
                  className="flex-1 px-3 py-2 text-sm bg-white/95 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-teal-500"
                />
                <button
                  type="button"
                  onClick={handleAddSubtask}
                  className="carved-btn-surface inline-flex items-center gap-1 px-3.5 py-2 text-xs font-semibold text-teal-700 dark:text-teal-300 rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {t.addSubtaskBtn}
                </button>
              </div>

              {checklist.length > 0 && (
                <ul className="space-y-1.5 pt-1">
                  {checklist.map((item) => (
                    <li
                      key={item.id}
                      className="carved-tile flex items-center justify-between gap-2 px-3 py-1.5"
                    >
                      <button
                        type="button"
                        onClick={() => handleToggleSubtask(item.id)}
                        className="flex items-center gap-2 text-left text-sm text-slate-700 dark:text-slate-200 flex-1 min-w-0 cursor-pointer"
                      >
                        {item.done ? (
                          <CheckSquare className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
                        )}
                        <span
                          className={`truncate ${
                            item.done ? 'line-through text-slate-400 dark:text-slate-500' : ''
                          }`}
                        >
                          {item.text}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveSubtask(item.id)}
                        className="p-1 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                        aria-label="Remove sub-task"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Optional Category Tag Input */}
          {showMoreOptions && (
            <div className="carved-well p-3">
              <input
                type="text"
                value={categoryLabel}
                onChange={(e) => setCategoryLabel(e.target.value)}
                maxLength={40}
                placeholder={t.fieldCategoryPlaceholder}
                className="w-full px-3 py-2 text-sm bg-white/95 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-teal-500"
              />
            </div>
          )}
        </div>

        {/* Sticky Footer: Google Calendar Toggle + Cancel & Save */}
        <div className="px-5 py-3.5 border-t border-slate-200/80 dark:border-slate-700/70 flex flex-wrap items-center justify-between gap-3 shrink-0 bg-white/50 dark:bg-slate-900/50">
          <label
            className={`inline-flex items-center gap-2 text-xs font-semibold select-none ${
              hasGoogleToken
                ? 'text-slate-700 dark:text-slate-200 cursor-pointer'
                : 'text-slate-400 dark:text-slate-500 cursor-not-allowed'
            }`}
            title={hasGoogleToken ? t.syncToGoogleHint : t.calendarNeedsReconnect}
          >
            <input
              type="checkbox"
              checked={syncToGoogle}
              disabled={!hasGoogleToken}
              onChange={(e) => setSyncToGoogle(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-teal-600 focus:ring-teal-500 disabled:opacity-50"
            />
            <CalendarSync className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            <span>{t.syncToGoogleLabel}</span>
          </label>

          <div className="flex items-center gap-2.5 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="carved-btn-surface px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 rounded-xl whitespace-nowrap shrink-0 cursor-pointer"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="carved-btn-primary px-5 py-2 text-xs sm:text-sm font-semibold text-white rounded-xl whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
            >
              {isSaving ? '...' : t.saveChanges}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
