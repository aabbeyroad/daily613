import { AlertTriangle } from 'lucide-react';

interface Props {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'default';
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  title,
  message,
  confirmLabel = '확인',
  cancelLabel = '취소',
  variant = 'default',
  onConfirm,
  onCancel,
}: Props) {
  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4"
      role="dialog"
      aria-labelledby="confirm-title"
      aria-describedby="confirm-message"
      onClick={onCancel}
    >
      <div
        className="bg-surface rounded-2xl p-5 w-full max-w-xs shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center text-center">
          {variant === 'danger' && (
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-3">
              <AlertTriangle size={24} className="text-red-500" />
            </div>
          )}
          <h3 id="confirm-title" className="font-bold text-text-primary mb-1">{title}</h3>
          <p id="confirm-message" className="text-sm text-text-secondary mb-5">{message}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            aria-label={cancelLabel}
            className="flex-1 py-2.5 rounded-xl border border-border text-text-secondary font-medium text-sm active:scale-[0.98] transition-all"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            aria-label={confirmLabel}
            className={`flex-1 py-2.5 rounded-xl font-medium text-sm active:scale-[0.98] transition-all ${
              variant === 'danger'
                ? 'bg-red-500 text-white'
                : 'bg-primary-600 text-white'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
