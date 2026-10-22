import { useQueryClient } from '@tanstack/react-query';
import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { setAuthToken, setUnauthorizedHandler } from '@/lib/api-client';
import { storage } from '@/lib/storage';

export interface Session {
  token: string;
  phone: string;
}

interface SessionContextValue {
  session: Session | null;
  isLoading: boolean;
  signIn(session: Session): Promise<void>;
  signOut(): Promise<void>;
}

const SESSION_KEY = 'miniledger.session';
const SessionContext = createContext<SessionContextValue | null>(null);

export function useSession() {
  const value = useContext(SessionContext);
  if (!value) throw new Error('useSession must be used within a SessionProvider');
  return value;
}

async function loadSession(): Promise<Session | null> {
  try {
    const raw = await storage.get(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSession().then((stored) => {
      setAuthToken(stored?.token ?? null);
      setSession(stored);
      setIsLoading(false);
    });
  }, []);

  const signIn = useCallback(async (next: Session) => {
    setAuthToken(next.token);
    setSession(next);
    await storage.set(SESSION_KEY, JSON.stringify(next));
  }, []);

  const signOut = useCallback(async () => {
    setAuthToken(null);
    setSession(null);
    queryClient.clear();
    await storage.remove(SESSION_KEY);
  }, [queryClient]);

  useEffect(() => {
    setUnauthorizedHandler(() => void signOut());
    return () => setUnauthorizedHandler(null);
  }, [signOut]);

  const value = useMemo(() => ({ session, isLoading, signIn, signOut }), [session, isLoading, signIn, signOut]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
