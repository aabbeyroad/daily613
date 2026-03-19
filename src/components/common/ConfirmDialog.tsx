import { AlertTriangle } from 'lucide-react';
import { Button, Modal, Notice } from '../ui/primitives';

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
    <Modal
      open={true}
      title={title}
      description={message}
      onClose={onCancel}
      size="sm"
      footer={
        <>
          <Button variant="secondary" size="lg" fullWidth onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant={variant === 'danger' ? 'danger' : 'primary'} size="lg" fullWidth onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {variant === 'danger' ? (
        <Notice tone="danger" className="flex items-center gap-3">
          <AlertTriangle size={18} />
          <span>이 작업은 되돌릴 수 없습니다.</span>
        </Notice>
      ) : null}
    </Modal>
  );
}
