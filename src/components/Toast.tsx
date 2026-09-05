import { useState, useEffect } from 'react';

let addToastListener: ((msg: string) => void) | null = null;

export const showToast = (message: string) => {
  if (addToastListener) addToastListener(message);
  else console.warn("Toast trigger ignored:", message);
}

export function ToastContainer() {
  const [toast, setToast] = useState<{ id: number, msg: string } | null>(null);

  useEffect(() => {
    addToastListener = (msg: string) => {
      const id = Date.now();
      setToast({ id, msg });
      setTimeout(() => {
        setToast((prev) => (prev?.id === id ? null : prev));
      }, 3500);
    };
    return () => { addToastListener = null; };
  }, []);

  if (!toast) return null;

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="bg-foreground text-background px-5 py-3 rounded-full shadow-xl text-sm font-bold flex items-center gap-2 whitespace-nowrap">
        {toast.msg}
      </div>
    </div>
  );
}
