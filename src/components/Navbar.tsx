'use client';

import Link from 'next/link';
import { ShoppingCart, ListOrdered, UserCircle } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { logout } from '@/app/actions/auth';
import type { User } from '@supabase/supabase-js';

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
          
          {user && (
            <Link href="/orders" className="flex items-center text-slate-300 hover:text-white">
              <ListOrdered className="h-6 w-6" />
              <span className="ml-2 text-sm font-medium">주문 내역</span>
            </Link>
          )}
          
          {user ? (
            <div className="flex items-center gap-6">
              <Link href="/mypage" className="flex items-center text-slate-300 hover:text-white">
                <UserCircle className="h-6 w-6" />
                <span className="ml-2 text-sm font-medium">마이페이지</span>
              </Link>
              <div className="flex items-center gap-4">
                <span className="text-sm text-slate-300">{user.email}</span>
                <form action={logout}>
                  <button className="text-sm text-slate-300 hover:text-white transition-colors">
                    로그아웃
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <Link href="/login" className="text-sm font-medium text-slate-300 hover:text-white">
              로그인
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}