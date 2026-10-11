import { createContext, type ReactNode, useContext, useEffect, useState } from 'react';

import { logout, restoreSession } from '@/features/auth/api';
import { setSessionExpiredHandler } from '@/shared/api/client';
import { type UserProfile } from '@/shared/api/types';

type Session = {
  profile: UserProfile | null;
  restoring: boolean;
  restoreError: string;
  setProfile: (profile: UserProfile | null) => void;
  restore: () => Promise<void>;
  signOut: () => Promise<void>;
};

const SessionContext = createContext<Session | null>(null);

const errorText = (error: unknown) =>
  error instanceof Error ? error.message : 'Не вдалося відновити вхід.';

export function SessionProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [restoring, setRestoring] = useState(true);
  const [restoreError, setRestoreError] = useState('');

  useEffect(() => {
    setSessionExpiredHandler(() => setProfile(null));
    let active = true;
    restoreSession()
      .then((value) => {
        if (active) setProfile(value);
      })
      .catch((error) => {
        if (active) setRestoreError(errorText(error));
      })
      .finally(() => {
        if (active) setRestoring(false);
      });
    return () => {
      active = false;
      setSessionExpiredHandler();
    };
  }, []);

  async function restore() {
    setRestoring(true);
    setRestoreError('');
    try {
      setProfile(await restoreSession());
    } catch (error) {
      setRestoreError(errorText(error));
    } finally {
      setRestoring(false);
    }
  }

  async function signOut() {
    await logout();
    setProfile(null);
  }

  return (
    <SessionContext.Provider
      value={{ profile, restoring, restoreError, setProfile, restore, signOut }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const session = useContext(SessionContext);
  if (!session) throw new Error('useSession must be used inside SessionProvider');
  return session;
}
