import { ColorTag, Language, PriorityLevel } from '../types/note';

const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

export function localizeDigits(value: string | number, lang: Language): string {
  const str = String(value);
  if (lang === 'en') return str;
  return str.replace(/\d/g, (d) => BN_DIGITS[Number(d)] ?? d);
}

export function getLocalYYYYMMDD(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDaysYYYYMMDD(baseDateStr: string, days: number): string {
  const [y, m, d] = baseDateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d + days);
  return getLocalYYYYMMDD(dt);
}

export function formatReadableDate(dateStr: string, lang: Language): string {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  const [y, m, d] = dateStr.split('-').map(Number);
  const dateObj = new Date(y, m - 1, d);
  const todayStr = getLocalYYYYMMDD();
  const tomorrowStr = addDaysYYYYMMDD(todayStr, 1);
  const yesterdayStr = addDaysYYYYMMDD(todayStr, -1);

  const formatted = dateObj.toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  if (dateStr === todayStr) {
    return lang === 'bn' ? `আজ · ${formatted}` : `Today · ${formatted}`;
  }
  if (dateStr === tomorrowStr) {
    return lang === 'bn' ? `আগামীকাল · ${formatted}` : `Tomorrow · ${formatted}`;
  }
  if (dateStr === yesterdayStr) {
    return lang === 'bn' ? `গতকাল · ${formatted}` : `Yesterday · ${formatted}`;
  }
  return formatted;
}

export function formatTimeDisplay(timeStr: string, isAllDay: boolean, lang: Language): string {
  if (isAllDay || !timeStr) {
    return lang === 'bn' ? 'সারাদিন' : 'All day';
  }
  const [hStr, mStr] = timeStr.split(':');
  const hour24 = Number(hStr);
  const minute = Number(mStr);
  if (Number.isNaN(hour24) || Number.isNaN(minute)) return timeStr;
  const period = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  const formatted = `${String(hour12).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${period}`;
  return localizeDigits(formatted, lang);
}

export function formatMonthYear(year: number, monthIndex: number, lang: Language): string {
  const date = new Date(year, monthIndex, 1);
  return date.toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', {
    month: 'long',
    year: 'numeric',
  });
}

export function getWeekdayLabels(lang: Language): string[] {
  if (lang === 'bn') {
    return ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র', 'শনি'];
  }
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
}

export const COLOR_TAG_META: Record<
  ColorTag,
  { labelEn: string; labelBn: string; dotClass: string; bgSoftClass: string; textClass: string }
> = {
  teal: {
    labelEn: 'Teal',
    labelBn: 'টিল',
    dotClass: 'bg-teal-500',
    bgSoftClass: 'bg-teal-50/70 dark:bg-teal-950/40',
    textClass: 'text-teal-700 dark:text-teal-300',
  },
  sky: {
    labelEn: 'Sky Blue',
    labelBn: 'আকাশি',
    dotClass: 'bg-sky-500',
    bgSoftClass: 'bg-sky-50/70 dark:bg-sky-950/40',
    textClass: 'text-sky-700 dark:text-sky-300',
  },
  amber: {
    labelEn: 'Amber',
    labelBn: 'সোনালি',
    dotClass: 'bg-amber-500',
    bgSoftClass: 'bg-amber-50/70 dark:bg-amber-950/40',
    textClass: 'text-amber-700 dark:text-amber-300',
  },
  rose: {
    labelEn: 'Rose',
    labelBn: 'রোজ',
    dotClass: 'bg-rose-500',
    bgSoftClass: 'bg-rose-50/70 dark:bg-rose-950/40',
    textClass: 'text-rose-700 dark:text-rose-300',
  },
  indigo: {
    labelEn: 'Indigo',
    labelBn: 'ইন্ডিগো',
    dotClass: 'bg-indigo-500',
    bgSoftClass: 'bg-indigo-50/70 dark:bg-indigo-950/40',
    textClass: 'text-indigo-700 dark:text-indigo-300',
  },
  slate: {
    labelEn: 'Slate',
    labelBn: 'স্লেট',
    dotClass: 'bg-slate-400',
    bgSoftClass: 'bg-slate-100/70 dark:bg-slate-800/50',
    textClass: 'text-slate-700 dark:text-slate-300',
  },
};

export const PRIORITY_META: Record<
  PriorityLevel,
  { labelEn: string; labelBn: string; textClass: string }
