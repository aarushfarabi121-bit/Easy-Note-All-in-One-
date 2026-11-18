import {
  ChecklistItem,
  FontStyleId,
  Language,
  NoteAttachment,
  NoteDraft,
  NoteItem,
  UserProfile,
} from '../types/note';
import { decryptPayload, encryptPayload } from '../utils/security';

const VALID_FONT_STYLES: FontStyleId[] = [
  'stylish',
  'editorial',
  'rounded',
  'sleek',
  'handwritten',
];

const notesStorageKey = (uid: string) => `easynote_v2_notes_${uid}`;
const prefsStorageKey = (uid: string) => `easynote_v2_prefs_${uid}`;

function sanitizeChecklist(items: ChecklistItem[]): ChecklistItem[] {
  return items
    .slice(0, 30)
    .map((item, idx) => ({
      id:
        (item.id || `sub_${idx}_${Date.now()}`)
          .replace(/[^a-zA-Z0-9_-]/g, '')
          .slice(0, 64) || `sub_${idx}`,
      text: String(item.text || '').trim().slice(0, 200),
      done: Boolean(item.done),
    }))
    .filter((i) => i.text.length > 0);
}

function sanitizeAttachments(items: NoteAttachment[]): NoteAttachment[] {
  return items
    .slice(0, 8)
    .filter(
      (att) =>
        att &&
        (att.type === 'voice' || att.type === 'pdf' || att.type === 'image') &&
        typeof att.dataUrl === 'string' &&
        att.dataUrl.startsWith('data:')
    )
    .map((att, idx) => ({
      id: String(att.id || `att_${idx}_${Date.now()}`).slice(0, 80),
      type: att.type,
      name: String(att.name || att.type).slice(0, 120),
      mimeType: String(att.mimeType || '').slice(0, 80),
      dataUrl: att.dataUrl,
      sizeBytes: typeof att.sizeBytes === 'number' ? att.sizeBytes : undefined,
      durationSec: typeof att.durationSec === 'number' ? att.durationSec : undefined,
    }));
}

export function getDefaultUserProfile(
  uid: string,
  defaultLanguage: Language = 'bn'
): UserProfile {
  return {
    uid,
    customName: '',
    customAvatar: '',
    language: defaultLanguage,
    darkMode: false,
    liquidGlass: true,
    fontStyle: 'stylish',
    notificationsEnabled: false,
    autoSyncCalendar: true,
    autoDriveBackup: true,
    encryptionEnabled: true,
    pinEnabled: false,
    pinHash: '',
    pinSalt: '',
    weatherCity: '',
    weatherLat: undefined,
    weatherLon: undefined,
  };
}

export function loadUserPreferences(
  uid: string,
  defaultLanguage: Language = 'bn'
): UserProfile {
  const base = getDefaultUserProfile(uid, defaultLanguage);
  try {
    const raw = window.localStorage.getItem(prefsStorageKey(uid));
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<UserProfile>;
      return {
        ...base,
        ...parsed,
        uid,
        language: parsed.language === 'en' ? 'en' : 'bn',
        darkMode: Boolean(parsed.darkMode),
        liquidGlass: parsed.liquidGlass !== false,
        fontStyle: VALID_FONT_STYLES.includes(parsed.fontStyle as FontStyleId)
          ? (parsed.fontStyle as FontStyleId)
          : 'stylish',
        notificationsEnabled: Boolean(parsed.notificationsEnabled),
        autoSyncCalendar: parsed.autoSyncCalendar !== false,
        autoDriveBackup: parsed.autoDriveBackup !== false,
        encryptionEnabled: parsed.encryptionEnabled !== false,
        pinEnabled: Boolean(parsed.pinEnabled),
        pinHash: typeof parsed.pinHash === 'string' ? parsed.pinHash : '',
        pinSalt: typeof parsed.pinSalt === 'string' ? parsed.pinSalt : '',
        customName: typeof parsed.customName === 'string' ? parsed.customName : '',
        customAvatar: typeof parsed.customAvatar === 'string' ? parsed.customAvatar : '',
        weatherCity: typeof parsed.weatherCity === 'string' ? parsed.weatherCity : '',
        weatherLat: typeof parsed.weatherLat === 'number' ? parsed.weatherLat : undefined,
        weatherLon: typeof parsed.weatherLon === 'number' ? parsed.weatherLon : undefined,
      };
    }
  } catch {
    // Ignore corrupted storage
  }
  saveUserPreferences(uid, base);
  return base;
}

