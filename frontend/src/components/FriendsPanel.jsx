import StatusBadge from './StatusBadge.jsx';

export default function FriendsPanel({
  friends,
  onChat,
  onInvite,
  pendingInvite,
  selectedMode,
  unreadCounts,
}) {
  if (!friends.length) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-700/80 bg-slate-900/40 px-4 py-6 text-sm text-slate-400">
        No friends yet. Search for users above to send the first request.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {friends.map((friend) => {
        const invitePending = pendingInvite?.toUserId === friend.id;
        const unread = unreadCounts?.[friend.id] || 0;

        return (
          <div
            key={friend.id}
            className="flex flex-col gap-3 rounded-3xl border border-slate-800/80 bg-slate-950/40 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="text-base font-semibold text-white">{friend.username}</p>
              <div className="mt-2">
                <StatusBadge isOnline={friend.isOnline} />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {/* Chat button with unread badge */}
              <button
                type="button"
                onClick={() => onChat(friend)}
                className="relative rounded-full border border-slate-600/60 bg-slate-800/40 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:bg-slate-700/40"
              >
                💬 Chat
                {unread > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-cyan-400 px-1 text-[10px] font-bold text-slate-950">
                    {unread > 99 ? '99+' : unread}
                  </span>
                )}
              </button>

              {selectedMode === 'friend' ? (
                <button
                  type="button"
                  onClick={() => onInvite(friend.id)}
                  disabled={!friend.isOnline || invitePending}
                  className="rounded-full border border-cyan-400/40 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:border-cyan-300 hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {invitePending ? 'Waiting...' : 'Invite to Play'}
                </button>
              ) : (
                <span className="hidden text-sm text-slate-400 sm:inline">
                  Switch to Play with Friend mode to invite.
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
