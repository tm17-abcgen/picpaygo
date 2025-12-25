import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { getCredits, getUser, login as apiLogin, logout as apiLogout, register as apiRegister } from '@/services/api';

interface User {
  email: string;
  isVerified?: boolean;
}

interface CreditsContextType {
  credits: number;
  isLoggedIn: boolean;
  user: User | null;
  loading: boolean;
  refreshCredits: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<{ verificationRequired: boolean }>;
  logout: () => Promise<void>;
}

const CreditsContext = createContext<CreditsContextType | undefined>(undefined);

export function CreditsProvider({ children }: { children: ReactNode }) {
  const [credits, setCredits] = useState(0);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshCredits = useCallback(async () => {
    try {
      const info = await getCredits();
      setCredits(info.balance);
    } catch (error) {
      console.error('Failed to fetch credits:', error);
    }
  }, []);

  const loadUserAndCredits = useCallback(async () => {
    setLoading(true);
    try {
      const [userData, creditsInfo] = await Promise.all([
        getUser(),
        getCredits(),
      ]);
      setUser(userData);
      setCredits(creditsInfo.balance);
    } catch (error) {
      console.error('Failed to load user data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUserAndCredits();
  }, [loadUserAndCredits]);

  const login = async (email: string, password: string) => {
    await apiLogin(email, password);
    await loadUserAndCredits();
  };

  const register = async (email: string, password: string) => {
    const result = await apiRegister(email, password);
    await loadUserAndCredits();
    return result;
  };

  const logout = async () => {
    await apiLogout();
    await loadUserAndCredits();
  };

  return (
    <CreditsContext.Provider
      value={{
        credits,
        isLoggedIn: !!user,
        user,
        loading,
        refreshCredits,
        login,
        register,
        logout,
      }}
    >
      {children}
    </CreditsContext.Provider>
  );
}

export function useCredits() {
  const context = useContext(CreditsContext);
  if (context === undefined) {
    throw new Error('useCredits must be used within a CreditsProvider');
  }
  return context;
}
