'use client';

import { useCartStore } from "@/store/cartStore";
import Link from "next/link";
import { Camera, Trash2, Plus, Minus } from "lucide-react";
import PaymentButton from "@/components/PaymentButton";

export default function CartPage() {
  const { items, removeItem, updateQuantity } = useCartStore();

  const totalPrice = items.reduce((total, item) => total + item.price * item.quantity, 0);

  // 장바구니가 비어있을 경우
  if (items.length === 0) {
    return (
      <div className="bg-slate-900 text-white min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-3xl font-bold mb-4">장바구니가 비어있습니다.</h1>
        <p className="text-slate-400 mb-8">마음에 드는 상품을 담아보세요!</p>
        <Link href="/" className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded">
          상품 보러 가기
        </Link>
      </div>
    );
  }

  // 장바구니에 상품이 있을 경우
  return (
    <div className="bg-slate-900 text-white min-h-screen">
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-extrabold mb-10 text-center">장바구니</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* 상품 목록 */}
          <div className="lg:col-span-2 space-y-4">
            {items.map(item => (
              <div key={item.id} className="bg-slate-800 p-4 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-slate-700 w-20 h-20 rounded-md flex items-center justify-center flex-shrink-0">
                    {item.product_images && item.product_images.length > 0 ? (
                      <img 
                        src={item.product_images[0].image_url} 
                        alt={item.name} 
                        className="w-full h-full object-cover rounded-md"
                      />
                    ) : (
                      <Camera className="w-8 h-8 text-slate-500"/>
                    )}
                  </div>
                  <div>
                    <h2 className="font-bold text-lg">{item.name}</h2>
                    <p className="text-slate-400">{item.price.toLocaleString()}원</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center border border-slate-700 rounded">
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="px-2 py-1 hover:bg-slate-700"><Minus size={16}/></button>
                    <span className="px-3">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="px-2 py-1 hover:bg-slate-700"><Plus size={16}/></button>
                  </div>
                  <button onClick={() => removeItem(item.id)} className="text-slate-500 hover:text-red-500">
                    <Trash2/>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* 주문 요약 */}
          <div className="bg-slate-800 p-6 rounded-lg h-fit">
            <h2 className="text-2xl font-bold mb-4">주문 요약</h2>
            <div className="flex justify-between mb-2">
              <span className="text-slate-400">상품 총액</span>
              <span>{totalPrice.toLocaleString()}원</span>
            </div>
            <div className="flex justify-between mb-6">
              <span className="text-slate-400">배송비</span>
              <span>0원</span>
            </div>
            <div className="border-t border-slate-700 pt-4 flex justify-between font-bold text-lg">
              <span>총 결제 금액</span>
              <span>{totalPrice.toLocaleString()}원</span>
            </div>
            <PaymentButton />
          </div>

        </div>
      </div>
    </div>
  );
}