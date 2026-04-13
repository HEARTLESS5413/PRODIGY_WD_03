import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import GameBoard from '../components/GameBoard.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useMoveSound } from '../hooks/useMoveSound.js';
import { computeBestMove, createEmptyBoard, detectWinner, isDraw } from '../lib/game.js';

export default function BotGamePage() {
  const { user } = useAuth();
  const { playFinish, playMove } = useMoveSound();
  const botTimeoutRef = useRef(null);
  const [board, setBoard] = useState(createEmptyBoard());
  const [currentTurn, setCurrentTurn] = useState('X');
  const [status, setStatus] = useState('active');
  const [winnerLine, setWinnerLine] = useState([]);
  const [winnerSymbol, setWinnerSymbol] = useState(null);

  useEffect(() => {
    if (currentTurn !== 'O' || status !== 'active') {
      return;
    }

    botTimeoutRef.current = window.setTimeout(() => {
      setBoard((currentBoard) => {
        const nextBoard = [...currentBoard];
        const bestMove = computeBestMove(nextBoard, 'O', 'X');

        if (bestMove === -1) {
          return currentBoard;
        }

        nextBoard[bestMove] = 'O';
        playMove();

        const winner = detectWinner(nextBoard);

        if (winner) {
          setWinnerLine(winner.line);
          setWinnerSymbol(winner.symbol);
          setStatus('completed');
          playFinish();
        } else if (isDraw(nextBoard)) {
          setWinnerLine([]);
          setWinnerSymbol(null);
          setStatus('completed');
          playFinish();
        } else {
          setCurrentTurn('X');
        }

        return nextBoard;
      });
    }, 550);

    return () => {
      window.clearTimeout(botTimeoutRef.current);
    };
  }, [currentTurn, playFinish, playMove, status]);

  function handleMove(index) {
    if (status !== 'active' || currentTurn !== 'X' || board[index]) {
      return;
    }

    const nextBoard = [...board];
    nextBoard[index] = 'X';
    setBoard(nextBoard);
    playMove();

    const winner = detectWinner(nextBoard);

    if (winner) {
      setWinnerLine(winner.line);
      setWinnerSymbol(winner.symbol);
      setStatus('completed');
      playFinish();
      return;
    }

    if (isDraw(nextBoard)) {
      setWinnerLine([]);
      setWinnerSymbol(null);
      setStatus('completed');
      playFinish();
      return;
    }

    setCurrentTurn('O');
  }

  function resetGame() {
    window.clearTimeout(botTimeoutRef.current);
    setBoard(createEmptyBoard());
    setCurrentTurn('X');
    setStatus('active');
    setWinnerLine([]);
    setWinnerSymbol(null);
  }

  const statusLabel =
    status === 'active'
      ? currentTurn === 'X'
        ? `${user.username}, your move`
        : 'Bot is thinking...'
      : winnerSymbol
        ? winnerSymbol === 'X'
          ? `${user.username} wins!`
          : 'Bot wins'
        : 'Draw game';

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Link className="text-sm text-cyan-300 hover:text-cyan-200" to="/">
              ← Back to dashboard
            </Link>
            <h1 className="mt-2 text-2xl font-black text-white sm:mt-3 sm:text-4xl">Play with Bot</h1>
            <p className="mt-1 text-sm text-slate-400 sm:mt-2">
              Practice offline against a minimax-powered opponent.
            </p>
          </div>

          <button
            type="button"
            onClick={resetGame}
            className="rounded-full border border-cyan-400/40 bg-cyan-400/10 px-4 py-2.5 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/20 sm:px-5 sm:py-3"
          >
            Restart Match
          </button>
        </div>

        <div className="grid gap-5 sm:gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="glass-card rounded-2xl border border-slate-800/80 p-4 sm:rounded-[2rem] sm:p-6">
            <div className="mb-4 flex flex-col gap-2 sm:mb-6 sm:gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.32em] text-cyan-200 sm:text-sm">Offline Duel</p>
                <h2 className="mt-1 text-xl font-bold text-white sm:mt-2 sm:text-2xl">{statusLabel}</h2>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm text-slate-300 sm:rounded-2xl sm:px-4 sm:py-3">
                You are <span className="font-bold text-cyan-200">X</span> and the bot is{' '}
                <span className="font-bold text-cyan-200">O</span>.
              </div>
            </div>

            <div className="mx-auto max-w-xs sm:max-w-sm md:max-w-lg">
              <GameBoard
                board={board}
                disabled={status !== 'active' || currentTurn !== 'X'}
                onCellClick={handleMove}
                winningLine={winnerLine}
              />
            </div>
          </section>

          <aside className="glass-card rounded-2xl border border-slate-800/80 p-4 sm:rounded-[2rem] sm:p-6">
            <p className="text-lg font-semibold text-white sm:text-xl">How bot mode works</p>
            <div className="mt-4 space-y-3 text-sm leading-7 text-slate-300 sm:mt-5 sm:space-y-4">
              <div className="rounded-2xl border border-slate-800/80 bg-slate-950/40 p-3 sm:rounded-3xl sm:p-4">
                Every bot move is computed locally, so this mode works without waiting for the server.
              </div>
              <div className="rounded-2xl border border-slate-800/80 bg-slate-950/40 p-3 sm:rounded-3xl sm:p-4">
                The AI uses minimax, which means it will always choose the strongest available move.
              </div>
              <div className="rounded-2xl border border-slate-800/80 bg-slate-950/40 p-3 sm:rounded-3xl sm:p-4">
                Sound effects trigger on each move and when the match ends for a more tactile feel.
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
