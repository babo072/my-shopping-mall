'use client';

import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { logout } from '@/app/actions/auth'; // 1단계에서 만든 로그아웃 액션 import
import type { User } from '@supabase/supabase-js'; // Supabase의 User 타입 import

// Navbar가 user prop을 받도록 타입을 지정합니다.
type NavbarProps = {
  user: User | null;
}

export default function Navbar({ user }: NavbarProps) {
  const { items } = useCartStore();
  const totalItems = items.reduce((total, item) => total + item.quantity, 0);

  return (
    <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md shadow-md">
      <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-white hover:text-slate-200">
          나만의 작은 상점
        </Link>
        <div className="flex items-center gap-6">
          <Link href="/cart" className="flex items-center text-slate-300 hover:text-white">
            <ShoppingCart className="h-6 w-6" />
            <span className="ml-2 text-sm font-medium">장바구니</span>
            <span className="ml-2 bg-cyan-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
              {totalItems}
            </span>
          </Link>
          
          {/* --- 👇 로그인 상태에 따라 다른 UI를 보여주는 로직 --- */}
          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-300">{user.email}</span>
              <form action={logout}>
                <button className="text-sm text-slate-300 hover:text-white transition-colors">
                  로그아웃
                </button>
              </form>
            </div>
          ) : (
            <Link href="/login" className="text-sm font-medium text-slate-300 hover:text-white">
              로그인
            </Link>
          )}
          {/* ------------------------------------------------ */}
        </div>
      </nav>
    </header>
  );
}