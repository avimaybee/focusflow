

import { create } from 'zustand';

interface NotesState {
  isNotesOpen: boolean;
  notesContent: string;
  toggleNotes: () => void;
  setNotesContent: (content: string) => void;
  appendToNotes: (content: string) => void;
}

export const useNotesStore = create<NotesState>((set) => ({
  isNotesOpen: false,
  notesContent: '',
  toggleNotes: () => set((state) => ({ isNotesOpen: !state.isNotesOpen })),
  setNotesContent: (content) => set({ notesContent: content }),
  appendToNotes: (content) =>
    set((state) => ({
      notesContent: state.notesContent
        ? `${state.notesContent}\n\n---\n\n${content}`
        : content,
    })),
}));

