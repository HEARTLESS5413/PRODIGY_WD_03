import { createContext, useContext, useEffect, useState } from 'react';
import api, { setAuthToken } from '../api/client.js';

const AuthContext = createContext(null);
const TOKEN_KEY = 'ttt_jwt_token';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(Boolean(token));

  useEffect(() => {
    setAuthToken(token);

    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    async function hydrateUser() {
      try {
        const { data } = await api.get('/auth/me');

        if (isMounted) {
          setUser(data.user);
        }
      } catch (error) {
        localStorage.removeItem(TOKEN_KEY);
        setAuthToken(null);

        if (isMounted) {
          setToken(null);
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    hydrateUser();

    return () => {
      isMounted = false;
    };
  }, [token]);

  function persistSession(session) {
    localStorage.setItem(TOKEN_KEY, session.token);
    setAuthToken(session.token);
    setToken(session.token);
    setUser(session.user);
  }

  async function register(credentials) {
    const { data } = await api.post('/auth/register', credentials);
    persistSession(data);
    return data;
  }

  async function login(credentials) {
    const { data } = await api.post('/auth/login', credentials);
    persistSession(data);
    return data;
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    setAuthToken(null);
    setToken(null);
    setUser(null);
  }

  async function refreshUser() {
    if (!token) {
      return null;
    }

    const { data } = await api.get('/auth/me');
    setUser(data.user);
    return data.user;
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: Boolean(token && user),
        isLoading,
        login,
        logout,
        refreshUser,
        register,
        token,
        user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error('useAuth must be used inside AuthProvider.');
  }

  return value;
}

