export default function StatusBadge({ isOnline, label }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] ${
        isOnline
          ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200'
          : 'border-slate-700 bg-slate-900/70 text-slate-400'
      }`}
    >
      <span
        className={`h-2 w-2 rounded-full ${isOnline ? 'bg-emerald-400 shadow-[0_0_12px_rgba(74,222,128,0.55)]' : 'bg-slate-500'}`}
      />
      {label || (isOnline ? 'Online' : 'Offline')}
    </span>
  );
}

