
import { create } from 'zustand';

type AuthModalView = 'login' | 'signup';

interface AuthModalStore {
  isOpen: boolean;
  view: AuthModalView;
  layoutId: string | null; // To track the triggering element for the animation
  onOpen: (view?: AuthModalView, layoutId?: string) => void;
  onClose: () => void;
  setView: (view: AuthModalView) => void;
}

export const useAuthModal = create<AuthModalStore>((set) => ({
  isOpen: false,
  view: 'login',
  layoutId: null,
  onOpen: (view = 'login', layoutId) => set({ isOpen: true, view, layoutId: layoutId || null }),
  onClose: () => set({ isOpen: false, layoutId: null }),
  setView: (view) => set({ view }),
}));
