import { useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function ChatPanel({
  isSendingDisabled,
  messages,
  onChange,
  onSend,
  typingLabel,
  value,
}) {
  const { user } = useAuth();
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  return (
    <div className="glass-card flex h-full flex-col rounded-2xl border border-slate-800/80 sm:rounded-[2rem]">
      <header className="border-b border-slate-800/60 px-4 py-3 sm:px-5 sm:py-4">
        <p className="text-sm font-semibold text-white sm:text-base">In-Game Chat</p>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3 sm:px-5 sm:py-4">
        {messages.length === 0 && (
          <p className="py-4 text-center text-sm text-slate-500 sm:py-6">
            No messages yet. Say something to your opponent!
          </p>
        )}

        {messages.map((msg) => {
          const isMine = msg.userId === user?.id;
          return (
            <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm sm:px-4 sm:py-2.5 ${
                  isMine
                    ? 'bg-cyan-500/20 text-cyan-50 border border-cyan-500/20'
                    : 'bg-slate-800/60 text-slate-200 border border-slate-700/40'
                }`}
              >
                {!isMine && (
                  <p className="mb-1 text-[10px] font-semibold text-slate-400 sm:text-xs">
                    {msg.username}
                  </p>
                )}
                <p className="break-words">{msg.message}</p>
              </div>
            </div>
          );
        })}
        <div ref={scrollRef} />
      </div>

      <div className="min-h-5 px-4 sm:min-h-6 sm:px-5">
        {typingLabel && <p className="text-xs text-cyan-300 animate-pulse">{typingLabel}</p>}
      </div>

      <form onSubmit={onSend} className="flex gap-2 border-t border-slate-800/60 p-3 sm:p-4">
        <input
          value={value}
          onChange={onChange}
          placeholder="Send a message..."
          disabled={isSendingDisabled}
          maxLength={320}
          className="flex-1 rounded-full border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400 disabled:opacity-50 sm:px-4"
        />
        <button
          type="submit"
          disabled={isSendingDisabled || !value.trim()}
          className="rounded-full bg-cyan-400 px-3 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50 sm:px-4"
        >
          Send
        </button>
      </form>
    </div>
  );
}
