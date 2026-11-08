import React, { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
import { useLocale } from '../../context/LocaleContext';

interface ModalProps {
  isOpen?: boolean;
  open?: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
}

export function Modal({
  isOpen = false,
  open = false,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
}: ModalProps) {
  const isModalOpen = isOpen || open;
  const { t } = useLocale();
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const titleId = useId();

  useEffect(() => {
    if (!isModalOpen) return;
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = 'hidden';
    const dialog = dialogRef.current;
    const focusable = () => Array.from(dialog?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])') || []);
    (focusable()[0] || dialog)?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); onCloseRef.current(); }
      if (event.key !== 'Tab') return;
      const items = focusable();
      if (!items.length) { event.preventDefault(); return; }
      if (event.shiftKey && document.activeElement === items[0]) { event.preventDefault(); items[items.length - 1].focus(); }
      else if (!event.shiftKey && document.activeElement === items[items.length - 1]) { event.preventDefault(); items[0].focus(); }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [isModalOpen]);

  if (!isModalOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-4',
  };

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto" role="presentation">
      <div className="fixed inset-0 bg-black/50 transition-opacity" aria-hidden="true" onClick={onClose} />
      <div className="flex min-h-full items-center justify-center p-4 text-center">
        <div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={title ? titleId : undefined} className={`relative w-full max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-lg bg-white text-left shadow-xl ${sizeClasses[size]}`}>
          {(title || showCloseButton) && (
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
              {title && <h2 id={titleId} className="text-lg font-semibold text-zinc-900">{title}</h2>}
              {showCloseButton && (
                <button
                  type="button"
                  className="text-zinc-400 hover:text-zinc-600 transition-colors"
                  onClick={onClose}
                  aria-label={t('ui.closeDialog')}
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          )}
          <div className="p-6">{children}</div>
        </div>
      </div>
    </div>
  );
}

interface ModalSectionProps {
  className?: string;
  children: React.ReactNode;
}

export function ModalSection({ className = '', children }: ModalSectionProps) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}

export default Modal;
