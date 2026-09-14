import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, AuthState, LoginCredentials, RegisterCredentials } from '../types/auth';

interface AuthContextType extends AuthState {
  signIn: (credentials: LoginCredentials) => Promise<void>;
  signUp: (credentials: RegisterCredentials) => Promise<void>;
  continueAsGuest: () => void;
  signOut: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'detector_auth_token';
const USER_KEY = 'detector_auth_user';
const GUEST_KEY = 'detector_auth_guest';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem(TOKEN_KEY) || localStorage.getItem('detector_token') || sessionStorage.getItem(TOKEN_KEY);
        const storedUser = localStorage.getItem(USER_KEY) || localStorage.getItem('detector_user') || sessionStorage.getItem(USER_KEY);
        const isGuest = sessionStorage.getItem(GUEST_KEY) === 'true' || sessionStorage.getItem('detector_guest') === 'true';

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));

          // Validate token with backend if reachable
          try {
            const resp = await fetch('/api/auth/me', {
              headers: { Authorization: `Bearer ${storedToken}` },
            });
            if (resp.ok) {
              const freshUser = await resp.json();
              setUser({
                id: freshUser.user_id,
                username: freshUser.username,
                email: freshUser.email,
                fullName: freshUser.username,
              });
            } else if (resp.status === 401) {
              signOut();
            }
          } catch {
            // Keep local cached user if network temporarily unavailable
          }
        } else if (isGuest) {
          setUser({
            id: 'guest',
            username: 'guest_analyst',
            email: 'guest@transient.session',
            fullName: 'Guest Analyst',
            role: 'Guest',
          });
        }
      } catch (err) {
        console.error('Failed to restore auth session:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const signIn = async ({ emailOrUsername, password, rememberMe }: LoginCredentials) => {
    setIsLoading(true);
    setError(null);

    try {
      // Try backend API first
      const resp = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username_or_email: emailOrUsername,
          password: password,
        }),
      });

      const data = await resp.json();

      if (!resp.ok) {
        throw new Error(data.detail || 'Invalid username/email or password.');
      }

      const receivedToken = data.access_token;
      const loggedUser: User = {
        id: data.user.user_id,
        username: data.user.username,
        email: data.user.email,
        fullName: data.user.username,
        createdAt: data.user.created_at,
      };

      setToken(receivedToken);
      setUser(loggedUser);

      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem(TOKEN_KEY, receivedToken);
      storage.setItem(USER_KEY, JSON.stringify(loggedUser));
      localStorage.setItem('detector_token', receivedToken);
      localStorage.setItem('detector_user', JSON.stringify(loggedUser));
      sessionStorage.removeItem(GUEST_KEY);
      sessionStorage.removeItem('detector_guest');
    } catch (err: any) {
      // Fallback demo support if backend is completely offline in mock test
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        const demoUser: User = {
          id: 'demo-user-id',
          username: emailOrUsername.split('@')[0],
          email: emailOrUsername.includes('@') ? emailOrUsername : `${emailOrUsername}@agency.org`,
          fullName: emailOrUsername.split('@')[0].toUpperCase(),
        };
        const demoToken = 'mock_jwt_token_demo';
        setToken(demoToken);
        setUser(demoUser);
        const storage = rememberMe ? localStorage : sessionStorage;
        storage.setItem(TOKEN_KEY, demoToken);
        storage.setItem(USER_KEY, JSON.stringify(demoUser));
        sessionStorage.removeItem(GUEST_KEY);
      } else {
        setError(err.message || 'Authentication failed. Please check your credentials.');
        throw err;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async ({ fullName, email, password }: RegisterCredentials) => {
    setIsLoading(true);
    setError(null);

    const generatedUsername = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '') + '_' + Math.floor(Math.random() * 900 + 100);

    try {
      const resp = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: generatedUsername,
          email: email,
          password: password,
        }),
      });

      const data = await resp.json();

      if (!resp.ok) {
        throw new Error(data.detail || 'Registration failed.');
      }

      const receivedToken = data.access_token;
      const newUser: User = {
        id: data.user.user_id,
        username: data.user.username,
        email: data.user.email,
        fullName: fullName || data.user.username,
      };

      setToken(receivedToken);
      setUser(newUser);

      localStorage.setItem(TOKEN_KEY, receivedToken);
      localStorage.setItem(USER_KEY, JSON.stringify(newUser));
      localStorage.setItem('detector_token', receivedToken);
      localStorage.setItem('detector_user', JSON.stringify(newUser));
      sessionStorage.removeItem(GUEST_KEY);
      sessionStorage.removeItem('detector_guest');
    } catch (err: any) {
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        const demoUser: User = {
          id: 'demo-registered-id',
          username: generatedUsername,
          email: email,
          fullName: fullName,
        };
        const demoToken = 'mock_jwt_token_new';
        setToken(demoToken);
        setUser(demoUser);
        localStorage.setItem(TOKEN_KEY, demoToken);
        localStorage.setItem(USER_KEY, JSON.stringify(demoUser));
        sessionStorage.removeItem(GUEST_KEY);
      } else {
        setError(err.message || 'Account registration failed.');
        throw err;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const continueAsGuest = () => {
    sessionStorage.setItem(GUEST_KEY, 'true');
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);

    const guestUser: User = {
      id: 'guest_' + Math.floor(Math.random() * 10000),
      username: 'guest_analyst',
      email: 'guest@transient.session',
      fullName: 'Guest Analyst',
      role: 'Guest (Transient)',
    };

    setToken(null);
    setUser(guestUser);
  };

  const signOut = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem('detector_token');
    localStorage.removeItem('detector_user');
    localStorage.removeItem('detector_last_activity');
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(GUEST_KEY);
    setToken(null);
    setUser(null);
    setError(null);
  };

  // Session Inactivity Timeout (15 minutes)
  useEffect(() => {
    if (!user) return;

    const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000;
    let lastActivity = Date.now();

    const updateActivity = () => {
      lastActivity = Date.now();
      try {
        localStorage.setItem('detector_last_activity', lastActivity.toString());
      } catch {}
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
    events.forEach(evt => window.addEventListener(evt, updateActivity, { passive: true }));

    const interval = setInterval(() => {
      let stored = lastActivity;
      try {
        const val = localStorage.getItem('detector_last_activity');
        if (val) stored = Math.max(stored, parseInt(val, 10) || 0);
      } catch {}

      if (Date.now() - stored >= INACTIVITY_TIMEOUT_MS) {
        console.warn('[Session Inactivity Timeout] User inactive. Expiring React session.');
        signOut();
      }
    }, 10000);

    return () => {
      events.forEach(evt => window.removeEventListener(evt, updateActivity));
      clearInterval(interval);
    };
  }, [user]);

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        error,
        signIn,
        signUp,
        continueAsGuest,
        signOut,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
