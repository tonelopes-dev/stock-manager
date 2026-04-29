import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  id: string; // Unique ID for the cart entry (productId + hash of options/notes)
  productId: string;
  name: string;
  price: number;
  quantity: number;
  maxQuantity: number;
  image?: string;
  notes?: string;
}

interface CartStore {
  items: CartItem[];
  totalAmount: number;
  totalItems: number;
  allowNegativeStock: boolean;
  addItem: (item: Omit<CartItem, "id">) => boolean;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => boolean;
  clearCart: () => void;
  setSettings: (settings: { allowNegativeStock: boolean }) => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [] as CartItem[],
      totalAmount: 0,
      totalItems: 0,
      allowNegativeStock: false,

      addItem: (newItem) => {
        const currentItems = get().items;
        const entryId = `${newItem.productId}-${newItem.notes || ""}`;
        const existingItemIndex = currentItems.findIndex((item) => item.id === entryId);

        const allowNegative = get().allowNegativeStock;

        // Calculate total quantity of THIS product ID already in cart
        const totalInCart = currentItems
          .filter((item) => item.productId === newItem.productId)
          .reduce((acc, item) => acc + item.quantity, 0);

        const newTotalQuantity = totalInCart + newItem.quantity;

        if (!allowNegative && newTotalQuantity > newItem.maxQuantity) {
          return false;
        }

        let updatedItems = [...currentItems];
        if (existingItemIndex > -1) {
          updatedItems[existingItemIndex].quantity += newItem.quantity;
        } else {
          updatedItems.push({ ...newItem, id: entryId } as CartItem);
        }

        const totalItems = updatedItems.reduce((acc, item) => acc + item.quantity, 0);
        const totalAmount = updatedItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

        set({ items: updatedItems, totalItems, totalAmount });
        return true;
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
          return true;
        }

        const currentItems = get().items;
        const item = currentItems.find((i) => i.id === id);
        const allowNegative = get().allowNegativeStock;

        if (!item) return false;

        // Calculate total quantity of THIS product ID in OTHER cart entries
        const totalInOtherEntries = currentItems
          .filter((i) => i.productId === item.productId && i.id !== id)
          .reduce((acc, i) => acc + i.quantity, 0);

        const newTotalQuantity = totalInOtherEntries + quantity;

        if (!allowNegative && newTotalQuantity > item.maxQuantity) {
          return false;
        }

        const updatedItems = currentItems.map((item) =>
          item.id === id ? { ...item, quantity } : item
        );

        const totalItems = updatedItems.reduce((acc, item) => acc + item.quantity, 0);
        const totalAmount = updatedItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

        set({ items: updatedItems, totalItems, totalAmount });
        return true;
      },

      clearCart: () => set({ items: [] as CartItem[], totalAmount: 0, totalItems: 0 }),
      setSettings: (settings) => set({ allowNegativeStock: settings.allowNegativeStock }),
    }),
    {
      name: "kipo-cart-storage",
    }
  )
);