> = {
  high: { labelEn: 'High', labelBn: 'জরুরি', textClass: 'text-rose-600 dark:text-rose-400' },
  medium: { labelEn: 'Medium', labelBn: 'মাঝারি', textClass: 'text-amber-600 dark:text-amber-400' },
  low: { labelEn: 'Low', labelBn: 'সাধারণ', textClass: 'text-teal-600 dark:text-teal-400' },
};

export const UI_TEXT = {
  en: {
    appName: 'Easy Note',
    tagline: 'Colorful, encrypted notes synced with Google Calendar & Google Drive',
    signInPromptTitle: 'Your colorful, protected workspace for notes, calendar & Drive backup',
    signInPromptDesc:
      'Sign in with Google to sync Google Calendar events, back up encrypted notes to Google Drive, highlight Bangladesh holidays, and enjoy a liquid-glass mobile & desktop experience.',
    signInButton: 'Sign in with Google',
    signingIn: 'Signing in...',
    signOut: 'Sign out',
    tabHome: 'Home',
    tabAllNotes: 'All Notes',
    tabSettings: 'Settings',
    tabProfile: 'Profile',
    subTimeline: 'Timeline',
    subCalendar: 'Calendar',
    subTrash: 'Trash',
    newNote: 'New Note',
    syncCalendar: 'Sync Calendar',
    syncing: 'Syncing...',
    reconnectCalendar: 'Reconnect Google',
    calendarConnected: 'Google Connected',
    calendarNeedsReconnect: 'Google session token expired · Reconnect to sync Calendar & Drive',
    notificationsOn: 'Reminders On',
    notificationsOff: 'Enable Alerts',
    testNotification: 'Test Alert',
    languageLabel: 'Language',
    searchPlaceholder: 'Search notes, tags, or checklist...',
    filterAll: 'All',
    filterUpcoming: 'Upcoming',
    filterCompleted: 'Completed',
    filterGoogle: 'Calendar',
    priorityAll: 'All Priorities',
    tagAll: 'All Colors',
    tomorrowReminderTitle: '1-Day-Before Reminders',
    tomorrowReminderSub: 'Scheduled for tomorrow — stay ahead',
    noRemindersTomorrow: 'No events due tomorrow. Your schedule is clear.',
    todayAgenda: "Today's Action Plan",
    upcomingFiveTitle: 'Upcoming task',
    upcomingFiveEmpty: 'No upcoming tasks or events yet. Tap + New Note below!',
    weatherLoading: 'Loading...',
    weatherLocationTitle: 'Weather Location',
    weatherLocationDesc: 'Choose automatic GPS location or pick any city for Home weather.',
    weatherLocationAuto: 'Auto (GPS)',
    weatherCityPlaceholder: 'Search city (e.g. Dhaka, London)...',
    weatherCityApply: 'Set City',
    weatherCityNotFound: 'City not found. Try another name.',
    upcomingHolidays: 'Upcoming Bangladesh Holidays',
    holidayTodayBanner: 'Holiday Today',
    statActive: 'Active',
    statTomorrow: 'Tomorrow',
    statCompleted: 'Done',
    expiredLabel: 'Expired',
    autoTrashIn: 'Trash in',
    daysUnit: 'd',
    todayLastDay: 'Moves to Trash today',
    sourceGoogle: 'Google Calendar',
    sourceLocal: 'Easy Note',
    markComplete: 'Complete',
    markActive: 'Reopen',
    edit: 'Edit',
    moveToTrash: 'Move to Trash',
    restore: 'Restore',
    deleteForever: 'Delete Permanently',
    emptyTrash: 'Empty Trash',
    trashTitle: 'Trash Folder',
    trashSubtitle:
      'Notes deleted manually or expired for 7+ days are safely stored here. Confirm permanent deletion to erase them completely.',
    trashEmptyState: 'Your Trash Folder is empty.',
    trashEmptyDesc: 'Deleted notes and 7-day expired events will appear here before final removal.',
    movedToTrashOn: 'Moved to Trash',
    notesEmptyTitle: 'No notes match this view',
    notesEmptyDesc: 'Create a timed note or sync your Google Calendar events to get started.',
    todayEmptyTitle: 'Your schedule is clear today',
    todayEmptyDesc: 'Use Quick Add above or tap New Note to plan your day.',
    createFirstNote: 'Create First Note',
    modalCreateTitle: 'Create Note / Event',
    modalEditTitle: 'Edit Note / Event',
    fieldTitle: 'Title',
    fieldTitlePlaceholder: 'e.g., Client design review or Project deadline',
    fieldDate: 'Date',
    fieldStartTime: 'Start Time',
    fieldEndTime: 'End Time',
    fieldAllDay: 'All day event',
    fieldPriority: 'Priority',
    fieldColor: 'Color Tag',
    fieldCategory: 'Category',
    fieldCategoryPlaceholder: 'Work, Personal, Study...',
    fieldDescription: 'Notes & Details',
    fieldDescriptionPlaceholder: 'Write key details, links, or agenda points...',
    fieldChecklist: 'Checklist & Sub-tasks',
    addSubtaskPlaceholder: 'Add a sub-task...',
    addSubtaskBtn: 'Add',
    attachmentsTitle: 'Voice, PDF & Image Notes',
    recordVoiceBtn: 'Record Voice',
    stopVoiceBtn: 'Stop Recording',
    addPdfBtn: 'Attach PDF',
    addImageBtn: 'Attach Image',
    voiceRecordedLabel: 'Voice Note',
    durationLabel: 'Duration',
    previewImageTitle: 'Image Preview',
    previewPdfTitle: 'PDF Document',
    downloadFile: 'Download',
    dateToday: 'Today',
    dateTomorrow: 'Tomorrow',
    dateNextWeek: 'Next Week',
    durationNone: 'No end time',
    syncToGoogleLabel: 'Also save to Google Calendar',
    syncToGoogleHint: 'Creates or updates this event on your primary Google Calendar.',
    saveChanges: 'Save Note',
    cancel: 'Cancel',
    confirmDeleteTitle: 'Permanently Delete Note?',
    confirmDeleteMsg:
      'This will permanently erase the note from your Trash Folder and cannot be undone.',
    confirmAlsoDeleteGoogle: 'Also delete the linked event from Google Calendar',
    confirmEmptyTrashTitle: 'Empty Trash Folder?',
    confirmEmptyTrashMsg: 'All items in Trash will be permanently erased. This action cannot be undone.',
    confirmGoogleMutationTitle: 'Sync Change to Google Calendar?',
    confirmGoogleMutationMsg: 'This action will create or update an event in your Google Calendar.',
    confirmRestoreDriveTitle: 'Restore from Google Drive Backup?',
    confirmRestoreDriveMsg:
      'This will merge and restore your backed-up notes and profile from Google Drive.',
    confirmClearLocalTitle: 'Clear Phone / Browser Storage?',
    confirmClearLocalMsg:
      'This will permanently remove locally cached notes on this device. Google Drive backups are untouched.',
    confirmBtn: 'Confirm',
    confirmDeleteBtn: 'Delete Permanently',
    calendarDayEvents: 'Schedule for',
    addNoteOnDate: 'Add note on this date',
    noEventsOnDay: 'No notes or events scheduled for this date.',
    holidaysLabel: 'Holiday',
    subtasksLabel: 'Sub-tasks',
    loadingWorkspace: 'Unlocking your workspace...',
    lastSynced: 'Last synced',
    // Profile
    profileTitle: 'Your Profile',
    profileSubtitle: 'Personalize your name and photo shown in the top-left greeting bar.',
    profileNameLabel: 'Display Name',
    profileNamePlaceholder: 'Enter your name...',
    profileAvatarLabel: 'Profile Picture',
    uploadPhoto: 'Upload Photo',
    useGooglePhoto: 'Use Google Photo',
    chooseCuteAvatar: 'Or pick a 3D avatar (3 Girls · 3 Boys)',
    saveProfile: 'Save Profile',
    profileSaved: 'Profile updated!',
    // Settings
    settingsTitle: 'Settings',
    settingsSubtitle: 'Customize appearance, Glass Mode, Google Drive & Calendar sync, reminders, and advanced security.',
    appearanceGroup: 'Appearance & Feel',
    darkModeTitle: 'Dark Mode',
    darkModeDesc: 'Switch between luminous light and deep midnight slate themes.',
    liquidGlassTitle: 'Glass Mode',
    liquidGlassDesc: 'Frosted translucent glass surfaces with specular refraction.',
    languageDesc: 'Switch effortlessly between Bangla and English.',
    fontGroup: 'Font Style',
    fontStyleTitle: 'App Typography Style',
    fontStyleDesc: 'Switch between curated stylish fonts for both English and Bangla.',
    cloudGroup: 'Google Drive & Calendar Storage',
    driveBackupTitle: 'Google Drive App Storage',
    driveBackupDesc: 'Privately back up your notes, profile, and Trash in your Google Drive.',
    driveBackupNow: 'Back Up Now',
    driveRestoreNow: 'Restore Backup',
    driveAutoBackup: 'Auto-backup on changes',
    lastDriveBackup: 'Last Drive backup',
    neverBackedUp: 'Not backed up yet',
    calendarSyncDesc: 'Keep primary events and Bangladesh holidays synchronized.',
    remindersGroup: 'Reminders & Alerts',
    notificationsDesc: 'Receive browser alerts 1 day before scheduled events.',
    securityGroup: 'Advanced Security & Protection',
    encryptionTitle: 'AES-256-GCM Device Encryption',
    encryptionDesc: 'Encrypts all notes stored on your phone/browser storage using Web Crypto.',
    pinLockTitle: '4-Digit App Lock PIN',
    pinLockDesc: 'Require a private 4-digit PIN whenever opening Easy Note.',
    setPinPlaceholder: 'Enter 4-digit PIN',
    enablePinBtn: 'Enable PIN Lock',
    disablePinBtn: 'Disable PIN Lock',
    lockNowBtn: 'Lock App Now',
    unlockTitle: 'Easy Note is Protected',
    unlockSubtitle: 'Enter your 4-digit security PIN to unlock your encrypted notes.',
    unlockBtn: 'Unlock',
    wrongPin: 'Incorrect PIN. Please try again.',
    clearLocalBtn: 'Clear Local Device Cache',
    openCalendar: 'Open Calendar',
  },
  bn: {
    appName: 'Easy Note',
    tagline: 'গুগল ক্যালেন্ডার ও ড্রাইভ ব্যাকআপসহ রঙিন এবং সুরক্ষিত নোটবুক',
    signInPromptTitle: 'আপনার রঙিন ও সুরক্ষিত নোটবুক — ক্যালেন্ডার ও ড্রাইভ সিঙ্কসহ',
    signInPromptDesc:
      'গুগল অ্যাকাউন্ট দিয়ে সাইন-ইন করে ক্যালেন্ডার ইভেন্ট সিঙ্ক করুন, এনক্রিপ্টেড নোট গুগল ড্রাইভে ব্যাকআপ রাখুন এবং বাংলাদেশের হলিডে ও ১ দিন আগের রিমাইন্ডার পান।',
    signInButton: 'Sign in with Google',
    signingIn: 'সাইন-ইন হচ্ছে...',
    signOut: 'সাইন-আউট',
    tabHome: 'হোম',
    tabAllNotes: 'সব নোটস',
    tabSettings: 'সেটিংস',
    tabProfile: 'প্রোফাইল',
    subTimeline: 'টাইমলাইন',
    subCalendar: 'ক্যালেন্ডার',
    subTrash: 'ট্র্যাশ',
    newNote: 'নতুন নোট',
    syncCalendar: 'ক্যালেন্ডার সিঙ্ক',
    syncing: 'সিঙ্ক হচ্ছে...',
    reconnectCalendar: 'গুগল পুনরায় কানেক্ট',
    calendarConnected: 'গুগল কানেক্টেড',
    calendarNeedsReconnect: 'ক্যালেন্ডার ও ড্রাইভ সিঙ্ক করতে পুনরায় গুগল কানেক্ট করুন',
    notificationsOn: 'রিমাইন্ডার চালু',
    notificationsOff: 'অ্যালার্ট চালু করুন',
    testNotification: 'টেস্ট অ্যালার্ট',
    languageLabel: 'ভাষা',
    searchPlaceholder: 'নোট, ট্যাগ বা সাব-টাস্ক খুঁজুন...',
    filterAll: 'সব',
    filterUpcoming: 'আসন্ন',
    filterCompleted: 'সম্পন্ন',
    filterGoogle: 'ক্যালেন্ডার',
    priorityAll: 'সব প্রায়োরিটি',
    tagAll: 'সব কালার',
    tomorrowReminderTitle: '১ দিন আগের রিমাইন্ডার',
    tomorrowReminderSub: 'আগামীকালের নির্ধারিত ইভেন্ট — আগে থেকেই প্রস্তুত থাকুন',
    noRemindersTomorrow: 'আগামীকালের জন্য কোনো ইভেন্ট বাকি নেই।',
    todayAgenda: 'আজকের কর্মপরিকল্পনা',
    upcomingFiveTitle: 'আসন্ন কাজ',
    upcomingFiveEmpty: 'আসন্ন কোনো কাজ বা ইভেন্ট নেই। নিচের + নতুন নোট থেকে যোগ করুন!',
    weatherLoading: 'লোড হচ্ছে...',
    weatherLocationTitle: 'আবহাওয়ার লোকেশন',
    weatherLocationDesc: 'হোম ট্যাবের আবহাওয়ার জন্য অটো GPS অথবা পছন্দের শহর বেছে নিন।',
    weatherLocationAuto: 'অটো (GPS)',
    weatherCityPlaceholder: 'শহরের নাম লিখুন (যেমন: ঢাকা, লন্ডন)...',
    weatherCityApply: 'সেট করুন',
    weatherCityNotFound: 'শহর খুঁজে পাওয়া যায়নি। অন্য নাম চেষ্টা করুন।',
    upcomingHolidays: 'আসন্ন বাংলাদেশের হলিডে',
    holidayTodayBanner: 'আজকের হলিডে',
    statActive: 'সক্রিয়',
    statTomorrow: 'আগামীকাল',
    statCompleted: 'সম্পন্ন',
    expiredLabel: 'মেয়াদ শেষ',
    autoTrashIn: 'ট্র্যাশে যাবে',
    daysUnit: 'দিন পর',
    todayLastDay: 'আজই ট্র্যাশে যাবে',
    sourceGoogle: 'গুগল ক্যালেন্ডার',
    sourceLocal: 'Easy Note',
    markComplete: 'সম্পন্ন করুন',
    markActive: 'পুনরায় চালু',
    edit: 'এডিট',
    moveToTrash: 'ট্র্যাশে পাঠান',
    restore: 'পুনরুদ্ধার করুন',
    deleteForever: 'স্থায়ীভাবে মুছুন',
    emptyTrash: 'ট্র্যাশ খালি করুন',
    trashTitle: 'ট্র্যাশ ফোল্ডার',
    trashSubtitle:
      'ম্যানুয়ালি ডিলিট করা বা মেয়াদ শেষের ৭ দিন পর সরে যাওয়া নোটগুলো এখানে জমা থাকে। এখান থেকে কনফার্ম করলে ফাইলটি চিরতরে মুছে যাবে।',
    trashEmptyState: 'আপনার ট্র্যাশ ফোল্ডার খালি রয়েছে।',
    trashEmptyDesc: 'ডিলিট করা নোট বা ৭ দিন পেরিয়ে যাওয়া ইভেন্ট এখানে সংরক্ষিত থাকবে।',
    movedToTrashOn: 'ট্র্যাশে সরানো হয়েছে',
    notesEmptyTitle: 'এই ফিল্টারে কোনো নোট পাওয়া যায়নি',
    notesEmptyDesc: 'নতুন নোট তৈরি করুন অথবা গুগল ক্যালেন্ডার সিঙ্ক করুন।',
    todayEmptyTitle: 'আজকের দিনটি একদম ফাঁকা',
    todayEmptyDesc: 'উপরের কুইক অ্যাড বক্স ব্যবহার করুন অথবা নতুন নোট বাটনে ক্লিক করুন।',
    createFirstNote: 'প্রথম নোট তৈরি করুন',
    modalCreateTitle: 'নতুন নোট / ইভেন্ট তৈরি করুন',
    modalEditTitle: 'নোট / ইভেন্ট এডিট করুন',
    fieldTitle: 'শিরোনাম',
    fieldTitlePlaceholder: 'যেমন: প্রজেক্ট মিটিং বা পরীক্ষার প্রস্তুতি',
    fieldDate: 'তারিখ',
    fieldStartTime: 'শুরুর সময়',
    fieldEndTime: 'শেষ সময়',
    fieldAllDay: 'সারাদিনের ইভেন্ট',
    fieldPriority: 'প্রায়োরিটি',
    fieldColor: 'কালার ট্যাগ',
    fieldCategory: 'ক্যাটাগরি',
    fieldCategoryPlaceholder: 'কাজ, ব্যক্তিগত, পড়াশোনা...',
    fieldDescription: 'বিস্তারিত নোট',
    fieldDescriptionPlaceholder: 'প্রয়োজনীয় তথ্য, লিংক বা নোট লিখুন...',
    fieldChecklist: 'চেকলিস্ট ও সাব-টাস্ক',
    addSubtaskPlaceholder: 'নতুন সাব-টাস্ক লিখুন...',
    addSubtaskBtn: 'যোগ',
    attachmentsTitle: 'ভয়েস, পিডিএফ ও ছবি নোট',
    recordVoiceBtn: 'ভয়েস রেকর্ড',
    stopVoiceBtn: 'রেকর্ড থামান',
    addPdfBtn: 'পিডিএফ যোগ',
    addImageBtn: 'ছবি যোগ',
    voiceRecordedLabel: 'ভয়েস নোট',
    durationLabel: 'সময়',
    previewImageTitle: 'ছবির প্রিভিউ',
    previewPdfTitle: 'পিডিএফ ডকুমেন্ট',
    downloadFile: 'ডাউনলোড',
    dateToday: 'আজ',
    dateTomorrow: 'আগামীকাল',
    dateNextWeek: 'আগামী সপ্তাহ',
    durationNone: 'শেষ সময় নেই',
    syncToGoogleLabel: 'গুগল ক্যালেন্ডারেও সেভ করুন',
    syncToGoogleHint: 'আপনার প্রাইমারি গুগল ক্যালেন্ডারে ইভেন্ট তৈরি বা আপডেট করবে।',
    saveChanges: 'নোট সেভ করুন',
    cancel: 'বাতিল',
    confirmDeleteTitle: 'নোটটি কি স্থায়ীভাবে মুছে ফেলবেন?',
    confirmDeleteMsg:
      'কনফার্ম করলে নোটটি ট্র্যাশ ফোল্ডার থেকে চিরতরে ডিলিট হয়ে যাবে এবং আর ফিরে পাওয়া যাবে না।',
    confirmAlsoDeleteGoogle: 'গুগল ক্যালেন্ডার থেকেও সংশ্লিষ্ট ইভেন্টটি মুছে ফেলুন',
    confirmEmptyTrashTitle: 'পুরো ট্র্যাশ ফোল্ডার খালি করবেন?',
    confirmEmptyTrashMsg: 'ট্র্যাশে থাকা সব নোট স্থায়ীভাবে মুছে যাবে। এই কাজটি বাতিল করা যাবে না।',
    confirmGoogleMutationTitle: 'গুগল ক্যালেন্ডারে পরিবর্তন সিঙ্ক করবেন?',
    confirmGoogleMutationMsg: 'এটি আপনার গুগল ক্যালেন্ডারে ইভেন্ট তৈরি বা আপডেট করবে।',
    confirmRestoreDriveTitle: 'গুগল ড্রাইভ থেকে ব্যাকআপ রিস্টোর করবেন?',
    confirmRestoreDriveMsg:
      'এটি গুগল ড্রাইভে সংরক্ষিত আপনার নোট ও প্রোফাইল বর্তমান ডিভাইসের সাথে সিঙ্ক ও রিস্টোর করবে।',
    confirmClearLocalTitle: 'ফোন / ব্রাউজার স্টোরেজ পরিষ্কার করবেন?',
    confirmClearLocalMsg:
      'এটি এই ডিভাইসে সংরক্ষিত নোটগুলো মুছে ফেলবে। আপনার গুগল ড্রাইভ ব্যাকআপ নিরাপদ থাকবে।',
    confirmBtn: 'কনফার্ম করুন',
    confirmDeleteBtn: 'স্থায়ীভাবে মুছুন',
    calendarDayEvents: 'নির্বাচিত দিনের সূচি:',
    addNoteOnDate: 'এই তারিখে নোট যোগ করুন',
    noEventsOnDay: 'এই তারিখে কোনো নোট বা ইভেন্ট নেই।',
    holidaysLabel: 'হলিডে',
    subtasksLabel: 'সাব-টাস্ক',
    loadingWorkspace: 'আপনার নোটবুক লোড হচ্ছে...',
    lastSynced: 'সর্বশেষ সিঙ্ক',
    // Profile
    profileTitle: 'আপনার প্রোফাইল',
    profileSubtitle: 'উপরের বাম পাশে প্রদর্শিত আপনার নাম ও প্রোফাইল ছবি কাস্টমাইজ করুন।',
    profileNameLabel: 'আপনার নাম',
    profileNamePlaceholder: 'আপনার নাম লিখুন...',
    profileAvatarLabel: 'প্রোফাইল ছবি',
    uploadPhoto: 'ছবি আপলোড করুন',
    useGooglePhoto: 'গুগল ছবি ব্যবহার করুন',
    chooseCuteAvatar: 'অথবা 3D অবতার বেছে নিন (৩ মেয়ে · ৩ ছেলে)',
    saveProfile: 'প্রোফাইল সেভ করুন',
    profileSaved: 'প্রোফাইল আপডেট হয়েছে!',
    // Settings
    settingsTitle: 'সেটিংস',
    settingsSubtitle: 'ডার্ক মোড, গ্লাস মোড, ড্রাইভ ব্যাকআপ এবং সিকিউরিটি সেট করুন।',
    appearanceGroup: 'ডিজাইন ও অ্যাপিয়ারেন্স',
    darkModeTitle: 'ডার্ক মোড',
    darkModeDesc: 'উজ্জ্বল লাইট থিম অথবা চোখের আরামদায়ক ডার্ক মোড বেছে নিন।',
    liquidGlassTitle: 'গ্লাস মোড',
    liquidGlassDesc: 'স্বচ্ছ ফ্রস্টেড গ্লাস ও আলোক প্রতিফলন ইফেক্ট চালু বা বন্ধ করুন।',
    languageDesc: 'সহজেই বাংলা ও ইংরেজি ভাষায় পরিবর্তন করুন।',
    fontGroup: 'ফন্ট স্টাইল',
    fontStyleTitle: 'অ্যাপের ফন্ট ডিজাইন',
    fontStyleDesc: 'বাংলা ও ইংরেজি উভয়ের জন্য পছন্দের স্টাইলিশ ফন্ট বেছে নিন।',
    cloudGroup: 'গুগল ড্রাইভ ও ক্যালেন্ডার স্টোরেজ',
    driveBackupTitle: 'গুগল ড্রাইভ প্রাইভেট স্টোরেজ',
    driveBackupDesc: 'আপনার নোট, প্রোফাইল ও ট্র্যাশ নিরাপদে গুগল ড্রাইভে ব্যাকআপ রাখুন।',
    driveBackupNow: 'এখনই ব্যাকআপ নিন',
    driveRestoreNow: 'ব্যাকআপ রিস্টোর করুন',
    driveAutoBackup: 'পরিবর্তনের সাথে সাথে অটো ব্যাকআপ',
    lastDriveBackup: 'সর্বশেষ ড্রাইভ ব্যাকআপ',
    neverBackedUp: 'এখনো ব্যাকআপ নেওয়া হয়নি',
    calendarSyncDesc: 'প্রাইমারি ইভেন্ট ও বাংলাদেশের হলিডে সিঙ্ক রাখুন।',
    remindersGroup: 'রিমাইন্ডার ও নোটিফিকেশন',
    notificationsDesc: 'ইভেন্টের ১ দিন আগে ব্রাউজার নোটিফিকেশন পান।',
    securityGroup: 'অ্যাডভান্সড সিকিউরিটি ও সুরক্ষা',
    encryptionTitle: 'AES-256-GCM ডিভাইস এনক্রিপশন',
    encryptionDesc: 'ফোন/ব্রাউজার স্টোরেজে থাকা সব নোট Web Crypto দিয়ে এনক্রিপ্টেড থাকে।',
    pinLockTitle: '৪-ডিজিট অ্যাপ লক পিন',
    pinLockDesc: 'Easy Note খোলার সময় গোপন ৪-ডিজিটের পিন দিয়ে লক সুরক্ষিত রাখুন।',
    setPinPlaceholder: '৪ সংখ্যার পিন লিখুন',
    enablePinBtn: 'পিন লক চালু করুন',
    disablePinBtn: 'পিন লক বন্ধ করুন',
    lockNowBtn: 'এখনই লক করুন',
    unlockTitle: 'Easy Note সুরক্ষিত আছে',
    unlockSubtitle: 'আপনার এনক্রিপ্টেড নোটগুলো দেখতে ৪-ডিজিটের পিন দিন।',
    unlockBtn: 'আনলক করুন',
    wrongPin: 'ভুল পিন! আবার চেষ্টা করুন।',
    clearLocalBtn: 'লোকাল ডিভাইস ডেটা মুছুন',
    openCalendar: 'ক্যালেন্ডার দেখুন',
  },
} as const;
