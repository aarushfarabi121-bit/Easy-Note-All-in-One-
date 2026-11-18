import React, { useState, useEffect } from 'react';
import { AlertTriangle, CalendarSync, X } from 'lucide-react';
import { ConfirmDialogState } from '../types/note';

interface ConfirmActionModalProps {
  dialog: ConfirmDialogState | null;
  onClose: () => void;
}

export const ConfirmActionModal: React.FC<ConfirmActionModalProps> = ({
  dialog,
  onClose,
}) => {
  const [secondaryChecked, setSecondaryChecked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (dialog) {
      setSecondaryChecked(Boolean(dialog.secondaryChecked));
      setIsSubmitting(false);
    }
  }, [dialog]);

  if (!dialog || !dialog.isOpen) return null;

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await dialog.onConfirm(secondaryChecked);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDanger = dialog.variant === 'danger';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 dark:bg-slate-950/70 backdrop-blur-[4px] p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <div className="carved-panel max-w-md w-full p-6 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className={`carved-well w-10 h-10 flex items-center justify-center shrink-0 ${
                isDanger
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-teal-600 dark:text-teal-400'
              }`}
            >
              {isDanger ? (
                <AlertTriangle className="w-5 h-5" />
              ) : (
                <CalendarSync className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3
                id="confirm-modal-title"
                className="text-base font-bold text-slate-900 dark:text-slate-100"
              >
                {dialog.title}
              </h3>
              <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {dialog.message}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="carved-btn-surface text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-lg cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {dialog.secondaryCheckboxLabel && (
          <label className="carved-well flex items-center gap-2.5 p-3 text-sm text-slate-700 dark:text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={secondaryChecked}
              onChange={(e) => setSecondaryChecked(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-teal-600 focus:ring-teal-500"
            />
            <span>{dialog.secondaryCheckboxLabel}</span>
          </label>
        )}

        <div className="flex items-center justify-end gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="carved-btn-surface px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
          >
            {dialog.cancelLabel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className={`px-4 py-2 text-sm font-semibold text-white rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60 ${
              isDanger
                ? 'bg-gradient-to-b from-rose-500 to-rose-600 border border-rose-700 shadow-sm hover:brightness-105'
                : 'carved-btn-primary'
            }`}
          >
            {isSubmitting ? '...' : dialog.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
