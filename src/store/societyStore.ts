import { create } from 'zustand';

interface SocietyState {
  activeSociety: any | null;
  societies: any[];
  setActiveSociety: (society: any | null) => void;
  setSocieties: (societies: any[]) => void;
}

export const useSocietyStore = create<SocietyState>((set) => ({
  activeSociety: null,
  societies: [],
  setActiveSociety: (society) => set({ activeSociety: society }),
  setSocieties: (societies) => set({ societies }),
}));
