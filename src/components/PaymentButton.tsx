'use client';

import { useRouter } from 'next/navigation';
import { loadTossPayments } from '@tosspayments/payment-sdk';
import { useCartStore } from '@/store/cartStore';

export default function PaymentButton() {
  const { items, clearCart } = useCartStore();
  const router = useRouter();

  // ✅ 해결: 여기에 본인의 테스트 클라이언트 키를 직접 넣거나, 
  // .env.local 파일을 사용한다면 process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY 형식으로 가져옵니다.
  const clientKey = process.env.NEXT_PUBLIC_TOSS_TEST_KEY; // 👈 여기에 본인 키를 다시 확인해서 넣어주세요.

  // 만약 .env.local을 사용하신다면 아래와 같이 해야 합니다.
  // const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!;
  // (.env.local 파일에는 NEXT_PUBLIC_TOSS_CLIENT_KEY=test_ck_... 라고 적혀있어야 합니다.)


  const handlePayment = async () => {
    // ... (이하 코드는 이전과 동일)
    if (items.length === 0) {
      alert('결제할 상품이 없습니다.');
      return;
    }
    const totalPrice = items.reduce((total, item) => total + item.price * item.quantity, 0);

    // 진단을 위해 console.log를 추가해봅니다.
    console.log('Current Client Key:', clientKey);
    if (!clientKey) {
      alert('Toss Payments 클라이언트 키가 설정되지 않았습니다.');
      return;
    }

    try {
      const tossPayments = await loadTossPayments(clientKey);
      await tossPayments.requestPayment('카드', {
        amount: totalPrice,
        orderId: `order-${new Date().getTime()}`,
        orderName: items.length > 1 ? `${items[0].name} 외 ${items[0].name}건` : items[0].name,
        customerName: '홍길동',
        successUrl: `${window.location.origin}/payment/success`,
        failUrl: `${window.location.origin}/payment/fail`,
      });
    } catch (error) {
      console.error('결제 요청 실패:', error);
      alert('결제 요청 중 오류가 발생했습니다.');
    }
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