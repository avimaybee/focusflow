import { create } from 'zustand';

interface OnboardingModalState {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

export const useOnboardingModal = create<OnboardingModalState>((set) => ({
  isOpen: false,
  onOpen: () => set({ isOpen: true }),
  onClose: () => set({ isOpen: false }),
}));
