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
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
      role="dialog"
      aria-labelledby="confirm-title"
      aria-describedby="confirm-message"
      onClick={onCancel}
    >
      <div
        className="bg-surface rounded-2xl w-full max-w-[280px] shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 pb-4 flex flex-col items-center text-center">
          {variant === 'danger' && (
            <div className="w-11 h-11 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-3">
              <AlertTriangle size={22} className="text-red-500" />
            </div>
          )}
          <h3 id="confirm-title" className="font-bold text-[17px] text-text-primary mb-1">{title}</h3>
          <p id="confirm-message" className="text-[13px] text-text-secondary leading-relaxed">{message}</p>
        </div>
        <div className="border-t border-border flex">
          <button
            onClick={onCancel}
            aria-label={cancelLabel}
            className="flex-1 py-3 text-[15px] text-primary-600 font-medium active:bg-surface-secondary transition-colors border-r border-border"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            aria-label={confirmLabel}
            className={`flex-1 py-3 text-[15px] font-semibold active:bg-surface-secondary transition-colors ${
              variant === 'danger' ? 'text-red-500' : 'text-primary-600'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
