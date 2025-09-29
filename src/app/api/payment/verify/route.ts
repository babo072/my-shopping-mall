import { NextResponse } from "next/server";
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { paymentKey, orderId, amount, fake } = await request.json();

    // 1. Supabase 클라이언트 생성 및 사용자 정보 조회
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name) => cookieStore.get(name)?.value,
          set: (name, value, options) => {
            try { cookieStore.set({ name, value, ...options }); } catch {}
          },
          remove: (name, options) => {
            try { cookieStore.set({ name, value: '', ...options }); } catch {}
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "로그인이 필요합니다." }, { status: 401 });
    }

    // 2. (모드 공통) DB에서 주문 정보 확인 및 금액 비교 검증
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('total_price, status')
      .eq('id', orderId)
      .eq('user_id', user.id)
      .single();

    if (orderError || !orderData) {
      return NextResponse.json({ success: false, error: '주문 정보를 찾을 수 없거나 권한이 없습니다.' }, { status: 404 });
    }
    if (orderData.status === 'paid') {
      return NextResponse.json({ success: true, message: '이미 처리된 주문입니다.' });
    }
    const amountNumber = Number(amount);
    if (orderData.total_price !== amountNumber) {
      return NextResponse.json({ success: false, error: '주문 금액이 일치하지 않습니다.' }, { status: 400 });
    }

    let paymentConfirmData: unknown;

    // 3. 모드에 따라 분기
    if (fake === '1') {
      // 3-1. 테스트 모드: 실제 결제 검증 건너뛰기
      console.log('🧪 테스트 모드: 실제 결제 검증을 건너뛰고 DB 업데이트를 진행합니다.');
      paymentConfirmData = {
        orderId,
        totalAmount: amountNumber,
        status: 'DONE', // 성공 상태를 모방한 가짜 데이터
      };
    } else {
      // 3-2. 실제 결제 모드: 토스페이먼츠 API 호출
      if (!paymentKey) {
        return NextResponse.json({ success: false, error: "필수 파라미터(paymentKey)가 누락되었습니다." }, { status: 400 });
      }
      const secretKey = process.env.TOSS_SECRET_KEY;
      if (!secretKey) {
        return NextResponse.json({ success: false, error: "서버 설정 오류입니다." }, { status: 500 });
      }

      const authHeader = "Basic " + Buffer.from(`${secretKey}:`).toString("base64");
      const response = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
        method: "POST",
        headers: { Authorization: authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({ paymentKey, orderId, amount: amountNumber }),
      });
      
      paymentConfirmData = await response.json();

      if (!response.ok) {
        return NextResponse.json({ success: false, error: paymentConfirmData }, { status: response.status });
      }
    }

    // 4. (모드 공통) 주문 상태를 'paid'로 업데이트
    const { error: updateError } = await supabase
      .from('orders')
      .update({ status: 'paid', payment_key: paymentKey })
      .eq('id', orderId);
    
    if (updateError) {
      // 실제 서비스에서는 결제 취소 API 호출 등 롤백 로직이 필요합니다.
      return NextResponse.json({ success: false, error: '주문 상태 업데이트에 실패했습니다.' }, { status: 500 });
    }

    console.log("✅ 결제 승인 및 주문 확정 완료:", paymentConfirmData);
    return NextResponse.json({ success: true, data: paymentConfirmData });

  } catch (error) {
    console.error("[Toss Payments Confirm Exception]", error);
    const message = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
