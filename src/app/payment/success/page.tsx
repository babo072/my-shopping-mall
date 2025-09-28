'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CheckCircle, Loader2 } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { clearCart } = useCartStore();
  const [isVerifying, setIsVerifying] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyPayment = async () => {
      const paymentKey = searchParams.get('paymentKey');
      const orderId = searchParams.get('orderId');
      const amount = searchParams.get('amount');
      const fake = searchParams.get('fake'); // 테스트 모드 플래그 읽기

      if (!paymentKey || !orderId || !amount) {
        setError("잘못된 접근입니다. 필수 결제 정보가 누락되었습니다.");
        setIsVerifying(false);
        return;
      }

      try {
        // 서버의 검증 API에 요청 전송
        const response = await fetch('/api/payment/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentKey, orderId, amount, fake }), // fake 정보 포함
        });

        const result = await response.json();

        if (result.success) {
          setIsSuccess(true);
          clearCart(); // 검증 성공 시 장바구니 비우기
        } else {
          const errorMessage = result.error?.message || '알 수 없는 오류';
          console.error("결제 검증 실패:", result.error);
          setError(`결제 검증에 실패했습니다: ${errorMessage}`);
          // 실패 시에는 실패 페이지로 보내는 것이 더 나은 사용자 경험일 수 있습니다.
          // router.replace(`/payment/fail?message=${encodeURIComponent(errorMessage)}&code=VERIFY_FAILED`);
        }
      } catch (err) {
        console.error("검증 요청 중 에러:", err);
        setError("결제 검증 중 네트워크 또는 서버에 문제가 발생했습니다.");
      } finally {
        setIsVerifying(false);
      }
    };

    verifyPayment();
  }, [searchParams, router, clearCart]);

  // 로딩 중 UI
  if (isVerifying) {
    return (
      <div className="bg-slate-900 text-white min-h-screen flex flex-col items-center justify-center text-center">
        <Loader2 className="w-16 h-16 animate-spin text-cyan-500 mb-4" />
        <h1 className="text-3xl font-bold">결제를 안전하게 처리하고 있습니다.</h1>
        <p className="text-slate-400 mt-2">잠시만 기다려주세요...</p>
      </div>
    );
  }

  // 성공 UI
  if (isSuccess) {
    return (
      <div className="bg-slate-900 text-white min-h-screen flex flex-col items-center justify-center text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
        <h1 className="text-3xl font-bold mb-2">결제가 성공적으로 완료되었습니다.</h1>
        <p className="text-slate-400 mb-8">주문해주셔서 감사합니다!</p>
        <div className="flex gap-4">
            <button 
              onClick={() => router.push('/')}
              className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3 px-6 rounded-lg"
            >
              쇼핑 계속하기
            </button>
            <button 
              onClick={() => router.push('/orders')}
              className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-6 rounded-lg"
            >
              주문내역 보기
            </button>
        </div>
      </div>
    );
  }

  // 실패 UI
  return (
      <div className="bg-slate-900 text-white min-h-screen flex flex-col items-center justify-center text-center">
        <CheckCircle className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-3xl font-bold mb-2">결제 처리 중 오류가 발생했습니다.</h1>
        <p className="text-slate-400 mb-8 max-w-md">{error}</p>
        <button 
          onClick={() => router.push('/cart')}
          className="mt-10 bg-slate-600 hover:bg-slate-700 text-white font-bold py-3 px-6 rounded-lg"
        >
          장바구니로 돌아가기
        </button>
      </div>
  );
}