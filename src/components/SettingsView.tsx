import React, { useState } from 'react';
import {
  Bell,
  CalendarSync,
  Check,
  CloudUpload,
  Download,
  HardDrive,
  Languages,
  Lock,
  MapPin,
  Moon,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Sun,
  Trash2,
  Type,
} from 'lucide-react';
import { UI_TEXT } from '../i18n/translations';
import { PRESET_WEATHER_CITIES, searchWeatherCity } from '../services/weatherService';
import { FontStyleId, Language, UserProfile } from '../types/note';

interface FontOption {
  id: FontStyleId;
  nameEn: string;
  nameBn: string;
  taglineEn: string;
  taglineBn: string;
  sampleClass: string;
  badgeGradient: string;
}

const FONT_STYLE_OPTIONS: FontOption[] = [
  {
    id: 'stylish',
    nameEn: 'Chic Modern',
    nameBn: 'আধুনিক স্টাইলিশ',
    taglineEn: 'Outfit · Hind Siliguri',
    taglineBn: 'আউটফিট · হিন্দ শিলিগুড়ি',
    sampleClass: 'font-sample-stylish',
    badgeGradient: 'from-teal-500 to-sky-500',
  },
  {
    id: 'editorial',
    nameEn: 'Luxury Serif',
    nameBn: 'এডিটোরিয়াল ক্লাসিক',
    taglineEn: 'Playfair Display · Noto Serif',
    taglineBn: 'প্লেফেয়ার · নোটো সেরিফ',
    sampleClass: 'font-sample-editorial',
    badgeGradient: 'from-rose-500 to-amber-500',
  },
  {
    id: 'rounded',
    nameEn: 'Soft Rounded',
    nameBn: 'সফট রাউন্ডেড',
    taglineEn: 'Fredoka · Baloo Da 2',
    taglineBn: 'ফ্রেডোকা · বালু দা ২',
    sampleClass: 'font-sample-rounded',
    badgeGradient: 'from-violet-500 to-fuchsia-500',
  },
  {
    id: 'sleek',
    nameEn: 'Tech Minimal',
    nameBn: 'স্লিক মিনিমাল',
    taglineEn: 'Space Grotesk · Noto Sans',
    taglineBn: 'স্পেস গ্রোটেস্ক · নোটো স্যান্স',
    sampleClass: 'font-sample-sleek',
    badgeGradient: 'from-indigo-500 to-cyan-500',
  },
  {
    id: 'handwritten',
    nameEn: 'Handwritten Art',
    nameBn: 'হ্যান্ডরাইটিং আর্ট',
    taglineEn: 'Kalam · Atma',
    taglineBn: 'কালাম · আত্মা',
    sampleClass: 'font-sample-handwritten',
    badgeGradient: 'from-amber-500 to-orange-500',
  },
];

interface SettingsViewProps {
  lang: Language;
  profile: UserProfile;
  hasGoogleToken: boolean;
  isSyncingCalendar: boolean;
  isBackingUpDrive: boolean;
  onUpdatePreferences: (updates: Partial<UserProfile>) => void;
  onSyncCalendar: () => void;
  onReconnectGoogle: () => void;
  onBackupToDrive: () => void;
  onRestoreFromDrive: () => void;
  onToggleNotifications: () => void;
  onTestNotification: () => void;
  onSetPin: (pin: string) => Promise<void>;
  onDisablePin: () => void;
  onLockNow: () => void;
  onClearLocalData: () => void;
}

const SwitchToggle: React.FC<{
  checked: boolean;
  onChange: () => void;
  label: string;
}> = ({ checked, onChange, label }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    onClick={onChange}
    className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors duration-200 cursor-pointer ${
      checked
        ? 'bg-gradient-to-r from-teal-500 to-sky-500 border-teal-600'
        : 'bg-slate-300 dark:bg-slate-700 border-slate-300 dark:border-slate-600'
    }`}
  >
    <span
      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-200 ${
        checked ? 'translate-x-6' : 'translate-x-1'
      }`}
    />
  </button>
);

