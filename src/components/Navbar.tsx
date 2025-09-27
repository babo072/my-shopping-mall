'use client'; // 클라이언트 컴포넌트로 전환

import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { useCartStore } from '@/store/cartStore'; // cartStore import

export default function Navbar() {
  // 스토어에서 아이템 목록을 가져옵니다.
  const { items } = useCartStore();

  // 장바구니에 담긴 총 아이템 개수를 계산합니다.
  const totalItems = items.reduce((total, item) => total + item.quantity, 0);

  return (
    <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md shadow-md">
      <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-white hover:text-slate-200">
          My Little Shop
        </Link>
        <div className="flex items-center">
          <Link href="/cart" className="flex items-center text-slate-300 hover:text-white">
            <ShoppingCart className="h-6 w-6" />
            <span className="ml-2 text-sm font-medium">Cart</span>
            {/* 총 아이템 개수를 표시합니다. */}
            <span className="ml-2 bg-cyan-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
              {totalItems}
            </span>
          </Link>
        </div>
      </nav>
    </header>
  );
}