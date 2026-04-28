import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  id: string; // Unique ID for the cart entry (productId + hash of options/notes)
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  notes?: string;
  // Future: options/subitems would go here
}

interface CartStore {
  items: CartItem[];
  totalAmount: number;
  totalItems: number;
  addItem: (item: Omit<CartItem, "id">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [] as CartItem[],
      totalAmount: 0,
      totalItems: 0,

      addItem: (newItem) => {
        const currentItems = get().items;
        const entryId = `${newItem.productId}-${newItem.notes || ""}`;
        const existingItemIndex = currentItems.findIndex((item) => item.id === entryId);

        let updatedItems = [...currentItems];

        if (existingItemIndex > -1) {
          updatedItems[existingItemIndex].quantity += newItem.quantity;
        } else {
          updatedItems.push({ ...newItem, id: entryId } as CartItem);
        }

        const totalItems = updatedItems.reduce((acc, item) => acc + item.quantity, 0);
        const totalAmount = updatedItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

        set({ items: updatedItems, totalItems, totalAmount });
      },

      removeItem: (id) => {
        const updatedItems = get().items.filter((item) => item.id !== id);
        const totalItems = updatedItems.reduce((acc, item) => acc + item.quantity, 0);
        const totalAmount = updatedItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

        set({ items: updatedItems, totalItems, totalAmount });
      },

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id);
          return;
        }

        const updatedItems = get().items.map((item) =>
          item.id === id ? { ...item, quantity } : item
        );

        const totalItems = updatedItems.reduce((acc, item) => acc + item.quantity, 0);
        const totalAmount = updatedItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

        set({ items: updatedItems, totalItems, totalAmount });
      },

      clearCart: () => set({ items: [] as CartItem[], totalAmount: 0, totalItems: 0 }),
    }),
    {
      name: "kipo-cart-storage",
    }
  )
);
