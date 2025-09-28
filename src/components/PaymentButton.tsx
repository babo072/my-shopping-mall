'use client';

import { useRouter } from 'next/navigation';
import { loadTossPayments } from '@tosspayments/payment-sdk';
import { useCartStore } from '@/store/cartStore';
import { createOrder } from '@/app/actions/order';

export default function PaymentButton() {
  const { items } = useCartStore();
  const router = useRouter();
  const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!;
  const FAKE = process.env.NEXT_PUBLIC_FAKE_PAY === '1';

  const handlePayment = async () => {
    if (!items.length) return alert('결제할 상품이 없습니다.');

    // 1) 주문 예비 생성
    const orderRes = await createOrder(items);
    if (!orderRes?.success || !orderRes.order) {
      return alert(orderRes?.error ?? '주문 생성 실패');
    }
    const order = orderRes.order;

    const origin = window.location.origin;
    const successUrl = `${origin}/payment/success`;
    const failUrl = `${origin}/payment/fail`;

    // 2) 테스트 모드: 결제창 생략하고 곧바로 success로 이동
    if (FAKE) {
      const fakePaymentKey = `fake_${Date.now()}`;
      const amount = Math.round(Number(order.total_price));
      // success 페이지에서 쿼리스트링을 그대로 사용(서버 confirm은 테스트용으로 건너뛰거나 mock 처리)
      const qs = new URLSearchParams({
        paymentKey: fakePaymentKey,
        orderId: String(order.id),
        amount: String(amount),
        fake: '1',
      }).toString();
      window.location.href = `${successUrl}?${qs}`;
      return;
    }

    // 3) 실제 결제
    const tossPayments = await loadTossPayments(clientKey);
    await tossPayments.requestPayment('카드', {
      amount: Math.round(Number(order.total_price)),
      orderId: String(order.id),
      orderName: items.length > 1 ? `${items[0].name} 외 ${items.length - 1}건` : items[0].name,
      customerName: '홍길동',
      successUrl,
      failUrl,
    });
  };

  return (
    <button
      onClick={handlePayment}
      className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-lg mt-6"
    >
      결제하기
    </button>
  );
}