export const SettingsView: React.FC<SettingsViewProps> = ({
  lang,
  profile,
  hasGoogleToken,
  isSyncingCalendar,
  isBackingUpDrive,
  onUpdatePreferences,
  onSyncCalendar,
  onReconnectGoogle,
  onBackupToDrive,
  onRestoreFromDrive,
  onToggleNotifications,
  onTestNotification,
  onSetPin,
  onDisablePin,
  onLockNow,
  onClearLocalData,
}) => {
  const t = UI_TEXT[lang];
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [cityQuery, setCityQuery] = useState('');
  const [citySearching, setCitySearching] = useState(false);
  const [cityError, setCityError] = useState('');

  const handleCitySearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cityQuery.trim() || citySearching) return;
    setCitySearching(true);
    setCityError('');
    try {
      const found = await searchWeatherCity(cityQuery);
      if (!found) {
        setCityError(t.weatherCityNotFound);
      } else {
        onUpdatePreferences({
          weatherCity: found.name,
          weatherLat: found.lat,
          weatherLon: found.lon,
        });
        setCityQuery('');
      }
    } catch {
      setCityError(t.weatherCityNotFound);
    } finally {
      setCitySearching(false);
    }
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{4}$/.test(pinInput)) {
      setPinError(
        lang === 'bn' ? 'ঠিক ৪ সংখ্যার পিন দিন (০-৯)' : 'Enter exactly 4 digits (0-9).'
      );
      return;
    }
    setPinError('');
    await onSetPin(pinInput);
    setPinInput('');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <section className="carved-panel p-6 space-y-1">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          {t.settingsTitle}
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
          {t.settingsSubtitle}
        </p>
      </section>

      {/* Appearance & Visual Effects */}
      <section className="carved-panel p-6 space-y-4">
        <h3 className="text-xs font-bold text-teal-700 dark:text-teal-400">
          {t.appearanceGroup}
        </h3>

        <div className="carved-well p-3 space-y-2.5">
          {/* Dark Mode */}
          <div className="carved-tile p-4 flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center shrink-0">
                {profile.darkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {t.darkModeTitle}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {t.darkModeDesc}
                </p>
              </div>
            </div>
            <SwitchToggle
              checked={profile.darkMode}
              onChange={() => onUpdatePreferences({ darkMode: !profile.darkMode })}
              label={t.darkModeTitle}
            />
          </div>

          {/* Liquid Glass Effect */}
          <div className="carved-tile p-4 flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 text-white flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {t.liquidGlassTitle}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {t.liquidGlassDesc}
                </p>
              </div>
            </div>
            <SwitchToggle
              checked={profile.liquidGlass}
              onChange={() => onUpdatePreferences({ liquidGlass: !profile.liquidGlass })}
              label={t.liquidGlassTitle}
            />
          </div>

          {/* Language Switcher */}
          <div className="carved-tile p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-600 text-white flex items-center justify-center shrink-0">
                <Languages className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {t.languageLabel}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {t.languageDesc}
                </p>
              </div>
            </div>

            <div className="carved-pill-track p-1 flex items-center gap-1">
              <button
                type="button"
                onClick={() => onUpdatePreferences({ language: 'bn' })}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  lang === 'bn'
                    ? 'carved-pill-active text-teal-700 dark:text-teal-300'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                বাংলা
              </button>
              <button
                type="button"
                onClick={() => onUpdatePreferences({ language: 'en' })}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  lang === 'en'
                    ? 'carved-pill-active text-teal-700 dark:text-teal-300'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                English
              </button>
            </div>
          </div>

          {/* Weather Location */}
          <div className="carved-tile p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 text-white flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {t.weatherLocationTitle}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {t.weatherLocationDesc}
                  </p>
                </div>
              </div>
              <span className="text-xs font-semibold text-orange-600 dark:text-orange-400 whitespace-nowrap">
                {profile.weatherCity || t.weatherLocationAuto}
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() =>
                  onUpdatePreferences({
                    weatherCity: '',
                    weatherLat: undefined,
                    weatherLon: undefined,
                  })
                }
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  !profile.weatherCity
                    ? 'carved-btn-primary text-white'
                    : 'carved-btn-surface text-slate-600 dark:text-slate-300'
                }`}
              >
                {t.weatherLocationAuto}
              </button>

              {PRESET_WEATHER_CITIES.map((city) => {
                const selected = profile.weatherCity === city.nameEn;
                return (
                  <button
                    key={city.nameEn}
                    type="button"
                    onClick={() =>
                      onUpdatePreferences({
                        weatherCity: city.nameEn,
                        weatherLat: city.lat,
                        weatherLon: city.lon,
                      })
                    }
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      selected
                        ? 'carved-btn-primary text-white'
                        : 'carved-btn-surface text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {lang === 'bn' ? city.nameBn : city.nameEn}
                  </button>
                );
              })}
            </div>

            <form onSubmit={handleCitySearch} className="flex items-center gap-2">
              <input
                type="text"
                value={cityQuery}
                onChange={(e) => setCityQuery(e.target.value)}
                placeholder={t.weatherCityPlaceholder}
                className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-teal-500"
              />
              <button
                type="submit"
                disabled={citySearching || !cityQuery.trim()}
                className="carved-btn-surface px-3 py-1.5 text-xs font-semibold text-teal-700 dark:text-teal-300 rounded-lg cursor-pointer disabled:opacity-50"
              >
                {citySearching ? '...' : t.weatherCityApply}
              </button>
            </form>
            {cityError && (
              <p className="text-xs text-rose-600 dark:text-rose-400">{cityError}</p>
            )}
          </div>
        </div>
      </section>

      {/* Font Style Section */}
      <section className="carved-panel p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-fuchsia-500 to-indigo-600 text-white flex items-center justify-center shrink-0">
              <Type className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-fuchsia-700 dark:text-fuchsia-300">
                {t.fontGroup}
              </h3>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                {t.fontStyleTitle}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {t.fontStyleDesc}
              </p>
            </div>
          </div>
        </div>

        <div className="carved-well p-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {FONT_STYLE_OPTIONS.map((font) => {
            const active = (profile.fontStyle || 'stylish') === font.id;
            return (
              <button
                key={font.id}
                type="button"
                onClick={() => onUpdatePreferences({ fontStyle: font.id })}
                className={`carved-tile p-3.5 text-left flex items-center justify-between gap-3 cursor-pointer transition-all ${
                  font.sampleClass
                } ${
                  active
                    ? 'border-teal-500 dark:border-teal-400 ring-2 ring-teal-400/35 bg-gradient-to-br from-teal-50/80 to-sky-50/70 dark:from-teal-950/50 dark:to-sky-950/40'
                    : ''
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`w-10 h-10 rounded-xl bg-gradient-to-br ${font.badgeGradient} text-white text-sm font-bold flex items-center justify-center shrink-0 shadow-sm`}
                  >
                    {lang === 'bn' ? 'অআ' : 'Aa'}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                      {lang === 'bn' ? font.nameBn : font.nameEn}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {lang === 'bn'
                        ? `সহজ নোট · ${font.taglineBn}`
                        : `Easy Note · ${font.taglineEn}`}
                    </p>
                  </div>
                </div>

                {active && (
                  <span className="w-6 h-6 rounded-full bg-teal-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* Google Drive & Calendar Storage */}
      <section className="carved-panel p-6 space-y-4">
        <h3 className="text-xs font-bold text-sky-700 dark:text-sky-400">
          {t.cloudGroup}
        </h3>

        <div className="carved-well p-3 space-y-2.5">
          {/* Google Drive App Backup */}
          <div className="carved-tile p-4 space-y-3.5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-400 to-indigo-600 text-white flex items-center justify-center shrink-0">
                  <HardDrive className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {t.driveBackupTitle}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {t.driveBackupDesc}
                  </p>
                  <p className="text-[11px] font-mono-tabular text-teal-700 dark:text-teal-400 mt-1">
                    {t.lastDriveBackup}:{' '}
                    {profile.lastDriveBackupAt
                      ? new Date(profile.lastDriveBackupAt).toLocaleString(
                          lang === 'bn' ? 'bn-BD' : 'en-US'
                        )
                      : t.neverBackedUp}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200/70 dark:border-slate-700/70">
              <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={profile.autoDriveBackup}
                  onChange={() =>
                    onUpdatePreferences({ autoDriveBackup: !profile.autoDriveBackup })
                  }
                  className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                />
                <span>{t.driveAutoBackup}</span>
              </label>

              <div className="flex flex-wrap items-center gap-2">
                {hasGoogleToken ? (
                  <>
                    <button
                      type="button"
                      onClick={onBackupToDrive}
                      disabled={isBackingUpDrive}
                      className="carved-btn-primary inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white rounded-lg cursor-pointer disabled:opacity-60"
                    >
                      <CloudUpload className="w-3.5 h-3.5" />
                      <span>{t.driveBackupNow}</span>
                    </button>
                    <button
                      type="button"
                      onClick={onRestoreFromDrive}
                      disabled={isBackingUpDrive}
                      className="carved-btn-surface inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 rounded-lg cursor-pointer disabled:opacity-60"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{t.driveRestoreNow}</span>
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={onReconnectGoogle}
                    className="carved-btn-primary inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white rounded-lg cursor-pointer"
                  >
                    <CalendarSync className="w-3.5 h-3.5" />
                    <span>{t.reconnectCalendar}</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Google Calendar Sync */}
          <div className="carved-tile p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 text-white flex items-center justify-center shrink-0">
                <CalendarSync className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {t.sourceGoogle}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {t.calendarSyncDesc}
                </p>
              </div>
            </div>

            {hasGoogleToken ? (
              <button
                type="button"
                onClick={onSyncCalendar}
                disabled={isSyncingCalendar}
                className="carved-btn-surface inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-teal-700 dark:text-teal-300 rounded-lg cursor-pointer disabled:opacity-60"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${isSyncingCalendar ? 'animate-spin' : ''}`}
                />
                <span>{isSyncingCalendar ? t.syncing : t.syncCalendar}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onReconnectGoogle}
                className="carved-btn-surface inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-sky-700 dark:text-sky-300 rounded-lg cursor-pointer"
              >
                <CalendarSync className="w-3.5 h-3.5" />
                <span>{t.reconnectCalendar}</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Reminders */}
      <section className="carved-panel p-6 space-y-4">
        <h3 className="text-xs font-bold text-amber-700 dark:text-amber-400">
          {t.remindersGroup}
        </h3>

        <div className="carved-well p-3">
          <div className="carved-tile p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center shrink-0">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {t.tomorrowReminderTitle}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {t.notificationsDesc}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {profile.notificationsEnabled && (
                <button
                  type="button"
                  onClick={onTestNotification}
                  className="carved-btn-surface px-3 py-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300 rounded-lg cursor-pointer"
                >
                  {t.testNotification}
                </button>
              )}
              <SwitchToggle
                checked={profile.notificationsEnabled}
                onChange={onToggleNotifications}
                label={t.tomorrowReminderTitle}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Advanced Security & Protection */}
      <section className="carved-panel p-6 space-y-4">
        <h3 className="text-xs font-bold text-rose-700 dark:text-rose-400">
          {t.securityGroup}
        </h3>

        <div className="carved-well p-3 space-y-2.5">
          {/* Web Crypto Encryption */}
          <div className="carved-tile p-4 flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {t.encryptionTitle}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {t.encryptionDesc}
                </p>
              </div>
            </div>
            <SwitchToggle
              checked={profile.encryptionEnabled}
              onChange={() =>
                onUpdatePreferences({ encryptionEnabled: !profile.encryptionEnabled })
              }
              label={t.encryptionTitle}
            />
          </div>

          {/* 4-Digit PIN Lock */}
          <div className="carved-tile p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 text-white flex items-center justify-center shrink-0">
                <Lock className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {t.pinLockTitle}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {t.pinLockDesc}
                </p>
              </div>
            </div>

            {profile.pinEnabled ? (
              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={onLockNow}
                  className="carved-btn-primary inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white rounded-lg cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{t.lockNowBtn}</span>
                </button>
                <button
                  type="button"
                  onClick={onDisablePin}
                  className="carved-btn-surface inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 rounded-lg cursor-pointer"
                >
                  {t.disablePinBtn}
                </button>
              </div>
            ) : (
              <form onSubmit={handlePinSubmit} className="flex flex-wrap items-center gap-2 pt-1">
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder={t.setPinPlaceholder}
                  className="w-44 px-3 py-2 text-sm font-mono-tabular tracking-widest bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500"
                />
                <button
                  type="submit"
                  className="carved-btn-primary px-4 py-2 text-xs font-semibold text-white rounded-lg cursor-pointer"
                >
                  {t.enablePinBtn}
                </button>
                {pinError && (
                  <p className="w-full text-xs text-rose-600 dark:text-rose-400">{pinError}</p>
                )}
              </form>
            )}
          </div>

          {/* Clear Local Device Storage */}
          <div className="carved-tile p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Trash2 className="w-4 h-4 text-rose-500 shrink-0" />
              <span className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                {t.clearLocalBtn}
              </span>
            </div>
            <button
              type="button"
              onClick={onClearLocalData}
              className="carved-btn-surface px-3.5 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 rounded-lg cursor-pointer"
            >
              {t.clearLocalBtn}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