export function saveUserPreferences(
  uid: string,
  updates: Partial<UserProfile>
): UserProfile {
  const current = (() => {
    try {
      const raw = window.localStorage.getItem(prefsStorageKey(uid));
      return raw ? (JSON.parse(raw) as Partial<UserProfile>) : {};
    } catch {
      return {};
    }
  })();

  const base = getDefaultUserProfile(uid, 'bn');
  const merged: UserProfile = {
    ...base,
    ...current,
    ...updates,
    uid,
  };

  try {
    window.localStorage.setItem(prefsStorageKey(uid), JSON.stringify(merged));
  } catch {
    // Ignore storage quota errors
  }
  return merged;
}

export async function loadUserNotesEncrypted(uid: string): Promise<NoteItem[]> {
  try {
    const raw = window.localStorage.getItem(notesStorageKey(uid));
    if (!raw) return [];
    const decrypted = await decryptPayload(uid, raw);
    const parsed = JSON.parse(decrypted);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((d) => ({
      id: String(d.id || `note_${Date.now()}`),
      ownerId: uid,
      title: String(d.title || ''),
      description: String(d.description || ''),
      eventDate: String(d.eventDate || ''),
      eventTime: String(d.eventTime || ''),
      endTime: String(d.endTime || ''),
      isAllDay: Boolean(d.isAllDay),
      priority: d.priority === 'high' || d.priority === 'low' ? d.priority : 'medium',
      colorTag: d.colorTag || 'teal',
      categoryLabel: String(d.categoryLabel || ''),
      checklist: Array.isArray(d.checklist) ? sanitizeChecklist(d.checklist) : [],
      attachments: Array.isArray(d.attachments) ? sanitizeAttachments(d.attachments) : [],
      source: d.source === 'google_calendar' ? 'google_calendar' : 'local',
      googleEventId: String(d.googleEventId || ''),
      googleCalendarId: String(d.googleCalendarId || ''),
      status:
        d.status === 'completed' || d.status === 'trashed' ? d.status : 'active',
      trashedAtMs: typeof d.trashedAtMs === 'number' ? d.trashedAtMs : 0,
      remindedOneDayBefore: Boolean(d.remindedOneDayBefore),
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    }));
  } catch {
    return [];
  }
}

export async function persistUserNotesEncrypted(
  uid: string,
  notes: NoteItem[],
  encrypt: boolean = true
): Promise<void> {
  try {
    const json = JSON.stringify(notes);
    const toStore = encrypt ? await encryptPayload(uid, json) : json;
    window.localStorage.setItem(notesStorageKey(uid), toStore);
  } catch {
    // Ignore storage quota errors
  }
}

export function clearLocalNotesStorage(uid: string): void {
  try {
    window.localStorage.removeItem(notesStorageKey(uid));
  } catch {
    // Ignore
  }
}

export function buildNewNoteItem(
  uid: string,
  draft: NoteDraft,
  customId?: string
): NoteItem {
  const cleanId =
    (customId || `note_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 120);
  const nowIso = new Date().toISOString();

  return {
    id: cleanId,
    ownerId: uid,
    title: draft.title.trim().slice(0, 200),
    description: (draft.description || '').trim().slice(0, 4000),
    eventDate: draft.eventDate,
    eventTime: draft.isAllDay ? '' : (draft.eventTime || '').slice(0, 5),
    endTime: draft.isAllDay ? '' : (draft.endTime || '').slice(0, 5),
    isAllDay: Boolean(draft.isAllDay),
    priority: draft.priority,
    colorTag: draft.colorTag,
    categoryLabel: (draft.categoryLabel || '').trim().slice(0, 40),
    checklist: sanitizeChecklist(draft.checklist || []),
    attachments: sanitizeAttachments(draft.attachments || []),
    source: draft.source || 'local',
    googleEventId: (draft.googleEventId || '').slice(0, 256),
    googleCalendarId: (draft.googleCalendarId || '').slice(0, 256),
    status: 'active',
    trashedAtMs: 0,
    remindedOneDayBefore: false,
    createdAt: nowIso,
    updatedAt: nowIso,
  };
}
