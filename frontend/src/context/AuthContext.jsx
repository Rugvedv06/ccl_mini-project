import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as authService from '../services/auth';
import { setUnauthorizedHandler } from '../services/api';
import { ROLES } from '../utils/constants';

const AuthContext = createContext(null);

function userFromSession(session) {
  if (!session?.payload) return null;
  const { payload } = session;
  return {
    sub: payload.sub,
    email: payload.email || payload['cognito:username'] || '',
    name: payload.name || payload['cognito:username'] || '',
    groups: payload['cognito:groups'] || [],
    role: authService.roleFromPayload(payload),
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | authenticated | anonymous

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null);
      setStatus('anonymous');
    });
  }, []);

  useEffect(() => {
    let active = true;
    authService
      .getCurrentSession()
      .then((session) => {
        if (!active) return;
        setUser(userFromSession(session));
        setStatus(session ? 'authenticated' : 'anonymous');
      })
      .catch(() => {
        if (active) {
          setUser(null);
          setStatus('anonymous');
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const session = await authService.signIn(email, password);
    const nextUser = userFromSession(session);
    setUser(nextUser);
    setStatus('authenticated');
    return nextUser;
  }, []);

  const logout = useCallback(() => {
    authService.signOut();
    setUser(null);
    setStatus('anonymous');
  }, []);

  const value = useMemo(
    () => ({ user, status, login, logout, isStudent: user?.role === ROLES.STUDENT, isFaculty: user?.role === ROLES.FACULTY }),
    [user, status, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
