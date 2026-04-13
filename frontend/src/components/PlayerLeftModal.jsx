export default function PlayerLeftModal({ username, onReturn }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative z-10 mx-4 w-full max-w-sm animate-fade-up rounded-[2rem] border border-rose-400/30 bg-slate-950/95 p-8 text-center shadow-2xl backdrop-blur-xl">
        {/* Icon */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-rose-400/30 bg-rose-500/10">
          <span className="text-3xl">🚪</span>
        </div>

        <h3 className="mt-5 text-2xl font-bold text-white">Opponent Left</h3>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          <span className="font-semibold text-rose-200">{username}</span> has left the game.
          You win by forfeit!
        </p>

        <button
          type="button"
          onClick={onReturn}
          className="mt-7 w-full rounded-full bg-cyan-400 px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300"
        >
          Return to Dashboard
        </button>
      </div>
    </div>
  );
}
