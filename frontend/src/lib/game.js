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

function minimax(board, isMaximizing, botSymbol, humanSymbol, depth = 0) {
  const winner = detectWinner(board);

  if (winner?.symbol === botSymbol) {
    return 10 - depth;
  }

  if (winner?.symbol === humanSymbol) {
    return depth - 10;
  }

  if (isDraw(board)) {
    return 0;
  }

  if (isMaximizing) {
    let bestScore = -Infinity;

    for (let index = 0; index < board.length; index += 1) {
      if (board[index]) {
        continue;
      }

      board[index] = botSymbol;
      bestScore = Math.max(bestScore, minimax(board, false, botSymbol, humanSymbol, depth + 1));
      board[index] = null;
    }

    return bestScore;
  }

  let bestScore = Infinity;

  for (let index = 0; index < board.length; index += 1) {
    if (board[index]) {
      continue;
    }

    board[index] = humanSymbol;
    bestScore = Math.min(bestScore, minimax(board, true, botSymbol, humanSymbol, depth + 1));
    board[index] = null;
  }

  return bestScore;
}

export function computeBestMove(board, botSymbol = 'O', humanSymbol = 'X') {
  let bestMove = -1;
  let bestScore = -Infinity;

  for (let index = 0; index < board.length; index += 1) {
    if (board[index]) {
      continue;
    }

    board[index] = botSymbol;
    const score = minimax(board, false, botSymbol, humanSymbol, 0);
    board[index] = null;

    if (score > bestScore) {
      bestScore = score;
      bestMove = index;
    }
  }

  return bestMove;
}

