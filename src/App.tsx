import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { User } from 'firebase/auth';
import {
  CalendarDays,
  CalendarSync,
  CheckCircle2,
  Languages,
  ListTodo,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { BottomLiquidDock } from './components/BottomLiquidDock';
import { CalendarMonthView } from './components/CalendarMonthView';
import { ConfirmActionModal } from './components/ConfirmActionModal';
import { GoogleSignInButton } from './components/GoogleSignInButton';
import { NoteEditorModal } from './components/NoteEditorModal';
import { PinLockOverlay } from './components/PinLockOverlay';
import { ProfileView } from './components/ProfileView';
import { SettingsView } from './components/SettingsView';
import { TimelineNotesView } from './components/TimelineNotesView';
import { TodayDashboardView } from './components/TodayDashboardView';
import { TrashFolderView } from './components/TrashFolderView';
import { CURATED_BANGLADESH_HOLIDAYS, mergeHolidays } from './data/bangladeshHolidays';
import {
  getLocalYYYYMMDD,
  localizeDigits,
  UI_TEXT,
} from './i18n/translations';
import {
  clearAccessToken,
  googleSignIn,
  initAuth,
  logout,
} from './lib/firebase';
import {
  createGoogleCalendarEvent,
  deleteGoogleCalendarEvent,
  syncFromGoogleCalendar,
  updateGoogleCalendarEvent,
} from './services/googleCalendarService';
import {
  loadBackupFromGoogleDrive,
  saveBackupToGoogleDrive,
} from './services/googleDriveService';
import {
  buildNewNoteItem,
  clearLocalNotesStorage,
  getDefaultUserProfile,
  loadUserNotesEncrypted,
  loadUserPreferences,
  persistUserNotesEncrypted,
  saveUserPreferences,
} from './services/notesService';
import {
  BottomTab,
  ConfirmDialogState,
  HolidayItem,
  Language,
  NoteDraft,
  NoteItem,
  NotesSubView,
  UserProfile,
} from './types/note';
import { getDailyGreeting } from './utils/greetings';
import { resolveAvatarSrc } from './utils/avatars';
import {
  isOneDayBeforeReminderDue,
  shouldAutoMoveToTrash,
} from './utils/lifecycle';
import { generateSalt, hashPin, verifyPin } from './utils/security';

export default function App() {
  const [authReady, setAuthReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [profile, setProfile] = useState<UserProfile>(() =>
    getDefaultUserProfile('guest', 'bn')
  );
  const [isLocked, setIsLocked] = useState(false);

  const [activeTab, setActiveTab] = useState<BottomTab>('home');
  const [notesSubView, setNotesSubView] = useState<NotesSubView>('timeline');

  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [notesLoaded, setNotesLoaded] = useState(false);
  const [holidays, setHolidays] = useState<HolidayItem[]>(CURATED_BANGLADESH_HOLIDAYS);

  const [isSyncingCalendar, setIsSyncingCalendar] = useState(false);
  const [isBackingUpDrive, setIsBackingUpDrive] = useState(false);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<NoteItem | null>(null);
  const [editorDefaultDate, setEditorDefaultDate] = useState<string | undefined>(undefined);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);

  const [toastMessage, setToastMessage] = useState<{
    text: string;
    tone: 'success' | 'error' | 'info';
  } | null>(null);

  const [now, setNow] = useState<Date>(() => new Date());
  const remindedInSession = useRef<Set<string>>(new Set());
  const skipNextAutoBackupRef = useRef(false);

  const lang: Language = profile.language;
  const t = UI_TEXT[lang];

  const showToast = useCallback(
    (text: string, tone: 'success' | 'error' | 'info' = 'info') => {
      setToastMessage({ text, tone });
    },
    []
  );

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  // Apply Dark Mode, Glass Mode, and Font Style attributes on <html>
  useEffect(() => {
    document.documentElement.classList.toggle('dark', Boolean(profile.darkMode));
    document.documentElement.setAttribute(
      'data-liquid',
      profile.liquidGlass ? 'true' : 'false'
    );
    document.documentElement.setAttribute(
      'data-font',
      profile.fontStyle || 'stylish'
    );
  }, [profile.darkMode, profile.liquidGlass, profile.fontStyle]);

  // 1-minute clock tick for automatic expiration cross-mark and 7-day auto-trash
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  // Auth listener (Google Sign-In only)
  useEffect(() => {
    const unsub = initAuth((firebaseUser, token) => {
      setUser(firebaseUser);
      setAccessToken(token);
      setAuthReady(true);
      if (!firebaseUser) {
        setNotes([]);
        setNotesLoaded(false);
        setIsLocked(false);
        setHolidays(CURATED_BANGLADESH_HOLIDAYS);
        setProfile(getDefaultUserProfile('guest', 'bn'));
      }
    });
    return () => unsub();
  }, []);

  // Load user preferences & encrypted notes on sign-in
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const prefs = loadUserPreferences(user.uid, 'bn');
    setProfile(prefs);
    setIsLocked(Boolean(prefs.pinEnabled && prefs.pinHash));

    void loadUserNotesEncrypted(user.uid).then((loadedNotes) => {
      if (cancelled) return;
      skipNextAutoBackupRef.current = true;
      setNotes(loadedNotes);
      setNotesLoaded(true);
    });

    return () => {
      cancelled = true;
    };
  }, [user]);

  // Helper to update profile & persist preferences
  const handleUpdateProfile = useCallback(
    (updates: Partial<UserProfile>) => {
      if (user) {
        const merged = saveUserPreferences(user.uid, updates);
        if (
          updates.encryptionEnabled !== undefined &&
          updates.encryptionEnabled !== profile.encryptionEnabled
        ) {
          void persistUserNotesEncrypted(user.uid, notes, updates.encryptionEnabled);
        }
        setProfile(merged);
      } else {
        setProfile((prev) => ({ ...prev, ...updates }));
      }
    },
    [user, notes, profile.encryptionEnabled]
  );

  // Helper to update notes state and persist encrypted to device storage
  const updateNotesState = useCallback(
    (updater: (prev: NoteItem[]) => NoteItem[]) => {
      setNotes((prev) => {
        const next = updater(prev);
        if (user) {
          void persistUserNotesEncrypted(user.uid, next, profile.encryptionEnabled);
        }
        return next;
      });
    },
    [user, profile.encryptionEnabled]
  );

  // Google Calendar sync runner
  const runCalendarSync = useCallback(
    async (
      tokenToUse: string,
      currentUser: User,
      currentNotes: NoteItem[],
      encryptionEnabled: boolean,
      silent = false
    ): Promise<NoteItem[]> => {
      setIsSyncingCalendar(true);
      try {
        const { events, holidays: googleHolidays } =
          await syncFromGoogleCalendar(tokenToUse);
        setHolidays(mergeHolidays(googleHolidays));

        const nowDate = new Date();
        const nextList = [...currentNotes];
        const indexByGoogleId = new Map<string, number>();
        nextList.forEach((n, idx) => {
          if (n.googleEventId) indexByGoogleId.set(n.googleEventId, idx);
        });

        for (const ev of events) {
          const existingIdx = indexByGoogleId.get(ev.googleEventId);
          if (existingIdx !== undefined) {
            const existing = nextList[existingIdx];
            if (existing.status === 'trashed') continue;
            nextList[existingIdx] = {
              ...existing,
              title: ev.title,
              description: ev.description,
              eventDate: ev.eventDate,
              eventTime: ev.eventTime,
              endTime: ev.endTime,
              isAllDay: ev.isAllDay,
              updatedAt: new Date().toISOString(),
            };
          } else {
            const candidateDocId = `gcal_${ev.googleEventId}`
              .replace(/[^a-zA-Z0-9_-]/g, '_')
              .slice(0, 120);
            const newItem = buildNewNoteItem(
              currentUser.uid,
              {
                title: ev.title,
                description: ev.description,
                eventDate: ev.eventDate,
                eventTime: ev.eventTime,
                endTime: ev.endTime,
                isAllDay: ev.isAllDay,
                priority: 'medium',
                colorTag: 'sky',
                categoryLabel: 'Calendar',
                checklist: [],
                source: 'google_calendar',
                googleEventId: ev.googleEventId,
                googleCalendarId: ev.googleCalendarId,
              },
              candidateDocId
            );
            if (shouldAutoMoveToTrash(newItem, nowDate)) continue;
            nextList.push(newItem);
          }
        }

        setNotes(nextList);
        await persistUserNotesEncrypted(currentUser.uid, nextList, encryptionEnabled);

        const syncedIso = new Date().toISOString();
        const updatedPrefs = saveUserPreferences(currentUser.uid, {
          lastSyncedAt: syncedIso,
        });
        setProfile(updatedPrefs);

        if (!silent) {
          showToast(
            lang === 'bn'
              ? 'গুগল ক্যালেন্ডার সফলভাবে সিঙ্ক হয়েছে'
              : 'Google Calendar synced successfully',
            'success'
          );
        }
        return nextList;
      } catch (err) {
        if (err instanceof Error && err.message === 'GOOGLE_TOKEN_EXPIRED') {
          clearAccessToken();
          setAccessToken(null);
          showToast(t.calendarNeedsReconnect, 'info');
        } else if (!silent) {
          showToast(
            err instanceof Error ? err.message : 'Calendar sync failed',
            'error'
          );
        }
        return currentNotes;
      } finally {
        setIsSyncingCalendar(false);
      }
    },
    [lang, showToast, t.calendarNeedsReconnect]
  );

  // Initial session sync: merge Drive backup (if any) + sync Google Calendar
  const hasAutoSyncedRef = useRef(false);
  useEffect(() => {
    if (!user || !accessToken || !notesLoaded || hasAutoSyncedRef.current) {
      if (!accessToken) hasAutoSyncedRef.current = false;
      return;
    }
    hasAutoSyncedRef.current = true;

    const runInitialCloudSync = async () => {
      let workingNotes = notes;
      try {
        const driveData = await loadBackupFromGoogleDrive(accessToken);
        if (driveData && Array.isArray(driveData.notes) && driveData.notes.length > 0) {
          const mapById = new Map<string, NoteItem>();
          for (const dNote of driveData.notes) {
            mapById.set(dNote.id, { ...dNote, ownerId: user.uid });
          }
          for (const lNote of workingNotes) {
            const existing = mapById.get(lNote.id);
            if (!existing) {
              mapById.set(lNote.id, lNote);
            } else {
              const localTs = Date.parse(lNote.updatedAt || '') || 0;
              const driveTs = Date.parse(existing.updatedAt || '') || 0;
              if (localTs >= driveTs) {
                mapById.set(lNote.id, lNote);
              }
            }
          }
          workingNotes = Array.from(mapById.values());
          setNotes(workingNotes);
          await persistUserNotesEncrypted(
            user.uid,
            workingNotes,
            profile.encryptionEnabled
          );

          if (driveData.profile) {
            const patch: Partial<UserProfile> = {};
            if (!profile.customName && driveData.profile.customName) {
              patch.customName = driveData.profile.customName;
            }
            if (!profile.customAvatar && driveData.profile.customAvatar) {
              patch.customAvatar = driveData.profile.customAvatar;
            }
            if (driveData.profile.fontStyle && profile.fontStyle === 'stylish') {
              patch.fontStyle = driveData.profile.fontStyle;
            }
            if (Object.keys(patch).length > 0) {
              setProfile(saveUserPreferences(user.uid, patch));
            }
          }
        }
      } catch (err) {
        if (err instanceof Error && err.message === 'GOOGLE_TOKEN_EXPIRED') {
          clearAccessToken();
          setAccessToken(null);
          return;
        }
      }

      await runCalendarSync(
        accessToken,
        user,
        workingNotes,
        profile.encryptionEnabled,
        true
      );
    };

    void runInitialCloudSync();
  }, [
    user,
    accessToken,
    notesLoaded,
    notes,
    profile.encryptionEnabled,
    profile.customName,
    profile.customAvatar,
    runCalendarSync,
  ]);

  // Debounced auto-backup to Google Drive appDataFolder on changes
  useEffect(() => {
    if (!user || !accessToken || !notesLoaded || !profile.autoDriveBackup || isLocked) {
      return;
    }
    if (skipNextAutoBackupRef.current) {
      skipNextAutoBackupRef.current = false;
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const backedUpAt = await saveBackupToGoogleDrive(accessToken, notes, profile);
        const updated = saveUserPreferences(user.uid, {
          lastDriveBackupAt: backedUpAt,
        });
        setProfile(updated);
      } catch (err) {
        if (err instanceof Error && err.message === 'GOOGLE_TOKEN_EXPIRED') {
          clearAccessToken();
          setAccessToken(null);
        }
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [
    user,
    accessToken,
    notesLoaded,
    notes,
    profile.autoDriveBackup,
    profile.customName,
    profile.customAvatar,
    profile.language,
    profile.darkMode,
    profile.liquidGlass,
    profile.fontStyle,
    profile.notificationsEnabled,
    isLocked,
  ]);

  // 7-Day Auto-Trash Sweeper
  useEffect(() => {
    if (!user || !notesLoaded) return;
    const dueIds = new Set(
      notes.filter((n) => shouldAutoMoveToTrash(n, now)).map((n) => n.id)
    );
    if (dueIds.size === 0) return;

    const nowMs = Date.now();
    updateNotesState((prev) =>
      prev.map((n) =>
        dueIds.has(n.id)
          ? {
              ...n,
              status: 'trashed',
              trashedAtMs: nowMs,
              updatedAt: new Date(nowMs).toISOString(),
            }
          : n
      )
    );
  }, [user, notes, notesLoaded, now, updateNotesState]);

  // 1-Day-Before Browser Notification Dispatcher
  useEffect(() => {
    if (!user || !notesLoaded || !profile.notificationsEnabled || isLocked) return;
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    const dueTomorrow = notes.filter(
      (n) =>
        isOneDayBeforeReminderDue(n, now) &&
        !n.remindedOneDayBefore &&
        !remindedInSession.current.has(n.id)
    );
    if (dueTomorrow.length === 0) return;

    const remindedIds = new Set<string>();
    for (const item of dueTomorrow) {
      remindedInSession.current.add(item.id);
      remindedIds.add(item.id);
      try {
        new Notification(
          lang === 'bn' ? `আগামীকাল: ${item.title}` : `Tomorrow: ${item.title}`,
          {
            body:
              lang === 'bn'
                ? `Easy Note রিমাইন্ডার · ${item.eventDate} ${item.eventTime || 'সারাদিন'}`
                : `Easy Note 1-day reminder · ${item.eventDate} ${item.eventTime || 'All day'}`,
          }
        );
      } catch {
        // Ignore restricted notification environments
      }
    }

    if (remindedIds.size > 0) {
      updateNotesState((prev) =>
        prev.map((n) =>
          remindedIds.has(n.id) ? { ...n, remindedOneDayBefore: true } : n
        )
      );
    }
  }, [
    user,
    notes,
    notesLoaded,
    profile.notificationsEnabled,
    isLocked,
    now,
    lang,
    updateNotesState,
  ]);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const res = await googleSignIn();
      setUser(res.user);
      setAccessToken(res.accessToken);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Google Sign-In failed',
        'error'
      );
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setAccessToken(null);
    setNotes([]);
    setIsLocked(false);
    setActiveTab('home');
  };

  const handleToggleLanguage = () => {
    const nextLang: Language = lang === 'bn' ? 'en' : 'bn';
    handleUpdateProfile({ language: nextLang });
  };

  const handleToggleNotifications = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      showToast(
        lang === 'bn'
          ? 'এই ব্রাউজারে নোটিফিকেশন সাপোর্ট নেই'
          : 'Browser notifications are not supported here.',
        'error'
      );
      return;
    }

    if (!profile.notificationsEnabled) {
      let perm = Notification.permission;
      if (perm === 'default') {
        perm = await Notification.requestPermission();
      }
      if (perm !== 'granted') {
        showToast(
          lang === 'bn'
            ? 'অনুগ্রহ করে ব্রাউজারের নোটিফিকেশন পারমিশন দিন'
            : 'Please allow browser notification permission.',
          'error'
        );
        return;
      }
      handleUpdateProfile({ notificationsEnabled: true });
      new Notification('Easy Note', {
        body:
          lang === 'bn'
            ? '১ দিন আগের রিমাইন্ডার নোটিফিকেশন চালু হয়েছে!'
            : '1-day-before reminders are now enabled!',
      });
    } else {
      handleUpdateProfile({ notificationsEnabled: false });
    }
  };

  const handleTestNotification = () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission === 'granted') {
      new Notification('Easy Note', {
        body:
          lang === 'bn'
            ? 'টেস্ট রিমাইন্ডার সফলভাবে কাজ করছে! 🔔'
            : 'Test 1-day-before reminder alert is working! 🔔',
      });
    }
    showToast(
      lang === 'bn' ? 'টেস্ট অ্যালার্ট পাঠানো হয়েছে' : 'Test alert sent',
      'success'
    );
  };

  const handleBackupToDrive = async () => {
    if (!user || !accessToken) {
      showToast(t.calendarNeedsReconnect, 'info');
      return;
    }
    setIsBackingUpDrive(true);
    try {
      const backedUpAt = await saveBackupToGoogleDrive(accessToken, notes, profile);
      handleUpdateProfile({ lastDriveBackupAt: backedUpAt });
      showToast(
        lang === 'bn'
          ? 'গুগল ড্রাইভে সফলভাবে ব্যাকআপ নেওয়া হয়েছে'
          : 'Backed up to Google Drive successfully',
        'success'
      );
    } catch (err) {
      if (err instanceof Error && err.message === 'GOOGLE_TOKEN_EXPIRED') {
        clearAccessToken();
        setAccessToken(null);
        showToast(t.calendarNeedsReconnect, 'error');
      } else {
        showToast(
          err instanceof Error ? err.message : 'Google Drive backup failed',
          'error'
        );
      }
    } finally {
      setIsBackingUpDrive(false);
    }
  };

  const handleRestoreFromDrive = () => {
    if (!user || !accessToken) {
      showToast(t.calendarNeedsReconnect, 'info');
      return;
    }
    setConfirmDialog({
      isOpen: true,
      title: t.confirmRestoreDriveTitle,
      message: t.confirmRestoreDriveMsg,
      confirmLabel: t.confirmBtn,
      cancelLabel: t.cancel,
      variant: 'primary',
      onConfirm: async () => {
        setIsBackingUpDrive(true);
        try {
          const backup = await loadBackupFromGoogleDrive(accessToken);
          if (!backup) {
            showToast(
              lang === 'bn'
                ? 'গুগল ড্রাইভে কোনো ব্যাকআপ পাওয়া যায়নি'
                : 'No backup file found in Google Drive',
              'info'
            );
            return;
          }

          if (Array.isArray(backup.notes)) {
            const restoredNotes = backup.notes.map((n) => ({
              ...n,
              ownerId: user.uid,
            }));
            setNotes(restoredNotes);
            await persistUserNotesEncrypted(
              user.uid,
              restoredNotes,
              profile.encryptionEnabled
            );
          }

          if (backup.profile) {
            handleUpdateProfile({
              customName: backup.profile.customName || profile.customName,
              customAvatar: backup.profile.customAvatar || profile.customAvatar,
              language: backup.profile.language || profile.language,
              darkMode: Boolean(backup.profile.darkMode),
              liquidGlass: backup.profile.liquidGlass !== false,
              fontStyle: backup.profile.fontStyle || profile.fontStyle,
              notificationsEnabled: Boolean(backup.profile.notificationsEnabled),
              autoDriveBackup: backup.profile.autoDriveBackup !== false,
              lastDriveBackupAt: backup.updatedAt,
            });
          }

          showToast(
            lang === 'bn'
              ? 'গুগল ড্রাইভ থেকে সফলভাবে রিস্টোর করা হয়েছে'
              : 'Restored from Google Drive successfully',
            'success'
          );
        } catch (err) {
          if (err instanceof Error && err.message === 'GOOGLE_TOKEN_EXPIRED') {
            clearAccessToken();
            setAccessToken(null);
            showToast(t.calendarNeedsReconnect, 'error');
          } else {
            showToast(
              err instanceof Error ? err.message : 'Restore from Drive failed',
              'error'
            );
          }
        } finally {
          setIsBackingUpDrive(false);
        }
      },
    });
  };

  const handleSetPin = async (pin: string) => {
    const salt = generateSalt();
    const hashed = await hashPin(pin, salt);
    handleUpdateProfile({
      pinEnabled: true,
      pinHash: hashed,
      pinSalt: salt,
    });
    showToast(
      lang === 'bn' ? '৪-ডিজিট পিন লক চালু করা হয়েছে' : '4-digit PIN lock enabled',
      'success'
    );
  };

  const handleDisablePin = () => {
    handleUpdateProfile({
      pinEnabled: false,
      pinHash: '',
      pinSalt: '',
    });
    setIsLocked(false);
    showToast(
      lang === 'bn' ? 'পিন লক বন্ধ করা হয়েছে' : 'PIN lock disabled',
      'info'
    );
  };

  const handleUnlockWithPin = async (pin: string): Promise<boolean> => {
    const ok = await verifyPin(pin, profile.pinSalt, profile.pinHash);
    if (ok) {
      setIsLocked(false);
    }
    return ok;
  };

  const handleClearLocalData = () => {
    if (!user) return;
    setConfirmDialog({
      isOpen: true,
      title: t.confirmClearLocalTitle,
      message: t.confirmClearLocalMsg,
      confirmLabel: t.confirmDeleteBtn,
      cancelLabel: t.cancel,
      variant: 'danger',
      onConfirm: async () => {
        clearLocalNotesStorage(user.uid);
        skipNextAutoBackupRef.current = true;
        setNotes([]);
        showToast(
          lang === 'bn'
            ? 'এই ডিভাইসের লোকাল নোট মুছে ফেলা হয়েছে'
            : 'Local device storage cleared',
          'info'
        );
      },
    });
  };

  const handleSaveNote = async (draft: NoteDraft) => {
    if (!user) return;

    const persistLocal = (googleIds?: {
      googleEventId: string;
      googleCalendarId: string;
    }) => {
      if (draft.id) {
        updateNotesState((prev) =>
          prev.map((n) =>
            n.id === draft.id
              ? {
                  ...n,
                  title: draft.title.trim().slice(0, 200),
                  description: draft.description.trim().slice(0, 4000),
                  eventDate: draft.eventDate,
                  eventTime: draft.isAllDay ? '' : draft.eventTime.slice(0, 5),
                  endTime: draft.isAllDay ? '' : draft.endTime.slice(0, 5),
                  isAllDay: Boolean(draft.isAllDay),
                  priority: draft.priority,
                  colorTag: draft.colorTag,
                  categoryLabel: draft.categoryLabel.trim().slice(0, 40),
                  checklist: draft.checklist,
                  attachments: draft.attachments || [],
                  ...(googleIds
                    ? {
                        source: 'google_calendar' as const,
                        googleEventId: googleIds.googleEventId,
                        googleCalendarId: googleIds.googleCalendarId,
                      }
                    : {}),
                  updatedAt: new Date().toISOString(),
                }
              : n
          )
        );
      } else {
        const newNote = buildNewNoteItem(user.uid, {
          ...draft,
          source: googleIds ? 'google_calendar' : 'local',
          googleEventId: googleIds?.googleEventId || '',
          googleCalendarId: googleIds?.googleCalendarId || '',
        });
        updateNotesState((prev) => [...prev, newNote]);
      }
      showToast(
        lang === 'bn' ? 'নোট সংরক্ষণ করা হয়েছে' : 'Note saved',
        'success'
      );
    };

    if (draft.syncToGoogleCalendar && accessToken) {
      setConfirmDialog({
        isOpen: true,
        title: t.confirmGoogleMutationTitle,
        message: `${t.confirmGoogleMutationMsg} ("${draft.title}")`,
        confirmLabel: t.confirmBtn,
        cancelLabel: t.cancel,
        variant: 'primary',
        onConfirm: async () => {
          try {
            if (draft.googleEventId) {
              await updateGoogleCalendarEvent(
                accessToken,
                draft.googleCalendarId || 'primary',
                draft.googleEventId,
                draft
              );
              persistLocal({
                googleEventId: draft.googleEventId,
                googleCalendarId: draft.googleCalendarId || 'primary',
              });
            } else {
              const created = await createGoogleCalendarEvent(accessToken, draft);
              persistLocal(created);
            }
          } catch (err) {
            if (err instanceof Error && err.message === 'GOOGLE_TOKEN_EXPIRED') {
              clearAccessToken();
              setAccessToken(null);
              showToast(t.calendarNeedsReconnect, 'error');
            } else {
              showToast(
                err instanceof Error ? err.message : 'Google Calendar update failed',
                'error'
              );
            }
          }
        },
      });
      return;
    }

    persistLocal();
  };

  const handleToggleComplete = (note: NoteItem) => {
    const nextStatus = note.status === 'completed' ? 'active' : 'completed';
    updateNotesState((prev) =>
      prev.map((n) =>
        n.id === note.id
          ? { ...n, status: nextStatus, updatedAt: new Date().toISOString() }
          : n
      )
    );
  };

  const handleToggleChecklistItem = (note: NoteItem, itemId: string) => {
    const updatedChecklist = note.checklist.map((c) =>
      c.id === itemId ? { ...c, done: !c.done } : c
    );
    updateNotesState((prev) =>
      prev.map((n) =>
        n.id === note.id
          ? {
              ...n,
              checklist: updatedChecklist,
              updatedAt: new Date().toISOString(),
            }
          : n
      )
    );
  };

  const handleMoveToTrash = (note: NoteItem) => {
    const nowMs = Date.now();
    updateNotesState((prev) =>
      prev.map((n) =>
        n.id === note.id
          ? {
              ...n,
              status: 'trashed',
              trashedAtMs: nowMs,
              updatedAt: new Date(nowMs).toISOString(),
            }
          : n
      )
    );
    showToast(
      lang === 'bn' ? 'নোটটি ট্র্যাশ ফোল্ডারে পাঠানো হয়েছে' : 'Moved to Trash Folder',
      'info'
    );
  };

  const handleRestoreFromTrash = (note: NoteItem) => {
    updateNotesState((prev) =>
      prev.map((n) =>
        n.id === note.id
          ? {
              ...n,
              status: 'active',
              trashedAtMs: 0,
              updatedAt: new Date().toISOString(),
            }
          : n
      )
    );
    showToast(
      lang === 'bn' ? 'নোটটি নোটবুকে পুনরুদ্ধার করা হয়েছে' : 'Note restored to notebook',
      'success'
    );
  };

  const handlePermanentDelete = (note: NoteItem) => {
    const hasLinkedGoogle = Boolean(note.googleEventId && accessToken);
    setConfirmDialog({
      isOpen: true,
      title: t.confirmDeleteTitle,
      message: `${t.confirmDeleteMsg} ("${note.title}")`,
      confirmLabel: t.confirmDeleteBtn,
      cancelLabel: t.cancel,
      variant: 'danger',
      secondaryCheckboxLabel: hasLinkedGoogle ? t.confirmAlsoDeleteGoogle : undefined,
      secondaryChecked: false,
      onConfirm: async (alsoDeleteGoogle) => {
        if (alsoDeleteGoogle && accessToken && note.googleEventId) {
          try {
            await deleteGoogleCalendarEvent(
              accessToken,
              note.googleCalendarId || 'primary',
              note.googleEventId
            );
          } catch (err) {
            if (err instanceof Error && err.message === 'GOOGLE_TOKEN_EXPIRED') {
              clearAccessToken();
              setAccessToken(null);
            }
          }
        }
        updateNotesState((prev) => prev.filter((n) => n.id !== note.id));
        showToast(
          lang === 'bn' ? 'নোটটি স্থায়ীভাবে মুছে ফেলা হয়েছে' : 'Note permanently deleted',
          'success'
        );
      },
    });
  };

  const trashedNotes = useMemo(
    () => notes.filter((n) => n.status === 'trashed'),
    [notes]
  );

  const handleEmptyTrash = () => {
    if (trashedNotes.length === 0) return;
    setConfirmDialog({
      isOpen: true,
      title: t.confirmEmptyTrashTitle,
      message: `${t.confirmEmptyTrashMsg} (${localizeDigits(trashedNotes.length, lang)})`,
      confirmLabel: t.confirmDeleteBtn,
      cancelLabel: t.cancel,
      variant: 'danger',
      onConfirm: async () => {
        updateNotesState((prev) => prev.filter((n) => n.status !== 'trashed'));
        showToast(
          lang === 'bn' ? 'ট্র্যাশ ফোল্ডার খালি করা হয়েছে' : 'Trash folder emptied',
          'success'
        );
      },
    });
  };

  const openNewNoteModal = (defaultDate?: string) => {
    setEditingNote(null);
    setEditorDefaultDate(defaultDate || getLocalYYYYMMDD(now));
    setEditorOpen(true);
  };

  const openEditNoteModal = (note: NoteItem) => {
    setEditingNote(note);
    setEditorDefaultDate(undefined);
    setEditorOpen(true);
  };

  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="carved-panel p-8 text-center space-y-3">
          <div className="w-9 h-9 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-600 dark:text-slate-300">{t.loadingWorkspace}</p>
        </div>
      </div>
    );
  }

  // Unauthenticated Welcome Gate
  if (!user) {
    const welcomeGreeting = getDailyGreeting(now, lang);
    return (
      <div className="min-h-screen flex flex-col">
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 px-6 h-16 flex items-center justify-between gap-8">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-400 via-sky-500 to-indigo-500 text-white text-sm font-bold flex items-center justify-center shadow-sm">
              E
            </span>
            <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 font-display whitespace-nowrap shrink-0">
              Easy Note
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleToggleLanguage}
              className="carved-btn-surface inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Languages className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>{lang === 'bn' ? 'বাংলা / EN' : 'EN / বাংলা'}</span>
            </button>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-6">
          <div className="carved-panel max-w-3xl w-full p-8 sm:p-10 space-y-8">
            <div className="space-y-3">
              <p className="text-xs font-semibold text-teal-700 dark:text-teal-300 flex items-center gap-2">
                <span>{welcomeGreeting.emoji}</span>
                <span>{welcomeGreeting.text}</span>
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 leading-tight text-balance">
                {t.signInPromptTitle}
              </h1>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
                {t.signInPromptDesc}
              </p>
            </div>

            <div className="carved-well p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="carved-tile p-4 space-y-1">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {lang === 'bn'
                    ? '১. গুগল ক্যালেন্ডার ও ড্রাইভ ব্যাকআপ'
                    : '1. Calendar Sync & Drive Backup'}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {lang === 'bn'
                    ? 'ইভেন্ট ও বাংলাদেশের ছুটি সিঙ্ক রাখুন এবং গুগল ড্রাইভে প্রাইভেট ব্যাকআপ সংরক্ষণ করুন।'
                    : 'Sync events & Bangladesh holidays while privately backing up notes to Google Drive.'}
                </p>
              </div>
              <div className="carved-tile p-4 space-y-1">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {lang === 'bn'
                    ? '২. AES-256 এনক্রিপশন ও পিন লক'
                    : '2. AES-256 Encryption & PIN Lock'}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {lang === 'bn'
                    ? 'ডিভাইসে থাকা সব নোট Web Crypto এনক্রিপশনে সুরক্ষিত ও ৪-ডিজিট পিন দিয়ে লক করা যায়।'
                    : 'Protect phone storage with AES-256-GCM encryption and an optional 4-digit PIN lock.'}
                </p>
              </div>
              <div className="carved-tile p-4 space-y-1">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {lang === 'bn'
                    ? '৩. গ্লাস মোড ও ডার্ক মোড'
                    : '3. Glass Mode & Dark Mode'}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {lang === 'bn'
                    ? 'স্বচ্ছ গ্লাস মোড, রঙিন কার্ড ও ডার্ক/লাইট মোড ইচ্ছামতো অন-অফ করুন।'
                    : 'Toggle translucent Glass Mode surfaces and Deep Midnight Dark Mode.'}
                </p>
              </div>
              <div className="carved-tile p-4 space-y-1">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {lang === 'bn'
                    ? '৪. ১ দিন আগে অ্যালার্ট ও ৭ দিন পর ট্র্যাশ'
                    : '4. 1-Day Alerts & 7-Day Safe Trash'}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {lang === 'bn'
                    ? 'ইভেন্টের ১ দিন আগে রিমাইন্ডার, মেয়াদ শেষে ক্রসমার্ক এবং ৭ দিন পর রিস্টোরযোগ্য ট্র্যাশ।'
                    : 'Get 1-day-before alerts, auto-crossed past events, and safe recoverable Trash.'}
                </p>
              </div>
            </div>

            <div className="pt-1 flex flex-wrap items-center gap-4">
              <GoogleSignInButton
                onClick={handleLogin}
                disabled={isLoggingIn}
                label={isLoggingIn ? t.signingIn : t.signInButton}
              />
            </div>
          </div>
        </main>
      </div>
    );
  }

  const displayName =
    profile.customName.trim() || user.displayName || user.email || 'Easy Note';
  const avatarSrc = resolveAvatarSrc(profile.customAvatar, user.photoURL || '');

  return (
    <div className="min-h-screen flex flex-col">
      {/* Upper-Left Profile & Top-Right Floating 3D Brand Header */}
      <header className="sticky top-0 z-30 bg-white/75 dark:bg-slate-900/75 backdrop-blur-xl border-b border-slate-200/75 dark:border-slate-800/80 px-3.5 sm:px-8 py-2.5 flex items-center justify-between gap-2.5 sm:gap-4">
        {/* Upper-Left: Profile Picture and Name (flex-1 so name stays clearly visible) */}
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1 text-left group cursor-pointer"
          title={t.tabProfile}
        >
          {avatarSrc ? (
            <img
              src={avatarSrc}
              alt={displayName}
              referrerPolicy="no-referrer"
              className="w-9 h-9 sm:w-11 sm:h-11 rounded-full object-cover border-2 border-white dark:border-slate-700 shadow-sm shrink-0 group-hover:scale-105 transition-transform"
            />
          ) : (
            <span className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-gradient-to-br from-teal-400 via-sky-500 to-indigo-500 text-white text-sm font-bold flex items-center justify-center border-2 border-white dark:border-slate-700 shadow-sm shrink-0 group-hover:scale-105 transition-transform">
              {displayName.charAt(0).toUpperCase()}
            </span>
          )}

          <div className="min-w-0 flex-1">
            <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 truncate font-display leading-tight">
              {displayName}
            </p>
          </div>
        </button>

        {/* Right: Compact Sync Action + Floating 3D App Name in Top-Right Corner */}
        <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
          {accessToken ? (
            <button
              type="button"
              onClick={() =>
                runCalendarSync(accessToken, user, notes, profile.encryptionEnabled)
              }
              disabled={isSyncingCalendar}
              title={t.syncCalendar}
              aria-label={t.syncCalendar}
              className="carved-btn-surface inline-flex items-center gap-1.5 p-2 md:px-3 md:py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 text-teal-600 dark:text-teal-400 ${
                  isSyncingCalendar ? 'animate-spin' : ''
                }`}
              />
              <span className="hidden md:inline">
                {isSyncingCalendar ? t.syncing : t.syncCalendar}
              </span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 hidden md:inline" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleLogin}
              disabled={isLoggingIn}
              title={t.reconnectCalendar}
              aria-label={t.reconnectCalendar}
              className="carved-btn-surface inline-flex items-center gap-1.5 p-2 md:px-3 md:py-2 rounded-xl border-sky-200 dark:border-sky-800/70 text-xs font-semibold text-sky-700 dark:text-sky-300 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <CalendarSync className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{t.reconnectCalendar}</span>
            </button>
          )}

          {/* Top-Right App Name */}
          <button
            type="button"
            onClick={() => setActiveTab('home')}
            className="brand-title-wrap inline-flex items-center cursor-pointer shrink-0 select-none px-2.5 sm:px-3.5 py-1.5"
            title="Easy Note"
          >
            <span className="brand-title-text text-[22px] sm:text-[27px] italic font-extrabold leading-none whitespace-nowrap pr-1.5">
              Easy Note
            </span>
          </button>
        </div>
      </header>

      {/* Main Content Workspace (pb-28 clears Bottom Liquid Dock) */}
      <main className="flex-1 max-w-[1360px] w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-28 space-y-6">
        {activeTab === 'home' && (
          <TodayDashboardView
            lang={lang}
            now={now}
            notes={notes}
            holidays={holidays}
            weatherCity={profile.weatherCity}
            weatherLat={profile.weatherLat}
            weatherLon={profile.weatherLon}
            onOpenNewModal={openNewNoteModal}
            onOpenCalendar={() => {
              setActiveTab('notes');
              setNotesSubView('calendar');
            }}
            onToggleComplete={handleToggleComplete}
            onToggleChecklistItem={handleToggleChecklistItem}
            onEdit={openEditNoteModal}
            onMoveToTrash={handleMoveToTrash}
          />
        )}

        {activeTab === 'notes' && (
          <div className="space-y-5">
            {/* Segmented Sub-tabs for Timeline, Calendar, Trash */}
            <div className="carved-panel p-2 flex items-center justify-center sm:justify-start">
              <div className="carved-pill-track p-1 grid grid-cols-3 sm:inline-flex gap-1 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setNotesSubView('timeline')}
                  className={`inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    notesSubView === 'timeline'
                      ? 'carved-pill-active text-teal-700 dark:text-teal-300'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <ListTodo className="w-3.5 h-3.5" />
                  <span>{t.subTimeline}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setNotesSubView('calendar')}
                  className={`inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    notesSubView === 'calendar'
                      ? 'carved-pill-active text-indigo-700 dark:text-indigo-300'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <CalendarDays className="w-3.5 h-3.5" />
                  <span>{t.subCalendar}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setNotesSubView('trash')}
                  className={`inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    notesSubView === 'trash'
                      ? 'carved-pill-active text-rose-700 dark:text-rose-300'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{t.subTrash}</span>
                  {trashedNotes.length > 0 && (
                    <span className="font-mono-tabular text-[11px] opacity-80">
                      ({localizeDigits(trashedNotes.length, lang)})
                    </span>
                  )}
                </button>
              </div>
            </div>

            {notesSubView === 'timeline' && (
              <TimelineNotesView
                lang={lang}
                now={now}
                notes={notes}
                holidays={holidays}
                onOpenNewModal={() => openNewNoteModal()}
                onToggleComplete={handleToggleComplete}
                onToggleChecklistItem={handleToggleChecklistItem}
                onEdit={openEditNoteModal}
                onMoveToTrash={handleMoveToTrash}
              />
            )}

            {notesSubView === 'calendar' && (
              <CalendarMonthView
                lang={lang}
                now={now}
                notes={notes}
                holidays={holidays}
                onOpenNewModal={openNewNoteModal}
                onToggleComplete={handleToggleComplete}
                onToggleChecklistItem={handleToggleChecklistItem}
                onEdit={openEditNoteModal}
                onMoveToTrash={handleMoveToTrash}
              />
            )}

            {notesSubView === 'trash' && (
              <TrashFolderView
                lang={lang}
                trashedNotes={trashedNotes}
                onRestore={handleRestoreFromTrash}
                onPermanentDelete={handlePermanentDelete}
                onEmptyTrash={handleEmptyTrash}
              />
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <SettingsView
            lang={lang}
            profile={profile}
            hasGoogleToken={Boolean(accessToken)}
            isSyncingCalendar={isSyncingCalendar}
            isBackingUpDrive={isBackingUpDrive}
            onUpdatePreferences={handleUpdateProfile}
            onSyncCalendar={() => {
              if (accessToken) {
                void runCalendarSync(
                  accessToken,
                  user,
                  notes,
                  profile.encryptionEnabled
                );
              }
            }}
            onReconnectGoogle={handleLogin}
            onBackupToDrive={handleBackupToDrive}
            onRestoreFromDrive={handleRestoreFromDrive}
            onToggleNotifications={handleToggleNotifications}
            onTestNotification={handleTestNotification}
            onSetPin={handleSetPin}
            onDisablePin={handleDisablePin}
            onLockNow={() => setIsLocked(true)}
            onClearLocalData={handleClearLocalData}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileView
            lang={lang}
            now={now}
            profile={profile}
            googleDisplayName={user.displayName || ''}
            googleEmail={user.email || ''}
            googlePhotoUrl={user.photoURL || ''}
            onUpdateProfile={handleUpdateProfile}
            onLogout={handleLogout}
          />
        )}
      </main>

      {/* Bottom Floating Liquid Dock */}
      <BottomLiquidDock
        activeTab={activeTab}
        lang={lang}
        onSelectTab={setActiveTab}
        onNewNote={() => openNewNoteModal()}
        trashCount={trashedNotes.length}
      />

      {/* Modals & Security Overlay */}
      <NoteEditorModal
        isOpen={editorOpen}
        lang={lang}
        initialNote={editingNote}
        defaultDate={editorDefaultDate}
        hasGoogleToken={Boolean(accessToken)}
        onClose={() => setEditorOpen(false)}
        onSave={handleSaveNote}
      />

      <ConfirmActionModal
        dialog={confirmDialog}
        onClose={() => setConfirmDialog(null)}
      />

      {isLocked && (
        <PinLockOverlay lang={lang} onUnlock={handleUnlockWithPin} />
      )}

      {toastMessage && (
        <div
          role="status"
          className={`fixed bottom-24 right-5 z-50 px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-medium shadow-lg backdrop-blur-md ${
            toastMessage.tone === 'error'
              ? 'bg-rose-50/95 dark:bg-rose-950/90 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
              : toastMessage.tone === 'success'
                ? 'bg-teal-50/95 dark:bg-teal-950/90 border-teal-200 dark:border-teal-800 text-teal-900 dark:text-teal-200'
                : 'bg-white/95 dark:bg-slate-900/90 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100'
          }`}
        >
          {toastMessage.text}
        </div>
      )}
    </div>
  );
}
