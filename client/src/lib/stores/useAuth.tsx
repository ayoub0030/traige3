import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

export interface User {
  id: number;
  username: string;
  coins: number;
  rank: string;
  language: string;
  premium: boolean;
  createdAt: string;
  updatedAt?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, language?: string) => Promise<void>;
  logout: () => Promise<void>;
  getCurrentUser: () => Promise<void>;
  addCoins: (amount: number) => Promise<void>;
  upgradeToPremium: () => Promise<void>;
  clearError: () => void;
}

export const useAuth = create<AuthState>()(
  subscribeWithSelector((set, get) => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,

    login: async (username: string, password: string) => {
      set({ isLoading: true, error: null });
      
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username, password }),
          credentials: 'include'
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Login failed');
        }

        set({ 
          user: data.user, 
          isAuthenticated: true, 
          isLoading: false,
          error: null 
        });
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Login failed',
          isLoading: false 
        });
        throw error;
      }
    },

    register: async (username: string, password: string, language = 'en') => {
      set({ isLoading: true, error: null });
      
      try {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username, password, language }),
          credentials: 'include'
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Registration failed');
        }

        set({ 
          user: data.user, 
          isAuthenticated: true, 
          isLoading: false,
          error: null 
        });
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Registration failed',
          isLoading: false 
        });
        throw error;
      }
    },

    logout: async () => {
      set({ isLoading: true });
      
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          credentials: 'include'
        });

        set({ 
          user: null, 
          isAuthenticated: false, 
          isLoading: false,
          error: null 
        });
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Logout failed',
          isLoading: false 
        });
      }
    },

    getCurrentUser: async () => {
      set({ isLoading: true });
      
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include'
        });

        if (response.ok) {
          const data = await response.json();
          set({ 
            user: data.user, 
            isAuthenticated: true, 
            isLoading: false,
            error: null 
          });
        } else {
          set({ 
            user: null, 
            isAuthenticated: false, 
            isLoading: false,
            error: null 
          });
        }
      } catch (error) {
        set({ 
          user: null, 
          isAuthenticated: false, 
          isLoading: false,
          error: null 
        });
      }
    },

    addCoins: async (amount: number) => {
      const currentUser = get().user;
      if (!currentUser) return;

      set({ isLoading: true });
      
      try {
        const newAmount = currentUser.coins + amount;
        const response = await fetch('/api/auth/add-coins', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ amount: newAmount }),
          credentials: 'include'
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to add coins');
        }

        set({ 
          user: data.user, 
          isLoading: false,
          error: null 
        });
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to add coins',
          isLoading: false 
        });
      }
    },

    upgradeToPremium: async () => {
      set({ isLoading: true });
      
      try {
        const response = await fetch('/api/auth/upgrade-premium', {
          method: 'POST',
          credentials: 'include'
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to upgrade to premium');
        }

        set({ 
          user: data.user, 
          isLoading: false,
          error: null 
        });
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to upgrade to premium',
          isLoading: false 
        });
      }
    },

    clearError: () => set({ error: null })
  }))
);