import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function AuthPage() {
  const navigate = useNavigate();
  const { isAuthenticated, login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({
    password: '',
    username: '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const payload = {
        password: form.password,
        username: form.username.trim().toLowerCase(),
      };

      if (mode === 'login') {
        await login(payload);
      } else {
        await register(payload);
      }

      navigate('/');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to complete authentication.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8 sm:px-6 sm:py-10">
      <div className="absolute inset-0 grid-board opacity-40" />
      <div className="absolute -left-20 top-8 h-48 w-48 rounded-full bg-cyan-400/20 blur-3xl sm:h-72 sm:w-72" />
      <div className="absolute bottom-0 right-0 h-56 w-56 rounded-full bg-sky-400/15 blur-3xl sm:h-80 sm:w-80" />

      <section className="glass-card relative z-10 w-full max-w-5xl overflow-hidden rounded-2xl border border-slate-800/80 sm:rounded-[2rem]">
        <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
          {/* Left panel — hidden on small mobile, shown from sm up */}
          <div className="hidden border-b border-slate-800/80 bg-slate-950/50 p-6 sm:flex sm:flex-col sm:justify-between sm:p-8 lg:border-b-0 lg:border-r lg:p-12">
            <div>
              <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.3em] text-cyan-200 sm:px-4 sm:py-2 sm:text-xs">
                Real-Time Multiplayer
              </span>
              <h1 className="mt-5 max-w-md text-balance text-3xl font-black tracking-tight text-white sm:mt-6 md:text-4xl lg:text-5xl">
                Step into a neon Tic-Tac-Toe arena.
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300 sm:mt-5 sm:text-base">
                Build your network, challenge friends, get matched with random players, or train offline against a bot with perfect play.
              </p>
            </div>

            <div className="mt-8 grid gap-3 sm:mt-10 sm:gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-800/70 bg-slate-900/50 p-3 sm:rounded-3xl sm:p-4">
                <p className="text-sm font-semibold text-cyan-100">Live Invites</p>
                <p className="mt-1 text-xs text-slate-400 sm:mt-2 sm:text-sm">Friends can challenge you in real time.</p>
              </div>
              <div className="rounded-2xl border border-slate-800/70 bg-slate-900/50 p-3 sm:rounded-3xl sm:p-4">
                <p className="text-sm font-semibold text-cyan-100">Fast Matchmaking</p>
                <p className="mt-1 text-xs text-slate-400 sm:mt-2 sm:text-sm">Jump into a random game in one click.</p>
              </div>
              <div className="rounded-2xl border border-slate-800/70 bg-slate-900/50 p-3 sm:rounded-3xl sm:p-4">
                <p className="text-sm font-semibold text-cyan-100">Chat + Presence</p>
                <p className="mt-1 text-xs text-slate-400 sm:mt-2 sm:text-sm">See who is online and talk mid-match.</p>
              </div>
            </div>
          </div>

          {/* Right panel — form */}
          <div className="p-5 sm:p-8 lg:p-12">
            <div className="inline-flex rounded-full border border-slate-800 bg-slate-950/70 p-1">
              <button
                type="button"
                onClick={() => setMode('login')}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition sm:px-5 ${
                  mode === 'login' ? 'bg-cyan-400 text-slate-950' : 'text-slate-300'
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => setMode('register')}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition sm:px-5 ${
                  mode === 'register' ? 'bg-cyan-400 text-slate-950' : 'text-slate-300'
                }`}
              >
                Register
              </button>
            </div>

            <div className="mt-6 sm:mt-8">
              <h2 className="text-2xl font-bold text-white sm:text-3xl">
                {mode === 'login' ? 'Welcome back' : 'Create your account'}
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                {mode === 'login'
                  ? 'Log in with your username and password.'
                  : 'Choose a unique username to enter the lobby.'}
              </p>
            </div>

            <form className="mt-6 space-y-4 sm:mt-8 sm:space-y-5" onSubmit={handleSubmit}>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-300 sm:mb-2" htmlFor="username">
                  Username
                </label>
                <input
                  id="username"
                  value={form.username}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, username: event.target.value }))
                  }
                  placeholder="e.g. neonplayer"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-white outline-none transition focus:border-cyan-400 sm:rounded-2xl"
                  required
                  minLength={3}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-300 sm:mb-2" htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, password: event.target.value }))
                  }
                  placeholder="At least 6 characters"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-white outline-none transition focus:border-cyan-400 sm:rounded-2xl"
                  required
                  minLength={6}
                />
              </div>

              {error && (
                <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200 sm:rounded-2xl">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-xl bg-cyan-400 px-4 py-3 text-base font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60 sm:rounded-2xl"
              >
                {isSubmitting ? 'Please wait...' : mode === 'login' ? 'Login' : 'Register'}
              </button>
            </form>

            {/* Mobile-only feature highlights */}
            <div className="mt-6 grid grid-cols-3 gap-2 sm:hidden">
              <div className="rounded-xl border border-slate-800/60 bg-slate-900/40 p-2.5 text-center">
                <p className="text-[10px] font-semibold text-cyan-200">Invites</p>
              </div>
              <div className="rounded-xl border border-slate-800/60 bg-slate-900/40 p-2.5 text-center">
                <p className="text-[10px] font-semibold text-cyan-200">Matchmaking</p>
              </div>
              <div className="rounded-xl border border-slate-800/60 bg-slate-900/40 p-2.5 text-center">
                <p className="text-[10px] font-semibold text-cyan-200">Chat</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
