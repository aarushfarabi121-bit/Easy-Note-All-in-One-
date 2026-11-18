import React, { useCallback, useEffect, useState } from 'react';
import { Lock, ShieldCheck } from 'lucide-react';
import { UI_TEXT } from '../i18n/translations';
import { Language } from '../types/note';

interface PinLockOverlayProps {
  lang: Language;
  onUnlock: (pin: string) => Promise<boolean>;
}

export const PinLockOverlay: React.FC<PinLockOverlayProps> = ({
  lang,
  onUnlock,
}) => {
  const t = UI_TEXT[lang];
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  const handleDigit = useCallback(
    async (digit: string) => {
      if (checking || pin.length >= 4) return;
      const next = pin + digit;
      setPin(next);
      setError('');

      if (next.length === 4) {
        setChecking(true);
        const ok = await onUnlock(next);
        setChecking(false);
        if (!ok) {
          setError(t.wrongPin);
          setPin('');
        }
      }
    },
    [checking, pin, onUnlock, t.wrongPin]
  );

  const handleBackspace = useCallback(() => {
    setPin((prev) => prev.slice(0, -1));
    setError('');
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        void handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleDigit, handleBackspace]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xl p-4">
      <div className="carved-panel max-w-sm w-full p-7 text-center space-y-6">
        <div className="space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-sky-600 text-white flex items-center justify-center mx-auto shadow-lg">
            <Lock className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {t.unlockTitle}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t.unlockSubtitle}
          </p>
        </div>

        {/* 4 PIN Dots */}
        <div className="flex items-center justify-center gap-4 py-1">
          {[0, 1, 2, 3].map((idx) => {
            const filled = idx < pin.length;
            return (
              <span
                key={idx}
                className={`w-4 h-4 rounded-full border transition-all ${
                  filled
                    ? 'bg-teal-500 border-teal-600 scale-110'
                    : 'bg-slate-200 dark:bg-slate-800 border-slate-300 dark:border-slate-700'
                }`}
              />
            );
          })}
        </div>

        {error && (
          <p className="text-xs font-medium text-rose-600 dark:text-rose-400">
            {error}
          </p>
        )}

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-2.5">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => handleDigit(d)}
              className="carved-btn-surface h-12 rounded-xl text-base font-bold font-mono-tabular text-slate-900 dark:text-slate-100 cursor-pointer"
            >
              {d}
            </button>
          ))}
          <div className="flex items-center justify-center text-teal-600 dark:text-teal-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="carved-btn-surface h-12 rounded-xl text-base font-bold font-mono-tabular text-slate-900 dark:text-slate-100 cursor-pointer"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            className="carved-btn-surface h-12 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer"
          >
            ⌫
          </button>
        </div>
      </div>
    </div>
  );
};
