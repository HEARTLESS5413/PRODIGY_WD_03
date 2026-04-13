export default function ModeTile({ active, description, onClick, title }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`glass-card rounded-3xl border px-5 py-5 text-left transition duration-200 hover:-translate-y-1 ${
        active
          ? 'border-cyan-400/50 shadow-neon'
          : 'border-slate-800/80 hover:border-slate-600'
      }`}
    >
      <p className="text-lg font-semibold text-white">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-300">{description}</p>
    </button>
  );
}

