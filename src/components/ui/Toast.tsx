import { useState, useEffect, ReactNode } from 'react';

interface ToastData {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

let listeners: ((toast: ToastData) => void)[] = [];
let toastId = 0;

export function toast(message: string, type: ToastData['type'] = 'success') {
  const id = String(++toastId);
  const data: ToastData = { id, message, type };
  listeners.forEach((l) => l(data));
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  useEffect(() => {
    const listener = (data: ToastData) => {
      setToasts((prev: ToastData[]) => [...prev, data]);
      setTimeout(() => {
        setToasts((prev: ToastData[]) => prev.filter((t: ToastData) => t.id !== data.id));
      }, 4000);
    };
    listeners.push(listener);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  }, []);

  return { toasts, dismiss: (id: string) => setToasts((prev: ToastData[]) => prev.filter((t: ToastData) => t.id !== id)) };
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const { toasts, dismiss } = useToast();

  return (
    <>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
        {toasts.map((t: ToastData) => (
          <div
            key={t.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-[2.5rem] shadow-strong animate-slide-in min-w-[280px] max-w-[420px] ${
              t.type === 'success' ? 'bg-sprout text-white' :
              t.type === 'error' ? 'bg-crimson text-white' :
              t.type === 'warning' ? 'bg-amber text-white' :
              'bg-iris text-white'
            }`}
          >
            <span className="text-sm font-medium flex-1">{t.message}</span>
            <button onClick={() => dismiss(t.id)} className="text-lg leading-none opacity-70 hover:opacity-100">×</button>
          </div>
        ))}
      </div>
    </>
  );
}
