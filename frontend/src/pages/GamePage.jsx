import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../api/client.js';
import ChatPanel from '../components/ChatPanel.jsx';
import GameBoard from '../components/GameBoard.jsx';
import PlayerLeftModal from '../components/PlayerLeftModal.jsx';
import RematchModal from '../components/RematchModal.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useSocket } from '../contexts/SocketContext.jsx';
import { useMoveSound } from '../hooks/useMoveSound.js';

export default function GamePage() {
  const navigate = useNavigate();
  const { gameId } = useParams();
  const { user } = useAuth();
  const {
    joinRoom,
    leaveGame,
    requestRematch,
    sendChatMessage,
    sendGameMove,
    sendTyping,
    socket,
  } = useSocket();
  const { playFinish, playMove } = useMoveSound();
  const [chatInput, setChatInput] = useState('');
  const [error, setError] = useState('');
  const [game, setGame] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [typingLabel, setTypingLabel] = useState('');
  const [playerLeft, setPlayerLeft] = useState(null);
  const [showRematchModal, setShowRematchModal] = useState(false);
  const [rematchDeclined, setRematchDeclined] = useState(false);
  const previousBoardRef = useRef([]);
  const previousStatusRef = useRef('');
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchGame() {
      try {
        const { data } = await api.get(`/games/${gameId}`);

        if (isMounted) {
          setGame(data.game);
        }
      } catch (requestError) {
        if (isMounted) {
          setError(requestError.response?.data?.message || 'Unable to load the game room.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchGame();
    joinRoom(gameId);

    return () => {
      isMounted = false;
    };
  }, [gameId, joinRoom]);

  useEffect(() => {
    if (!socket) {
      return undefined;
    }

    function handleGameUpdate(payload) {
      setGame(payload.game);
    }

    function handleChatMessage(message) {
      if (message.gameId !== gameId) {
        return;
      }

      setMessages((current) => [...current, message]);
    }

    function handleTyping(payload) {
      if (payload.gameId !== gameId) {
        return;
      }

      setTypingLabel(payload.isTyping ? `${payload.username} is typing...` : '');
    }

    function handleGameError(payload) {
      setError(payload.message);
    }

    function handlePlayerLeft(payload) {
      if (payload.userId !== user?.id) {
        setPlayerLeft({ username: payload.username });
        setGame(payload.game);
      }
    }

    socket.on('game:update', handleGameUpdate);
    socket.on('chatMessage', handleChatMessage);
    socket.on('typing', handleTyping);
    socket.on('game:error', handleGameError);
    socket.on('game:playerLeft', handlePlayerLeft);

    return () => {
      socket.off('game:update', handleGameUpdate);
      socket.off('chatMessage', handleChatMessage);
      socket.off('typing', handleTyping);
      socket.off('game:error', handleGameError);
      socket.off('game:playerLeft', handlePlayerLeft);
    };
  }, [gameId, socket, user?.id]);

  // Sound effects
  useEffect(() => {
    if (!game?.board) {
      return;
    }

    const previousBoard = previousBoardRef.current || [];
    const previousCount = previousBoard.filter(Boolean).length;
    const currentCount = game.board.filter(Boolean).length;

    if (currentCount > previousCount) {
      playMove();
    }

    if (previousStatusRef.current !== 'completed' && game.status === 'completed') {
      playFinish();
    }

    previousBoardRef.current = [...game.board];
    previousStatusRef.current = game.status;
  }, [game, playFinish, playMove]);

  // Show rematch modal when opponent votes and current user hasn't
  useEffect(() => {
    if (!game || game.status !== 'completed' || rematchDeclined) return;
    const votes = game.rematchVotes || [];
    const opponentVoted = votes.length > 0 && !votes.includes(user?.id);
    if (opponentVoted) {
      setShowRematchModal(true);
    } else {
      setShowRematchModal(false);
    }
  }, [game, user?.id, rematchDeclined]);

  // Reset declined state on new game
  useEffect(() => {
    if (game?.status === 'active') {
      setRematchDeclined(false);
      setPlayerLeft(null);
    }
  }, [game?.status]);

  const myPlayer = game?.players?.find((player) => player.userId === user?.id) || null;
  const opponent = game?.players?.find((player) => player.userId !== user?.id) || null;

  function handleMove(index) {
    if (!game || game.status !== 'active' || !myPlayer) {
      return;
    }

    sendGameMove(game.id, index);
  }

  function handleChatChange(event) {
    const nextValue = event.target.value;
    setChatInput(nextValue);
    sendTyping(gameId, nextValue.length > 0);
    window.clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = window.setTimeout(() => sendTyping(gameId, false), 1000);
  }

  function handleSendMessage(event) {
    event.preventDefault();

    if (!chatInput.trim()) {
      return;
    }

    sendChatMessage(gameId, chatInput.trim());
    setChatInput('');
    sendTyping(gameId, false);
  }

  function handleRematch() {
    requestRematch(gameId);
  }

  function handleLeaveGame() {
    leaveGame(gameId);
    navigate('/');
  }

  function handleAcceptRematch() {
    setShowRematchModal(false);
    requestRematch(gameId);
  }

  function handleDeclineRematch() {
    setShowRematchModal(false);
    setRematchDeclined(true);
  }

  const isMyTurn = Boolean(myPlayer && game?.currentTurn === myPlayer.symbol);
  const isGameOver = game?.status === 'completed' || game?.status === 'abandoned';
  const statusLabel = !game
    ? 'Loading room...'
    : game.status === 'abandoned'
      ? game.winnerId === user?.id
        ? 'You won — opponent left'
        : 'Game abandoned'
      : game.status === 'completed'
        ? game.winnerId
          ? game.winnerId === user.id
            ? 'You won the match'
            : `${opponent?.username || 'Opponent'} won the match`
          : 'The match ended in a draw'
        : game.status === 'active'
          ? isMyTurn
            ? 'Your move'
            : `${opponent?.username || 'Opponent'} is thinking`
          : 'Waiting for opponent...';

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 text-slate-200">
        <div className="glass-card rounded-3xl px-8 py-6">Loading game room...</div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 sm:px-6">
        <div className="glass-card max-w-lg rounded-2xl border border-slate-800/80 p-6 text-center sm:rounded-[2rem] sm:p-8">
          <p className="text-xl font-bold text-white sm:text-2xl">Room unavailable</p>
          <p className="mt-2 text-sm leading-6 text-slate-400 sm:mt-3">
            {error || 'This game could not be loaded. The room may have expired.'}
          </p>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="mt-5 rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 sm:mt-6"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Link className="text-sm text-cyan-300 hover:text-cyan-200" to="/">
              ← Back to dashboard
            </Link>
            <h1 className="mt-2 text-2xl font-black text-white sm:mt-3 sm:text-4xl">Game Room</h1>
            <p className="mt-1 text-sm text-slate-400 sm:mt-2">
              {game.mode === 'random' ? 'Random match found.' : 'Friend invite accepted.'} Room: {game.roomCode}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <StatusBadge isOnline={true} label={game.mode === 'random' ? 'Random' : 'Friend'} />
            {game.status === 'active' && (
              <button
                type="button"
                onClick={handleLeaveGame}
                className="rounded-full border border-rose-400/40 bg-rose-500/10 px-4 py-2.5 text-sm font-semibold text-rose-200 transition hover:border-rose-300 hover:bg-rose-500/20 sm:px-5 sm:py-3"
              >
                Leave Game
              </button>
            )}
            {isGameOver && (
              <button
                type="button"
                onClick={handleRematch}
                className="rounded-full border border-cyan-400/40 bg-cyan-400/10 px-4 py-2.5 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/20 sm:px-5 sm:py-3"
              >
                Request Rematch
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200 sm:mb-6 sm:rounded-3xl sm:px-5 sm:py-4">
            {error}
          </div>
        )}

        <div className="grid gap-5 sm:gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          {/* Game Section */}
          <section className="glass-card rounded-2xl border border-slate-800/80 p-4 sm:rounded-[2rem] sm:p-6">
            <div className="mb-4 flex flex-col gap-3 sm:mb-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.32em] text-cyan-200 sm:text-sm">Live Match</p>
                <h2 className="mt-1 text-xl font-bold text-white sm:mt-2 sm:text-3xl">{statusLabel}</h2>
                <p className="mt-1 text-xs text-slate-400 sm:mt-2 sm:text-sm">
                  {myPlayer?.symbol ? `You are ${myPlayer.symbol}.` : 'Assigning symbol...'}{' '}
                  {isGameOver && game.rematchVotes?.length > 0
                    ? `${game.rematchVotes.length}/2 rematch vote(s) registered.`
                    : ''}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <div className="rounded-2xl border border-slate-800/80 bg-slate-950/40 px-3 py-3 sm:rounded-3xl sm:px-4 sm:py-4">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500 sm:text-xs">You</p>
                  <p className="mt-1 text-sm font-semibold text-white sm:mt-2 sm:text-lg">{user.username}</p>
                  <p className="mt-0.5 text-xs text-cyan-200 sm:mt-1 sm:text-sm">Symbol {myPlayer?.symbol || '-'}</p>
                </div>
                <div className="rounded-2xl border border-slate-800/80 bg-slate-950/40 px-3 py-3 sm:rounded-3xl sm:px-4 sm:py-4">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500 sm:text-xs">Opponent</p>
                  <p className="mt-1 text-sm font-semibold text-white sm:mt-2 sm:text-lg">{opponent?.username || 'Waiting...'}</p>
                  <p className="mt-0.5 text-xs text-cyan-200 sm:mt-1 sm:text-sm">Symbol {opponent?.symbol || '-'}</p>
                </div>
              </div>
            </div>

            <div className="mx-auto max-w-xs sm:max-w-sm md:max-w-xl">
              <GameBoard
                board={game.board}
                disabled={!isMyTurn || game.status !== 'active'}
                onCellClick={handleMove}
                winningLine={game.winningLine}
              />
            </div>
          </section>

          {/* Chat Section */}
          <div className="min-h-[24rem] sm:min-h-[32rem]">
            <ChatPanel
              isSendingDisabled={!game || game.status === 'waiting'}
              messages={messages}
              onChange={handleChatChange}
              onSend={handleSendMessage}
              typingLabel={typingLabel}
              value={chatInput}
            />
          </div>
        </div>
      </div>

      {/* Rematch Modal */}
      {showRematchModal && (
        <RematchModal
          opponentName={opponent?.username || 'Opponent'}
          onAccept={handleAcceptRematch}
          onDecline={handleDeclineRematch}
        />
      )}

      {/* Player Left Modal */}
      {playerLeft && (
        <PlayerLeftModal
          username={playerLeft.username}
          onReturn={() => navigate('/')}
        />
      )}
    </main>
  );
}
