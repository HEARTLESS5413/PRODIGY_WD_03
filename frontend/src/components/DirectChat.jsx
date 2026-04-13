import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useSocket } from '../contexts/SocketContext.jsx';

export default function DirectChat({ friend, onClose }) {
  const { user } = useAuth();
  const { sendDM, loadDMHistory, sendDMTyping, clearDMUnread, dmMessages, dmTyping } = useSocket();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const hasLoadedRef = useRef(false);

  const friendMessages = (dmMessages[friend.id] || []);
  const isTyping = dmTyping[friend.id];

  // Clear unread on mount and whenever new messages come in
  useEffect(() => {
    clearDMUnread(friend.id);
  }, [friend.id, friendMessages.length, clearDMUnread]);

  useEffect(() => {
    if (!hasLoadedRef.current) {
      loadDMHistory(friend.id);
      hasLoadedRef.current = true;
    }
  }, [friend.id, loadDMHistory]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [friendMessages.length]);

  function handleChange(e) {
    setInput(e.target.value);
    sendDMTyping(friend.id, e.target.value.length > 0);
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => sendDMTyping(friend.id, false), 1200);
  }

  function handleSend(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    sendDM(friend.id, text);
    setInput('');
    sendDMTyping(friend.id, false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Chat Panel */}
      <div className="relative z-10 flex h-[85vh] w-full max-w-md flex-col rounded-t-[2rem] border border-slate-800/80 bg-slate-950/95 shadow-2xl backdrop-blur-xl sm:h-[70vh] sm:rounded-[2rem]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/60 px-5 py-4">
          <div>
            <p className="text-base font-semibold text-white">{friend.username}</p>
            <p className="mt-0.5 text-xs text-slate-400">
              {friend.isOnline ? (
                <span className="text-emerald-300">● Online</span>
              ) : (
                <span className="text-slate-500">○ Offline</span>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-700 bg-slate-900/60 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-slate-500 hover:text-white"
          >
            Close
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {friendMessages.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <p className="rounded-2xl border border-dashed border-slate-700/60 px-5 py-4 text-center text-sm text-slate-500">
                No messages yet. Say hi to {friend.username}!
              </p>
            </div>
          ) : (
            friendMessages.map((msg) => {
              const isMine = msg.from === user?.id;
              return (
                <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      isMine
                        ? 'bg-cyan-500/20 text-cyan-50 border border-cyan-500/20'
                        : 'bg-slate-800/60 text-slate-200 border border-slate-700/40'
                    }`}
                  >
                    <p>{msg.message}</p>
                    <p className={`mt-1 text-[10px] ${isMine ? 'text-cyan-300/60' : 'text-slate-500'}`}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Typing */}
        <div className="min-h-6 px-5">
          {isTyping && (
            <p className="text-xs text-cyan-300 animate-pulse">{friend.username} is typing...</p>
          )}
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="flex gap-2 border-t border-slate-800/60 px-4 py-3">
          <input
            value={input}
            onChange={handleChange}
            placeholder="Type a message..."
            maxLength={500}
            className="flex-1 rounded-full border border-slate-700 bg-slate-900/60 px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="rounded-full bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
