import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Match, Ball, Innings, Player, Tournament } from './types';

interface StoreState {
  matches: Match[];
  players: Player[];
  tournaments: Tournament[];
  currentMatchId: string | null;
  theme: 'light' | 'dark' | 'system';
  addMatch: (match: Match) => void;
  updateCurrentMatch: (updater: (match: Match) => Match) => void;
  setCurrentMatchId: (id: string | null) => void;
  deleteMatch: (id: string) => void;
  addTournament: (tournament: Tournament) => void;
  updateTournament: (id: string, updater: (t: Tournament) => Tournament) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  clearAllData: () => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      matches: [],
      players: [],
      tournaments: [],
      currentMatchId: null,
      theme: 'light',

      addMatch: (match) =>
        set((state) => {
          setTimeout(() => import('./lib/supabaseSync').then(m => m.syncMatchesToCloud()), 500);
          return {
            matches: [match, ...state.matches],
            currentMatchId: match.id,
          };
        }),

      updateCurrentMatch: (updater) =>
        set((state) => {
          if (!state.currentMatchId) return state;
          setTimeout(() => import('./lib/supabaseSync').then(m => m.syncMatchesToCloud()), 500);
          return {
            matches: state.matches.map((m) =>
              m.id === state.currentMatchId ? updater(m) : m
            ),
          };
        }),

      setCurrentMatchId: (id) => set({ currentMatchId: id }),
      
      deleteMatch: (id) =>
        set((state) => ({
          matches: state.matches.filter((m) => m.id !== id),
        })),

      addTournament: (tournament) => 
        set((state) => ({
          tournaments: [...state.tournaments, tournament],
        })),

      updateTournament: (id, updater) =>
        set((state) => ({
          tournaments: state.tournaments.map((t) => 
            t.id === id ? updater(t) : t
          ),
        })),

      setTheme: (theme) =>
        set(() => ({
          theme,
        })),

      clearAllData: () =>
        set(() => ({
          matches: [],
          players: [],
          tournaments: [],
          currentMatchId: null,
        })),
    }),
    {
      name: 'boxscore-storage',
    }
  )
);
