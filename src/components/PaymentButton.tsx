'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadTossPayments } from '@tosspayments/payment-sdk';
import { useCartStore } from '@/store/cartStore';
import { createOrder } from '@/app/actions/order';

interface PaymentButtonProps {
  className?: string;
}

function generateId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return 'order_' + Date.now().toString(36);
}

export default function PaymentButton({ className }: PaymentButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const items = useCartStore((s: any) => s.items ?? []);

  const onPay = async () => {
    if (loading || items.length === 0) return;
    setLoading(true);

    try {
      // 1. 모드와 관계없이 항상 DB에 주문을 먼저 생성합니다.
      const orderResponse = await createOrder(items);

      if (!orderResponse.success || !orderResponse.order) {
        alert(orderResponse.error || '주문을 생성하는 데 실패했습니다.');
        setLoading(false);
        return;
      }
      
      const order = orderResponse.order;
      const isTest = process.env.NEXT_PUBLIC_TEST_MODE === 'true';

      // 2. 테스트 모드일 경우
      if (isTest) {
        const query = new URLSearchParams({
          orderId: order.id,
          amount: order.total_price.toString(),
          paymentKey: `fake-payment-key-${generateId()}`,
          fake: '1', // 서버에 테스트 모드임을 알리는 플래그
        }).toString();
        router.push(`/payment/success?${query}`);
        return; // 여기서 함수 종료
      }

      // 3. 실제 결제 모드일 경우
      const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
      if (!clientKey) {
        alert('결제 설정이 올바르지 않습니다.');
        setLoading(false);
        return;
      }

      const toss = await loadTossPayments(clientKey);
      await toss.requestPayment('카드', {
        amount: order.total_price,
        orderId: order.id,
        orderName: items.length > 1 ? `${items[0].name} 외 ${items.length - 1}건` : items[0].name,
        customerName: '홍길동', // 실제로는 로그인된 사용자 정보 사용
        successUrl: `${window.location.origin}/payment/success`,
        failUrl: `${window.location.origin}/payment/fail`,
      });

    } catch (err) {
      console.error('결제 진행 중 오류가 발생했습니다:', err);
      alert('결제 진행 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={onPay}
      disabled={loading || items.length === 0}
      className={
        className ??
        'w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-lg mt-6 disabled:opacity-60'
      }
      aria-busy={loading}
    >
      {loading ? '처리 중…' : '결제하기'}
    </button>
  );
}