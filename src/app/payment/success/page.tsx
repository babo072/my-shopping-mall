'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CheckCircle, Loader2, XCircle } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { clearCart } = useCartStore();

  const [isVerifying, setIsVerifying] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [message, setMessage] = useState('결제를 안전하게 처리하고 있습니다...');

  useEffect(() => {
    const verifyPayment = async () => {
      const paymentKey = searchParams.get('paymentKey');
      const orderId = searchParams.get('orderId');
      const amount = searchParams.get('amount');
      const fake = searchParams.get('fake');

      if (!paymentKey || !orderId || !amount) {
        setMessage('잘못된 접근입니다. 결제 정보가 없습니다.');
        setIsVerifying(false);
        return;
      }

      try {
        // 테스트 모드든 실제 모드든 서버 검증 API 호출
        const response = await fetch('/api/payment/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            paymentKey, 
            orderId, 
            amount: Number(amount),
            fake 
          }),
          cache: 'no-store',
        });

        const result = await response.json();

        if (result.success) {
          setIsSuccess(true);
          clearCart(); // 결제 성공 시 장바구니 비우기
          
          if (fake === '1') {
            setMessage('테스트 결제가 성공적으로 완료되었습니다!');
          } else {
            setMessage('결제가 정상적으로 완료되었습니다!');
          }
        } else {
          setMessage(`결제 검증 실패: ${result.error?.message || result.error || '알 수 없는 오류'}`);
        }
      } catch (error: any) {
        console.error('결제 검증 중 오류:', error);
        setMessage('결제 검증 중 문제가 발생했습니다.');
      } finally {
        setIsVerifying(false);
      }
    };

    verifyPayment();
  }, [searchParams, router, clearCart]);

  if (isVerifying) {
    return (
      <div className="bg-slate-900 text-white min-h-screen flex flex-col items-center justify-center text-center">
        <Loader2 className="w-16 h-16 animate-spin text-cyan-500 mb-4" />
        <h1 className="text-3xl font-bold mb-2">결제 처리 중</h1>
        <p className="text-slate-400">{message}</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 text-white min-h-screen flex flex-col items-center justify-center text-center">
      <div className="max-w-md mx-auto p-8">
        {isSuccess ? (
          <>
            <CheckCircle className="w-16 h-16 text-green-500 mb-4 mx-auto" />
            <h1 className="text-3xl font-bold mb-4 text-green-400">결제 완료!</h1>
          </>
        ) : (
          <>
            <XCircle className="w-16 h-16 text-red-500 mb-4 mx-auto" />
            <h1 className="text-3xl font-bold mb-4 text-red-400">결제 실패</h1>
          </>
        )}
        
        <p className="text-slate-300 mb-8 leading-relaxed">{message}</p>
        
        {searchParams.get('fake') === '1' && (
          <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-4 mb-6">
            <p className="text-amber-200 text-sm">
              🧪 테스트 모드로 실행되었습니다
            </p>
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={() => router.push('/')}
            className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            쇼핑 계속하기
          </button>
          
          {!isSuccess && (
            <button
              onClick={() => router.push('/cart')}
              className="w-full bg-slate-600 hover:bg-slate-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              장바구니로 돌아가기
            </button>
          )}
        </div>

        {isSuccess && (
          <div className="mt-8 text-left bg-slate-800 rounded-lg p-4">
            <h3 className="font-semibold mb-2">주문 정보</h3>
            <div className="text-sm text-slate-400 space-y-1">
              <p>주문번호: <span className="font-mono text-slate-300">{searchParams.get('orderId')}</span></p>
              <p>결제금액: <span className="font-mono text-slate-300">{Number(searchParams.get('amount')).toLocaleString()}원</span></p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}