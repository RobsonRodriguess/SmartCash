import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { googleLogin, login, register, getMe } from '../services/api';

const AuthContext = createContext(null);

const TOKEN_KEY = 'scm_token';
const USER_KEY = 'scm_user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true); // verifica token salvo na inicialização

  // persiste auth info localmente
  const saveSession = useCallback((newToken, newUser) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }, []);

  // load session on mount
  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_KEY);
    const savedUser = localStorage.getItem(USER_KEY);

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      // fetch latest user data
      getMe()
        .then((freshUser) => setUser(freshUser))
        .catch(() => logout()) // invalid/expired token
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const handleGoogleLogin = async (credential) => {
    const data = await googleLogin(credential);
    saveSession(data.token, data.user);
    return data.user;
  };

  const handleLogin = async (email, password) => {
    const data = await login({ email, password });
    saveSession(data.token, data.user);
    return data.user;
  };

  const handleRegister = async (name, email, password) => {
    const data = await register({ name, email, password });
    saveSession(data.token, data.user);
    return data.user;
  };

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user,
        loginWithGoogle: handleGoogleLogin,
        loginWithEmail: handleLogin,
        registerWithEmail: handleRegister,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>');
  return ctx;
};
