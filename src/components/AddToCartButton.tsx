'use client'; // 이 컴포넌트는 클라이언트에서 실행됨을 명시

import { useCartStore } from '@/store/cartStore';
import { Product } from '@/app/page';
import { ShoppingCart } from 'lucide-react';

// 이 컴포넌트는 어떤 product를 담을지 props로 받습니다.
type AddToCartButtonProps = {
  product: Product;
}

export default function AddToCartButton({ product }: AddToCartButtonProps) {
  // cartStore에서 addItem 함수를 가져옵니다.
  const { addItem } = useCartStore();

  return (
    <button
      onClick={() => addItem(product)} // 버튼 클릭 시 addItem 함수 실행
      className="flex-1 bg-cyan-600 text-white font-bold py-4 px-6 rounded-lg hover:bg-cyan-700 transition-all duration-300 ease-in-out flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
    >
      <ShoppingCart className="w-5 h-5" />
      장바구니에 담기
    </button>
  );
}