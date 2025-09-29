import { create } from 'zustand';

// Product 타입을 재사용하기 위해 필요한 속성들을 정의합니다.
interface ProductImage {
  image_url: string;
}
export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  product_images: ProductImage[];
}

// 장바구니 아이템은 Product의 모든 속성을 포함하며, quantity를 추가로 가집니다.
export interface CartItem extends Product {
  quantity: number;
}

// 스토어의 상태와 액션들의 타입을 정의합니다.
export interface CartState {
  items: CartItem[];
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>((set) => ({
  // 초기 상태
  items: [],

  // 액션: 상품 추가
  addItem: (product) => set((state) => {
    const existingItem = state.items.find((item) => item.id === product.id);

    if (existingItem) {
      // 이미 장바구니에 있는 상품이면 수량만 1 증가
      const updatedItems = state.items.map((item) =>
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      );
      return { items: updatedItems };
    } else {
      // 새로운 상품이면 장바구니에 추가 (quantity: 1 포함)
      return { items: [...state.items, { ...product, quantity: 1 }] };
    }
  }),

  // 액션: 상품 제거
  removeItem: (productId) => set((state) => ({
    items: state.items.filter((item) => item.id !== productId),
  })),

  // 액션: 수량 변경
  updateQuantity: (productId, quantity) => set((state) => {
    // 수량이 1 미만이면 제거되도록 하거나, 최소 1을 유지하도록 할 수 있습니다. 여기서는 1 미만이면 업데이트하지 않습니다.
    if (quantity < 1) return state;
    const updatedItems = state.items.map((item) =>
      item.id === productId ? { ...item, quantity } : item
    );
    return { items: updatedItems };
  }),

  // 액션: 장바구니 비우기
  clearCart: () => set({ items: [] }),
}));
