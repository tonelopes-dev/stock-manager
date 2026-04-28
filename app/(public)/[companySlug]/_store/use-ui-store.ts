import { create } from "zustand";

interface UIState {
  isPromotionsModalOpen: boolean;
  openPromotionsModal: () => void;
  closePromotionsModal: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isPromotionsModalOpen: false,
  openPromotionsModal: () => set({ isPromotionsModalOpen: true }),
  closePromotionsModal: () => set({ isPromotionsModalOpen: false }),
}));
