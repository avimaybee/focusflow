
import { create } from 'zustand';

type AuthModalView = 'login' | 'signup';

interface AuthModalStore {
  isOpen: boolean;
  view: AuthModalView;
  onOpen: () => void;
  onClose: () => void;
  setView: (view: AuthModalView) => void;
}

export const useAuthModal = create<AuthModalStore>((set) => ({
  isOpen: false,
  view: 'login',
  onOpen: () => set({ isOpen: true }),
  onClose: () => set({ isOpen: false }),
  setView: (view) => set({ view }),
}));
