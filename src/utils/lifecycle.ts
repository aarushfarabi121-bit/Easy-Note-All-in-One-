import { addDaysYYYYMMDD, getLocalYYYYMMDD } from '../i18n/translations';
import { NoteItem } from '../types/note';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export function getNoteStartDate(note: NoteItem): Date {
  const [y, m, d] = note.eventDate.split('-').map(Number);
  if (note.isAllDay || !note.eventTime) {
    return new Date(y, m - 1, d, 0, 0, 0, 0);
  }
  const [hh, mm] = note.eventTime.split(':').map(Number);
  return new Date(y, m - 1, d, hh || 0, mm || 0, 0, 0);
}

export function getNoteExpirationDate(note: NoteItem): Date {
  const [y, m, d] = note.eventDate.split('-').map(Number);
  if (note.isAllDay || (!note.eventTime && !note.endTime)) {
    return new Date(y, m - 1, d, 23, 59, 59, 999);
  }
  const effectiveTime = note.endTime || note.eventTime;
  const [rawH, rawM] = effectiveTime.split(':').map(Number);
  const hh = Number.isFinite(rawH) ? rawH : 23;
  const mm = Number.isFinite(rawM) ? rawM : 59;
  const crossesMidnight =
    Boolean(note.endTime && note.eventTime) && note.endTime < note.eventTime;
  return new Date(
    y,
    m - 1,
    crossesMidnight ? d + 1 : d,
    hh,
    mm,
    59,
    999
  );
}

export function isNoteExpired(note: NoteItem, now: Date = new Date()): boolean {
  if (note.status !== 'active') return false;
  return now.getTime() > getNoteExpirationDate(note).getTime();
}

export function getDaysUntilAutoTrash(note: NoteItem, now: Date = new Date()): number {
  const expMs = getNoteExpirationDate(note).getTime();
  const elapsedMs = now.getTime() - expMs;
  if (elapsedMs <= 0) return 7;
  const remainingMs = SEVEN_DAYS_MS - elapsedMs;
  if (remainingMs <= 0) return 0;
  return Math.ceil(remainingMs / ONE_DAY_MS);
}

export function shouldAutoMoveToTrash(note: NoteItem, now: Date = new Date()): boolean {
  if (note.status !== 'active') return false;
  const expMs = getNoteExpirationDate(note).getTime();
  return now.getTime() - expMs >= SEVEN_DAYS_MS;
}

export function isOneDayBeforeReminderDue(note: NoteItem, now: Date = new Date()): boolean {
  if (note.status !== 'active') return false;
  if (isNoteExpired(note, now)) return false;

  const todayStr = getLocalYYYYMMDD(now);
  const tomorrowStr = addDaysYYYYMMDD(todayStr, 1);

  if (note.eventDate === tomorrowStr) {
    return true;
  }

  const startMs = getNoteStartDate(note).getTime();
  const diffMs = startMs - now.getTime();
  return diffMs > 0 && diffMs <= TWENTY_FOUR_HOURS_MS && note.eventDate !== todayStr;
}

export function sortNotesChronologically(notes: NoteItem[]): NoteItem[] {
  return [...notes].sort((a, b) => {
    const dateCmp = a.eventDate.localeCompare(b.eventDate);
    if (dateCmp !== 0) return dateCmp;
    if (a.isAllDay && !b.isAllDay) return -1;
    if (!a.isAllDay && b.isAllDay) return 1;
    const timeCmp = (a.eventTime || '').localeCompare(b.eventTime || '');
    if (timeCmp !== 0) return timeCmp;
    return a.title.localeCompare(b.title);
  });
}
