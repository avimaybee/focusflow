import { create } from 'zustand';

interface ContextHubStore {
  isContextHubOpen: boolean;
  toggleContextHub: () => void;
  openContextHub: () => void;
  closeContextHub: () => void;
  notesContent: string;
  setNotesContent: (content: string) => void;
}

export const useContextHubStore = create<ContextHubStore>((set) => ({
  isContextHubOpen: false,
  toggleContextHub: () => set((state) => ({ isContextHubOpen: !state.isContextHubOpen })),
  openContextHub: () => set({ isContextHubOpen: true }),
  closeContextHub: () => set({ isContextHubOpen: false }),
  notesContent: '',
  setNotesContent: (content) => set({ notesContent: content }),
}));