export default function RematchModal({ opponentName, onAccept, onDecline }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative z-10 mx-4 w-full max-w-sm animate-fade-up rounded-[2rem] border border-cyan-400/30 bg-slate-950/95 p-8 text-center shadow-neon backdrop-blur-xl">
        {/* Icon */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-cyan-400/30 bg-cyan-400/10">
          <span className="text-3xl">🔄</span>
        </div>

        <h3 className="mt-5 text-2xl font-bold text-white">Rematch Request!</h3>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          <span className="font-semibold text-cyan-200">{opponentName}</span> wants to play again.
          Ready for another round?
        </p>

        <div className="mt-7 flex gap-3">
          <button
            type="button"
            onClick={onDecline}
            className="flex-1 rounded-full border border-slate-700 bg-slate-900/70 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-slate-500"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={onAccept}
            className="flex-1 rounded-full bg-cyan-400 px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300"
          >
            Accept Rematch
          </button>
        </div>
      </div>
    </div>
  );
}
