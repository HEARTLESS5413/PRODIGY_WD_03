import StatusBadge from './StatusBadge.jsx';

export default function FriendSearchResults({
  isSubmitting,
  onAccept,
  onSendRequest,
  results,
}) {
  if (!results.length) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-700/80 bg-slate-900/40 px-4 py-6 text-sm text-slate-400">
        Search by username to discover players and grow your friends list.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {results.map((result) => (
        <div
          key={result.id}
          className="flex flex-col gap-3 rounded-3xl border border-slate-800/80 bg-slate-950/40 px-4 py-4 md:flex-row md:items-center md:justify-between"
        >
          <div>
            <p className="text-base font-semibold text-white">{result.username}</p>
            <div className="mt-2">
              <StatusBadge isOnline={result.isOnline} />
            </div>
          </div>

          {result.requestStatus === 'friends' && (
            <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-200">
              Friends
            </span>
          )}

          {result.requestStatus === 'outgoing' && (
            <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-200">
              Request Sent
            </span>
          )}

          {result.requestStatus === 'incoming' && (
            <button
              type="button"
              onClick={() => onAccept(result.id)}
              className="rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
            >
              Accept Request
            </button>
          )}

          {result.requestStatus === 'none' && (
            <button
              type="button"
              onClick={() => onSendRequest(result.id)}
              disabled={isSubmitting}
              className="rounded-full border border-cyan-400/40 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:border-cyan-300 hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Add Friend
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

