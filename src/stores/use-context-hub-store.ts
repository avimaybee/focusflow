import { create } from 'zustand';

interface ContextHubStore {
  isContextHubOpen: boolean;
  toggleContextHub: () => void;
  openContextHub: () => void;
  closeContextHub: () => void;
}

export const useContextHubStore = create<ContextHubStore>((set) => ({
  isContextHubOpen: false,
  toggleContextHub: () => set((state) => ({ isContextHubOpen: !state.isContextHubOpen })),
  openContextHub: () => set({ isContextHubOpen: true }),
  closeContextHub: () => set({ isContextHubOpen: false }),
}));