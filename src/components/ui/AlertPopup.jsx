// src/components/ui/AlertPopup.jsx
import {
  Alert,
  AlertActions,
  AlertDescription,
  AlertTitle,
} from '@/components/catalyst-ui-kit/alert';
import { Button } from '@/components/catalyst-ui-kit/button';

export default function AlertPopup({
  isOpen,
  setIsOpen,
  title = 'Something went wrong',
  description = '',
  confirmText = 'OK',
  cancelText,
  onConfirm,
}) {
  return (
    <Alert open={isOpen} onClose={() => setIsOpen(false)}>
      <AlertTitle>{title}</AlertTitle>
      {description && <AlertDescription>{description}</AlertDescription>}
      <AlertActions>
        {cancelText && (
          <Button plain onClick={() => setIsOpen(false)}>
            {cancelText}
          </Button>
        )}
        <Button
          onClick={() => {
            if (onConfirm) onConfirm();
            setIsOpen(false);
          }}
        >
          {confirmText}
        </Button>
      </AlertActions>
    </Alert>
  );
}
