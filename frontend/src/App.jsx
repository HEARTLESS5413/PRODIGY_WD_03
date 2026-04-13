import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { SocketProvider } from './contexts/SocketContext.jsx';
import AuthPage from './pages/AuthPage.jsx';
import BotGamePage from './pages/BotGamePage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import GamePage from './pages/GamePage.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/game/:gameId"
              element={
                <ProtectedRoute>
                  <GamePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/bot"
              element={
                <ProtectedRoute>
                  <BotGamePage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

