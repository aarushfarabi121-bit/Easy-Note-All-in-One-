export type Language = 'bn' | 'en';

export type PriorityLevel = 'high' | 'medium' | 'low';

export type ColorTag = 'teal' | 'sky' | 'amber' | 'rose' | 'indigo' | 'slate';

export type NoteStatus = 'active' | 'completed' | 'trashed';

export type NoteSource = 'local' | 'google_calendar';

export type BottomTab = 'home' | 'notes' | 'settings' | 'profile';

export type NotesSubView = 'timeline' | 'calendar' | 'trash';

export type SmartFilter = 'all' | 'upcoming' | 'completed' | 'google_calendar';

export type FontStyleId = 'stylish' | 'editorial' | 'rounded' | 'sleek' | 'handwritten';

export type AttachmentType = 'voice' | 'pdf' | 'image';

export interface NoteAttachment {
  id: string;
  type: AttachmentType;
  name: string;
  mimeType: string;
  dataUrl: string;
  sizeBytes?: number;
  durationSec?: number;
}

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface NoteItem {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  eventDate: string; // YYYY-MM-DD
  eventTime: string; // HH:mm or ''
  endTime: string; // HH:mm or ''
  isAllDay: boolean;
  priority: PriorityLevel;
  colorTag: ColorTag;
  categoryLabel: string;
  checklist: ChecklistItem[];
  attachments: NoteAttachment[];
  source: NoteSource;
  googleEventId: string;
  googleCalendarId: string;
  status: NoteStatus;
  trashedAtMs: number;
  remindedOneDayBefore: boolean;
  createdAt?: unknown;
  updatedAt?: string;
}

export interface NoteDraft {
  id?: string;
  title: string;
  description: string;
  eventDate: string;
  eventTime: string;
  endTime: string;
  isAllDay: boolean;
  priority: PriorityLevel;
  colorTag: ColorTag;
  categoryLabel: string;
  checklist: ChecklistItem[];
  attachments?: NoteAttachment[];
  syncToGoogleCalendar?: boolean;
  googleEventId?: string;
  googleCalendarId?: string;
  source?: NoteSource;
}

export interface UserProfile {
  uid: string;
  customName: string;
  customAvatar: string; // Data URL or empty string to use Google photo
  language: Language;
  darkMode: boolean;
  liquidGlass: boolean;
  fontStyle: FontStyleId;
  notificationsEnabled: boolean;
  autoSyncCalendar: boolean;
  autoDriveBackup: boolean;
  encryptionEnabled: boolean;
  pinEnabled: boolean;
  pinHash: string;
  pinSalt: string;
  weatherCity?: string;
  weatherLat?: number;
  weatherLon?: number;
  lastSyncedAt?: string;
  lastDriveBackupAt?: string;
}

export interface HolidayItem {
  id: string;
  date: string; // YYYY-MM-DD
  nameEn: string;
  nameBn: string;
  emoji: string;
  type: 'national' | 'cultural' | 'religious' | 'google';
  accentColor: 'indigo' | 'teal' | 'amber' | 'rose';
}

export interface ConfirmDialogState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  variant: 'danger' | 'primary';
  secondaryCheckboxLabel?: string;
  secondaryChecked?: boolean;
  onConfirm: (secondaryChecked: boolean) => Promise<void> | void;
}
