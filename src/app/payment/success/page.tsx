'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { CheckCircle } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { clearCart } = useCartStore();

  useEffect(() => {
    // ❗️실제 프로덕션에서는 이 페이지에서 서버로 결제 승인 요청을 보내야 합니다.
    // URL에 담겨온 paymentKey, orderId, amount를 서버로 보내서,
    // 서버가 토스페이먼츠 API를 통해 최종 결제 승인을 하고 DB에 주문 정보를 저장합니다.
    // 이 과정이 '결제 위변조 검증'의 핵심입니다.

    const paymentKey = searchParams.get('paymentKey');
    const orderId = searchParams.get('orderId');
    const amount = searchParams.get('amount');

    console.log('결제 성공! 검증에 필요한 정보:', { paymentKey, orderId, amount });

    // 검증이 성공했다고 가정하고, 장바구니를 비웁니다.
    clearCart();

  }, [searchParams, clearCart]);

  return (
    <div className="bg-slate-900 text-white min-h-screen flex flex-col items-center justify-center text-center">
      <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
      <h1 className="text-3xl font-bold mb-2">결제가 성공적으로 완료되었습니다.</h1>
      <p className="text-slate-400 mb-8">주문해주셔서 감사합니다!</p>
      <p className="text-lg">주문번호: <span className="font-mono">{searchParams.get('orderId')}</span></p>
      <p className="text-lg">결제금액: <span className="font-mono">{Number(searchParams.get('amount')).toLocaleString()}원</span></p>
      
      <button 
        onClick={() => router.push('/')}
        className="mt-10 bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3 px-6 rounded-lg"
      >
        쇼핑 계속하기
      </button>
    </div>
  );
}