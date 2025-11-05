import { create } from 'zustand';

interface NotesStore {
  refreshTrigger: number;
  triggerRefresh: () => void;
}

export const useNotesStore = create<NotesStore>((set) => ({
  refreshTrigger: 0,
  triggerRefresh: () => set((state) => ({ refreshTrigger: state.refreshTrigger + 1 })),
}));
