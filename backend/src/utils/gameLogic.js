export const WINNING_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

export function createEmptyBoard() {
  return Array(9).fill(null);
}

export function detectWinner(board) {
  for (const line of WINNING_LINES) {
    const [a, b, c] = line;

    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return {
        line,
        symbol: board[a],
      };
    }
  }

  return null;
}

export function isDraw(board) {
  return board.every(Boolean) && !detectWinner(board);
}

function resolveId(value) {
  if (!value) {
    return null;
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value.toString === 'function') {
    return value.toString();
  }

  return null;
}

export function serializeGame(game) {
  const plain = typeof game.toObject === 'function' ? game.toObject() : game;
  const winnerId = resolveId(plain.winner?._id || plain.winner);

  return {
    id: resolveId(plain._id),
    roomCode: plain.roomCode,
    mode: plain.mode,
    board: plain.board,
    currentTurn: plain.currentTurn,
    status: plain.status,
    winnerId,
    winningLine: plain.winningLine || [],
    rematchVotes: (plain.rematchVotes || []).map((vote) => resolveId(vote?._id || vote)),
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
    players: (plain.players || []).map((player) => ({
      userId: resolveId(player.user?._id || player.user),
      username: player.username,
      symbol: player.symbol,
    })),
  };
}

