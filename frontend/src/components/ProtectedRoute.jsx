import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-slate-100">
        <div className="glass-card animate-pulse-soft rounded-3xl px-8 py-6 text-center">
          Loading your arena...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return children;
}
