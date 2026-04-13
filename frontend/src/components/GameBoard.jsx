const SYMBOL_STYLES = {
  X: 'text-cyan-200 drop-shadow-[0_0_8px_rgba(103,232,249,0.4)]',
  O: 'text-rose-300 drop-shadow-[0_0_8px_rgba(253,164,175,0.4)]',
};

export default function GameBoard({ board, disabled, onCellClick, winningLine = [] }) {
  const winSet = new Set(winningLine);

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3">
      {board.map((cell, index) => {
        const isWinCell = winSet.has(index);

        return (
          <button
            key={index}
            type="button"
            disabled={disabled || Boolean(cell)}
            onClick={() => onCellClick(index)}
            className={`flex aspect-square min-h-[4rem] items-center justify-center rounded-xl border text-3xl font-extrabold transition-all duration-200 sm:min-h-[5rem] sm:rounded-2xl sm:text-4xl md:text-5xl ${
              isWinCell
                ? 'border-cyan-400/40 bg-cyan-400/10 ring-2 ring-cyan-400/30'
                : 'border-slate-700/60 bg-slate-900/50'
            } ${
              cell
                ? (SYMBOL_STYLES[cell] || '')
                : 'hover:border-cyan-400/50 hover:bg-slate-800/60 cursor-pointer'
            } disabled:cursor-default`}
          >
            {cell || ''}
          </button>
        );
      })}
    </div>
  );
}
