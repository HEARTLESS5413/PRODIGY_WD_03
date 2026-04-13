import { useEffect, useState } from 'react';

export default function DmToast({ notification, onDismiss }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!notification) {
      setIsVisible(false);
      return;
    }

    setIsVisible(true);
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onDismiss, 300); // wait for fade-out animation
    }, 4000);

    return () => clearTimeout(timer);
  }, [notification, onDismiss]);

  if (!notification) return null;

  const preview = notification.message.length > 60
    ? notification.message.slice(0, 60) + '...'
    : notification.message;

  return (
    <div
      className={`fixed right-4 top-4 z-[60] max-w-sm transition-all duration-300 sm:right-6 sm:top-6 ${
        isVisible
          ? 'translate-y-0 opacity-100'
          : '-translate-y-4 opacity-0 pointer-events-none'
      }`}
    >
      <div className="flex items-start gap-3 rounded-2xl border border-cyan-400/30 bg-slate-950/95 px-4 py-3.5 shadow-neon backdrop-blur-xl sm:px-5 sm:py-4">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-cyan-400/15 text-lg">
          💬
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white">{notification.fromUsername}</p>
          <p className="mt-0.5 truncate text-sm text-slate-300">{preview}</p>
        </div>
        <button
          type="button"
          onClick={() => { setIsVisible(false); setTimeout(onDismiss, 300); }}
          className="flex-shrink-0 rounded-full p-1 text-slate-500 transition hover:text-white"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
