import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';

export default function Navbar() {
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
            <span className="ml-2 bg-cyan-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">0</span>
          </Link>
        </div>
      </nav>
    </header>
  );
}