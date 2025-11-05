import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface DraftStore {
  drafts: Record<string, string>;
  setDraft: (chatId: string, content: string) => void;
  getDraft: (chatId: string) => string | undefined;
  clearDraft: (chatId: string) => void;
}

export const useDraftStore = create<DraftStore>()(
  persist(
    (set, get) => ({
      drafts: {},
      setDraft: (chatId: string, content: string) =>
        set((state) => ({
          drafts: { ...state.drafts, [chatId]: content },
        })),
      getDraft: (chatId: string) => {
        return get().drafts[chatId];
      },
      clearDraft: (chatId: string) =>
        set((state) => {
          const newDrafts = { ...state.drafts };
          delete newDrafts[chatId];
          return { drafts: newDrafts };
        }),
    }),
    {
      name: 'chat-drafts-storage',
    }
  )
);
