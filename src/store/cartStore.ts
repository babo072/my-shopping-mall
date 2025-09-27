import { create } from 'zustand';
import { Product } from '@/app/page';

export interface CartItem extends Product {
  quantity: number;
}

interface CartState {
  items: CartItem[];
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void; // 👈 수량 업데이트 함수 추가
  clearCart: () => void;
}

export const useCartStore = create<CartState>((set) => ({
  items: [],

  addItem: (product) => set((state) => {
    const existingItem = state.items.find((item) => item.id === product.id);
    if (existingItem) {
      const updatedItems = state.items.map((item) =>
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      );
      return { items: updatedItems };
    } else {
      return { items: [...state.items, { ...product, quantity: 1 }] };
    }
  }),

  removeItem: (productId) => set((state) => ({
    items: state.items.filter((item) => item.id !== productId),
  })),

  // 👇 --- 새로운 액션 추가 ---
  updateQuantity: (productId, quantity) => set((state) => {
    // 수량이 1 이상일 때만 업데이트
    if (quantity < 1) return state;
    const updatedItems = state.items.map((item) =>
      item.id === productId ? { ...item, quantity } : item
    );
    return { items: updatedItems };
  }),
  // -------------------------

  clearCart: () => set({ items: [] }),
}));