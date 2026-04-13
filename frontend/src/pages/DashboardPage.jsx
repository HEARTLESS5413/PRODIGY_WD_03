import { startTransition, useDeferredValue, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client.js';
import DirectChat from '../components/DirectChat.jsx';
import DmToast from '../components/DmToast.jsx';
import FriendSearchResults from '../components/FriendSearchResults.jsx';
import FriendsPanel from '../components/FriendsPanel.jsx';
import ModeTile from '../components/ModeTile.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useSocket } from '../contexts/SocketContext.jsx';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { logout, refreshUser, user } = useAuth();
  const {
    acceptInvite,
    activeGame,
    clearActiveGame,
    clearDMNotification,
    dismissInvite,
    dmNotification,
    dmUnread,
    incomingInvites,
    isConnected,
    joinMatchmaking,
    leaveMatchmaking,
    matchmakingState,
    onlineUserIds,
    pendingInvite,
    rejectInvite,
    sendInvite,
  } = useSocket();
  const [mode, setMode] = useState('friend');
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isRequestPending, setIsRequestPending] = useState(false);
  const [error, setError] = useState('');
  const [chatFriend, setChatFriend] = useState(null);

  useEffect(() => {
    if (!activeGame?.id) {
      return;
    }

    navigate(`/game/${activeGame.id}`);
    clearActiveGame();
  }, [activeGame, clearActiveGame, navigate]);

  useEffect(() => {
    const trimmedQuery = deferredQuery.trim();

    if (!trimmedQuery) {
      setResults([]);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setIsSearching(true);

      try {
        const { data } = await api.get('/users/search', {
          params: { q: trimmedQuery },
          signal: controller.signal,
        });

        startTransition(() => {
          setResults(data.users || []);
        });
      } catch (requestError) {
        if (requestError.name !== 'CanceledError') {
          setError(requestError.response?.data?.message || 'Unable to search users right now.');
        }
      } finally {
        setIsSearching(false);
      }
    }, 220);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [deferredQuery]);

  useEffect(() => {
    return () => {
      leaveMatchmaking();
    };
  }, [leaveMatchmaking]);

  const onlineSet = new Set(onlineUserIds);
  const friends = (user?.friends || []).map((friend) => ({
    ...friend,
    isOnline: onlineSet.has(friend.id),
  }));
  const friendRequests = user?.friendRequests || [];

  async function handleSendFriendRequest(userId) {
    setError('');
    setIsRequestPending(true);

    try {
      await api.post(`/friends/request/${userId}`);
      setResults((current) =>
        current.map((entry) =>
          entry.id === userId ? { ...entry, requestStatus: 'outgoing' } : entry
        )
      );
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to send friend request.');
    } finally {
      setIsRequestPending(false);
    }
  }

  async function handleAcceptFriendRequest(userId) {
    setError('');

    try {
      await api.post(`/friends/request/${userId}/accept`);
      await refreshUser();
      setResults((current) =>
        current.map((entry) =>
          entry.id === userId ? { ...entry, requestStatus: 'friends' } : entry
        )
      );
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to accept friend request.');
    }
  }

  async function handleRejectFriendRequest(userId) {
    setError('');

    try {
      await api.post(`/friends/request/${userId}/reject`);
      await refreshUser();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to reject friend request.');
    }
  }

  function handleInviteFriend(friendId) {
    setError('');
    sendInvite(friendId);
  }

  function handlePlayRandom() {
    setMode('random');
    setError('');
    joinMatchmaking();
  }

  function handlePlayWithFriend() {
    setMode('friend');
    leaveMatchmaking();
  }

  function handlePlayWithBot() {
    leaveMatchmaking();
    navigate('/bot');
  }

  async function acceptLiveInvite(inviteId) {
    acceptInvite(inviteId);
    dismissInvite(inviteId);
  }

  async function rejectLiveInvite(inviteId) {
    rejectInvite(inviteId);
    dismissInvite(inviteId);
  }

  function handleOpenChat(friend) {
    setChatFriend(friend);
  }

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-7xl">
        <header className="glass-card animate-fade-up rounded-2xl border border-slate-800/80 px-4 py-5 sm:rounded-[2rem] sm:px-6 sm:py-6 md:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.32em] text-cyan-200 sm:text-sm">Dashboard</p>
              <h1 className="mt-2 truncate text-2xl font-black text-white sm:mt-3 sm:text-4xl">Welcome, {user?.username}</h1>
              <p className="mt-1 text-sm text-slate-400 sm:mt-2 sm:max-w-2xl">
                Search players, manage your social lobby, queue for a match, or invite a friend into a live room.
              </p>
            </div>

            <div className="flex flex-row items-center gap-3">
              <StatusBadge isOnline={isConnected} label={isConnected ? 'Socket Live' : 'Reconnecting'} />
              <button
                type="button"
                onClick={logout}
                className="rounded-full border border-slate-700 bg-slate-950/60 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-slate-500 sm:px-5 sm:py-3"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        {error && (
          <div className="mt-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200 sm:mt-6 sm:rounded-3xl sm:px-5 sm:py-4">
            {error}
          </div>
        )}

        <section className="mt-6 grid gap-3 sm:mt-8 sm:gap-4 md:grid-cols-3">
          <ModeTile
            active={mode === 'friend'}
            title="Play with Friend"
            description="Choose someone from your friends list and send a live invite."
            onClick={handlePlayWithFriend}
          />
          <ModeTile
            active={mode === 'random'}
            title="Play with Random"
            description="Enter matchmaking and get paired automatically."
            onClick={handlePlayRandom}
          />
          <ModeTile
            active={false}
            title="Play with Bot"
            description="Practice offline against an unbeatable minimax bot."
            onClick={handlePlayWithBot}
          />
        </section>

        <section className="mt-6 grid gap-5 sm:mt-8 sm:gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-5 sm:space-y-6">
            <div className="glass-card rounded-2xl border border-slate-800/80 p-4 sm:rounded-[2rem] sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-lg font-semibold text-white sm:text-xl">Find Players</p>
                  <p className="mt-1 text-sm text-slate-400">
                    Search by username and send requests to expand your roster.
                  </p>
                </div>
                <div className="text-sm text-slate-500">{isSearching ? 'Searching...' : `${results.length} result(s)`}</div>
              </div>

              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search usernames..."
                className="mt-4 w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-white outline-none transition focus:border-cyan-400 sm:mt-5 sm:rounded-2xl"
              />

              <div className="mt-4 sm:mt-5">
                <FriendSearchResults
                  isSubmitting={isRequestPending}
                  onAccept={handleAcceptFriendRequest}
                  onSendRequest={handleSendFriendRequest}
                  results={results}
                />
              </div>
            </div>

            <div className="glass-card rounded-2xl border border-slate-800/80 p-4 sm:rounded-[2rem] sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-lg font-semibold text-white sm:text-xl">Friends List</p>
                  <p className="mt-1 text-sm text-slate-400">
                    Invite any online friend directly from here.
                  </p>
                </div>
                <span className="rounded-full border border-slate-800 bg-slate-950/50 px-4 py-2 text-sm text-slate-300">
                  {friends.length} friend(s)
                </span>
              </div>

              <div className="mt-4 sm:mt-5">
                <FriendsPanel
                  friends={friends}
                  onChat={handleOpenChat}
                  onInvite={handleInviteFriend}
                  pendingInvite={pendingInvite}
                  selectedMode={mode}
                  unreadCounts={dmUnread}
                />
              </div>
            </div>
          </div>

          <div className="space-y-5 sm:space-y-6">
            <div className="glass-card rounded-2xl border border-slate-800/80 p-4 sm:rounded-[2rem] sm:p-6">
              <p className="text-lg font-semibold text-white sm:text-xl">Friend Requests</p>
              <p className="mt-1 text-sm text-slate-400">
                Accept or reject incoming requests to build your lobby.
              </p>

              <div className="mt-4 space-y-3 sm:mt-5">
                {friendRequests.length ? (
                  friendRequests.map((request) => (
                    <div
                      key={request.from.id}
                      className="rounded-2xl border border-slate-800/80 bg-slate-950/40 px-4 py-4 sm:rounded-3xl"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-white">{request.from.username}</p>
                          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                            Requested {new Date(request.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <StatusBadge isOnline={onlineSet.has(request.from.id)} />
                      </div>

                      <div className="mt-3 flex gap-2 sm:mt-4 sm:gap-3">
                        <button
                          type="button"
                          onClick={() => handleAcceptFriendRequest(request.from.id)}
                          className="rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRejectFriendRequest(request.from.id)}
                          className="rounded-full border border-slate-700 bg-slate-950/70 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-500"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-700/80 bg-slate-900/40 px-4 py-6 text-sm text-slate-400 sm:rounded-3xl">
                    No pending friend requests.
                  </div>
                )}
              </div>
            </div>

            <div className="glass-card rounded-2xl border border-slate-800/80 p-4 sm:rounded-[2rem] sm:p-6">
              <p className="text-lg font-semibold text-white sm:text-xl">Live Lobby</p>
              <p className="mt-1 text-sm text-slate-400">
                This card reflects matchmaking, sent invites, and incoming match requests.
              </p>

              <div className="mt-4 space-y-3 sm:mt-5 sm:space-y-4">
                {mode === 'random' && (
                  <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-4 sm:rounded-3xl">
                    <p className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-200">
                      Random Queue
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-200 sm:mt-3">
                      {matchmakingState.message || 'Press Play with Random to enter the queue.'}
                    </p>
                    <div className="mt-3 flex gap-2 sm:mt-4 sm:gap-3">
                      <button
                        type="button"
                        onClick={handlePlayRandom}
                        className="rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
                      >
                        Queue Up
                      </button>
                      <button
                        type="button"
                        onClick={leaveMatchmaking}
                        className="rounded-full border border-slate-700 bg-slate-950/70 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-500"
                      >
                        Leave Queue
                      </button>
                    </div>
                  </div>
                )}

                {pendingInvite && (
                  <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-4 sm:rounded-3xl">
                    <p className="text-sm font-semibold uppercase tracking-[0.28em] text-amber-200">
                      Invite Sent
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-200 sm:mt-3">
                      Waiting for your friend to accept the game invite...
                    </p>
                    {pendingInvite.error && (
                      <p className="mt-2 text-sm text-rose-200 sm:mt-3">{pendingInvite.error}</p>
                    )}
                  </div>
                )}

                {incomingInvites.length ? (
                  incomingInvites.map((invite) => (
                    <div
                      key={invite.inviteId}
                      className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-4 sm:rounded-3xl"
                    >
                      <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-200">
                        Game Invite
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-200 sm:mt-3">
                        <span className="font-semibold text-white">{invite.fromUsername}</span> wants to play Tic-Tac-Toe with you.
                      </p>
                      <div className="mt-3 flex gap-2 sm:mt-4 sm:gap-3">
                        <button
                          type="button"
                          onClick={() => acceptLiveInvite(invite.inviteId)}
                          className="rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          onClick={() => rejectLiveInvite(invite.inviteId)}
                          className="rounded-full border border-slate-700 bg-slate-950/70 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-500"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-700/80 bg-slate-900/40 px-4 py-6 text-sm text-slate-400 sm:rounded-3xl">
                    No live invites right now.
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Direct Chat Modal */}
      {chatFriend && (
        <DirectChat
          friend={chatFriend}
          onClose={() => setChatFriend(null)}
        />
      )}

      {/* DM Toast Notification */}
      <DmToast
        notification={dmNotification}
        onDismiss={clearDMNotification}
      />
    </main>
  );
}
