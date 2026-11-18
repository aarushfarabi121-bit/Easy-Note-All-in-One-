import React from 'react';
import { UI_TEXT } from '../i18n/translations';
import { BottomTab, Language } from '../types/note';

interface BottomLiquidDockProps {
  activeTab: BottomTab;
  lang: Language;
  onSelectTab: (tab: BottomTab) => void;
  onNewNote: () => void;
  trashCount?: number;
}

const LiquidHomeIcon: React.FC<{ active: boolean }> = ({ active }) => (
  <svg viewBox="0 0 28 28" className="w-6 h-6" fill="none">
    <defs>
      <linearGradient id="liqHome" x1="2" y1="2" x2="26" y2="26" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#2dd4bf" />
        <stop offset="100%" stopColor="#0284c7" />
      </linearGradient>
    </defs>
    <path
      d="M4.5 12.2L14 4.2L23.5 12.2V22C23.5 23.1 22.6 24 21.5 24H17.2V17.4C17.2 16.3 16.3 15.4 15.2 15.4H12.8C11.7 15.4 10.8 16.3 10.8 17.4V24H6.5C5.4 24 4.5 23.1 4.5 22V12.2Z"
      fill={active ? 'url(#liqHome)' : 'currentColor'}
      fillOpacity={active ? 1 : 0.16}
      stroke={active ? 'url(#liqHome)' : 'currentColor'}
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    {active && (
      <path
        d="M8.5 10.2C10.5 8.5 12.5 7.4 14 7.2"
        stroke="white"
        strokeOpacity="0.65"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    )}
  </svg>
);

