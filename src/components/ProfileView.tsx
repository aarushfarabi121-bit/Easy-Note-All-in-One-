import React, { useEffect, useRef, useState } from 'react';
import { Camera, Check, LogOut, RotateCcw, Sparkles } from 'lucide-react';
import { UI_TEXT } from '../i18n/translations';
import { Language, UserProfile } from '../types/note';
import { HUMAN_AVATAR_PRESETS, resolveAvatarSrc } from '../utils/avatars';
import { getDailyGreeting } from '../utils/greetings';

interface ProfileViewProps {
  lang: Language;
  now: Date;
  profile: UserProfile;
  googleDisplayName: string;
  googleEmail: string;
  googlePhotoUrl: string;
  onUpdateProfile: (updates: Partial<UserProfile>) => void;
  onLogout: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  lang,
  now,
  profile,
  googleDisplayName,
  googleEmail,
  googlePhotoUrl,
  onUpdateProfile,
  onLogout,
}) => {
  const t = UI_TEXT[lang];
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [nameInput, setNameInput] = useState(
    profile.customName || googleDisplayName || ''
  );
  const [avatarValue, setAvatarValue] = useState(
    profile.customAvatar || ''
  );
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    setNameInput(profile.customName || googleDisplayName || '');
  }, [profile.customName, googleDisplayName]);

  useEffect(() => {
    setAvatarValue(profile.customAvatar || '');
  }, [profile.customAvatar]);

  const avatarPreviewSrc = resolveAvatarSrc(avatarValue, googlePhotoUrl);
  const greeting = getDailyGreeting(now, lang);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const minSide = Math.min(img.width, img.height);
        const sx = (img.width - minSide) / 2;
        const sy = (img.height - minSide) / 2;
        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, 256, 256);
        const compressed = canvas.toDataURL('image/jpeg', 0.82);
        setAvatarValue(compressed);
        onUpdateProfile({ customAvatar: compressed });
      };
      img.src = String(reader.result || '');
    };
    reader.readAsDataURL(file);
  };

  const handleSelectHumanPreset = (presetValue: string) => {
    setAvatarValue(presetValue);
    onUpdateProfile({ customAvatar: presetValue });
  };

  const handleUseGooglePhoto = () => {
    setAvatarValue('');
    onUpdateProfile({ customAvatar: '' });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      customName: nameInput.trim().slice(0, 60),
      customAvatar: avatarValue,
    });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <section className="carved-panel p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-center gap-5 pb-6 border-b border-slate-200/80 dark:border-slate-700/70">
          <div className="relative group shrink-0">
            {avatarPreviewSrc ? (
              <img
                src={avatarPreviewSrc}
                alt={nameInput || 'Profile'}
                referrerPolicy="no-referrer"
                className="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-slate-800 shadow-lg"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-teal-500 via-sky-500 to-indigo-500 text-white text-3xl font-bold flex items-center justify-center border-4 border-white dark:border-slate-800 shadow-lg">
                {(nameInput || googleEmail || 'U').charAt(0).toUpperCase()}
              </div>
            )}

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="carved-btn-primary absolute -bottom-1 -right-1 w-9 h-9 rounded-full flex items-center justify-center text-white cursor-pointer"
              title={t.uploadPhoto}
              aria-label={t.uploadPhoto}
            >
              <Camera className="w-4 h-4" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          <div className="text-center sm:text-left space-y-1.5 min-w-0 flex-1">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 truncate">
              {nameInput || googleDisplayName || 'Easy Note User'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {googleEmail}
            </p>
            <p className="text-sm font-medium text-teal-700 dark:text-teal-300 flex items-start justify-center sm:justify-start gap-1.5 pt-1 leading-relaxed">
              <span className="shrink-0" aria-hidden="true">
                {greeting.emoji}
              </span>
              <span>
                {greeting.text} {greeting.inspiringEmoji}
              </span>
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {t.profileNameLabel}
            </label>
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              maxLength={60}
              placeholder={t.profileNamePlaceholder}
              className="w-full px-4 py-2.5 text-sm bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {t.chooseCuteAvatar}
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="carved-btn-surface inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-teal-700 dark:text-teal-300 rounded-lg cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" />
                  {t.uploadPhoto}
                </button>
                {googlePhotoUrl && (
                  <button
                    type="button"
                    onClick={handleUseGooglePhoto}
                    className="carved-btn-surface inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 rounded-lg cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    {t.useGooglePhoto}
                  </button>
                )}
              </div>
            </div>

            <div className="carved-well p-3 grid grid-cols-3 sm:grid-cols-6 gap-3">
              {HUMAN_AVATAR_PRESETS.map((preset) => {
                const selected = avatarValue === preset.presetValue;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectHumanPreset(preset.presetValue)}
                    title={lang === 'bn' ? preset.labelBn : preset.labelEn}
                    aria-label={lang === 'bn' ? preset.labelBn : preset.labelEn}
                    className={`aspect-square rounded-2xl overflow-hidden shadow-md hover:scale-105 hover:-translate-y-0.5 transition-all cursor-pointer border-2 ${
                      selected
                        ? 'border-teal-500 ring-2 ring-teal-400/50 scale-[1.03]'
                        : 'border-white/80 dark:border-slate-700/80'
                    }`}
                  >
                    <img
                      src={preset.src}
                      alt={lang === 'bn' ? preset.labelBn : preset.labelEn}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={onLogout}
              className="carved-btn-surface inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-rose-600 dark:text-rose-400 rounded-xl cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              {t.signOut}
            </button>

            <button
              type="submit"
              className="carved-btn-primary inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-xl cursor-pointer"
            >
              {savedNotice ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>{t.profileSaved}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>{t.saveProfile}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};