const LiquidNotesIcon: React.FC<{ active: boolean }> = ({ active }) => (
  <svg viewBox="0 0 28 28" className="w-6 h-6" fill="none">
    <defs>
      <linearGradient id="liqNotes" x1="3" y1="3" x2="25" y2="25" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#818cf8" />
        <stop offset="100%" stopColor="#ec4899" />
      </linearGradient>
    </defs>
    <rect
      x="5"
      y="4"
      width="18"
      height="20"
      rx="4.5"
      fill={active ? 'url(#liqNotes)' : 'currentColor'}
      fillOpacity={active ? 1 : 0.16}
      stroke={active ? 'url(#liqNotes)' : 'currentColor'}
      strokeWidth="1.8"
    />
    <path
      d="M9.5 10.2H18.5M9.5 14.5H18.5M9.5 18.8H14.5"
      stroke={active ? 'white' : 'currentColor'}
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

const LiquidNewNoteIcon: React.FC = () => (
  <svg viewBox="0 0 28 28" className="w-6 h-6" fill="none">
    <defs>
      <linearGradient id="liqNew" x1="2" y1="2" x2="26" y2="26" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#14b8a6" />
        <stop offset="55%" stopColor="#0ea5e9" />
        <stop offset="100%" stopColor="#6366f1" />
      </linearGradient>
    </defs>
    <rect x="3" y="3" width="22" height="22" rx="8" fill="url(#liqNew)" />
    <path
      d="M14 9V19M9 14H19"
      stroke="white"
      strokeWidth="2.3"
      strokeLinecap="round"
    />
  </svg>
);

const LiquidSettingsIcon: React.FC<{ active: boolean }> = ({ active }) => (
  <svg viewBox="0 0 28 28" className="w-6 h-6" fill="none">
    <defs>
      <linearGradient id="liqSet" x1="2" y1="2" x2="26" y2="26" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#fbbf24" />
        <stop offset="100%" stopColor="#f43f5e" />
      </linearGradient>
    </defs>
    <circle
      cx="14"
      cy="14"
      r="9"
      fill={active ? 'url(#liqSet)' : 'currentColor'}
      fillOpacity={active ? 1 : 0.16}
      stroke={active ? 'url(#liqSet)' : 'currentColor'}
      strokeWidth="1.8"
    />
    <circle
      cx="14"
      cy="14"
      r="3.2"
      fill={active ? 'white' : 'none'}
      stroke={active ? 'white' : 'currentColor'}
      strokeWidth="1.8"
    />
    <path
      d="M14 3.5V6.2M14 21.8V24.5M3.5 14H6.2M21.8 14H24.5"
      stroke={active ? 'url(#liqSet)' : 'currentColor'}
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const LiquidProfileIcon: React.FC<{ active: boolean }> = ({ active }) => (
  <svg viewBox="0 0 28 28" className="w-6 h-6" fill="none">
    <defs>
      <linearGradient id="liqProf" x1="4" y1="3" x2="24" y2="25" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#38bdf8" />
        <stop offset="100%" stopColor="#6366f1" />
      </linearGradient>
    </defs>
    <circle
      cx="14"
      cy="10"
      r="4.5"
      fill={active ? 'url(#liqProf)' : 'currentColor'}
      fillOpacity={active ? 1 : 0.22}
      stroke={active ? 'url(#liqProf)' : 'currentColor'}
      strokeWidth="1.8"
    />
    <path
      d="M5.5 23.2C6.4 18.9 9.8 16.5 14 16.5C18.2 16.5 21.6 18.9 22.5 23.2"
      fill={active ? 'url(#liqProf)' : 'currentColor'}
      fillOpacity={active ? 0.9 : 0.14}
      stroke={active ? 'url(#liqProf)' : 'currentColor'}
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

export const BottomLiquidDock: React.FC<BottomLiquidDockProps> = ({
  activeTab,
  lang,
  onSelectTab,
  onNewNote,
}) => {
  const t = UI_TEXT[lang];

  const renderTabButton = (
    id: BottomTab,
    label: string,
    renderIcon: (active: boolean) => React.ReactNode,
    accentText: string
  ) => {
    const active = activeTab === id;
    return (
      <button
        key={id}
        type="button"
        onClick={() => onSelectTab(id)}
        className={`min-h-[48px] px-1.5 py-1.5 rounded-xl flex flex-col items-center justify-center transition-all duration-150 cursor-pointer ${
          active
            ? `carved-pill-active scale-[1.02] ${accentText}`
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
        }`}
      >
        <span className="transition-transform duration-150">{renderIcon(active)}</span>
        <span className="text-[10px] sm:text-[11px] font-semibold tracking-tight mt-0.5 whitespace-nowrap">
          {label}
        </span>
      </button>
    );
  };

  return (
    <nav
      aria-label="Primary bottom navigation"
      className="fixed bottom-3 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-1.25rem)] max-w-xl"
    >
      <div className="liquid-dock rounded-2xl px-2 py-1.5 grid grid-cols-5 gap-1 items-center">
        {renderTabButton(
          'home',
          t.tabHome,
          (active) => <LiquidHomeIcon active={active} />,
          'text-teal-600 dark:text-teal-400'
        )}

        {renderTabButton(
          'notes',
          t.tabAllNotes,
          (active) => <LiquidNotesIcon active={active} />,
          'text-indigo-600 dark:text-indigo-400'
        )}

        {/* Centered New Note Action between All Notes and Settings */}
        <button
          type="button"
          onClick={onNewNote}
          aria-label={t.newNote}
          className="min-h-[48px] px-1.5 py-1.5 rounded-xl flex flex-col items-center justify-center text-teal-700 dark:text-teal-300 hover:scale-[1.04] active:scale-[0.97] transition-transform duration-150 cursor-pointer"
        >
          <span className="drop-shadow-sm">
            <LiquidNewNoteIcon />
          </span>
          <span className="text-[10px] sm:text-[11px] font-bold tracking-tight mt-0.5 whitespace-nowrap">
            {t.newNote}
          </span>
        </button>

        {renderTabButton(
          'settings',
          t.tabSettings,
          (active) => <LiquidSettingsIcon active={active} />,
          'text-rose-600 dark:text-rose-400'
        )}

        {renderTabButton(
          'profile',
          t.tabProfile,
          (active) => <LiquidProfileIcon active={active} />,
          'text-sky-600 dark:text-sky-400'
        )}
      </div>
    </nav>
  );
};
