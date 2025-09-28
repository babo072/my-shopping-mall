import { NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from '@supabase/ssr';
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
            try { cookieStore.set({ name, value, ...options }); } catch (error) {}
          },
          remove: (name, options) => {
            try { cookieStore.set({ name, value: '', ...options }); } catch (error) {}
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "로그인이 필요합니다." }, { status: 401 });
    }

    // 2. 필수 파라미터 검증
    if (!paymentKey || !orderId || amount == null) {
      return NextResponse.json(
        { success: false, error: "필수 파라미터가 누락되었습니다." },
        { status: 400 }
      );
    }

    const amountNumber = Number(amount);
    if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
      return NextResponse.json(
        { success: false, error: "결제 금액이 유효하지 않습니다." },
        { status: 400 }
      );
    }

    // 3. DB에서 주문 정보 확인 및 금액 비교 검증
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('total_price, status')
      .eq('id', orderId)
      .eq('user_id', user.id)
      .single();

    if (orderError || !orderData) {
      return NextResponse.json({ 
        success: false, 
        error: '주문 정보를 찾을 수 없거나 권한이 없습니다.' 
      }, { status: 404 });
    }

    if (orderData.status === 'paid') {
      return NextResponse.json({ success: true, message: '이미 처리된 주문입니다.' });
    }

    if (orderData.total_price !== amountNumber) {
      return NextResponse.json({ 
        success: false, 
        error: '주문 금액이 일치하지 않습니다.' 
      }, { status: 400 });
    }

    // 4. 테스트 모드 처리
    if (fake === '1') {
      console.log('🧪 테스트 모드: 실제 결제 검증 건너뛰기');
      
      // 테스트 모드에서도 주문 상태를 'paid'로 업데이트
      const { error: updateError } = await supabase
        .from('orders')
        .update({ 
          status: 'paid', 
          payment_key: paymentKey // fake 결제키도 저장
        })
        .eq('id', orderId);
      
      if (updateError) {
        console.error('테스트 모드 주문 상태 업데이트 실패:', updateError);
        return NextResponse.json({ 
          success: false, 
          error: '주문 상태 업데이트에 실패했습니다.' 
        }, { status: 500 });
      }

      return NextResponse.json({ 
        success: true, 
        data: { 
          fake: true, 
          orderId, 
          amount: amountNumber,
          message: '테스트 결제가 완료되었습니다.' 
        } 
      });
    }

    // 5. 실제 토스페이먼츠 결제 승인 API 호출
    const secretKey = process.env.TOSS_SECRET_KEY; // 수정된 환경변수명
    if (!secretKey) {
      console.error("[Toss Payments] TOSS_SECRET_KEY가 설정되지 않았습니다.");
      return NextResponse.json(
        { success: false, error: "서버 설정 오류입니다." },
        { status: 500 }
      );
    }

    const authHeader = "Basic " + Buffer.from(`${secretKey}:`).toString("base64");
    const response = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        paymentKey,
        orderId,
        amount: amountNumber,
      }),
    });

    const paymentConfirmData = await response.json();

    if (!response.ok) {
      console.error("[Toss Payments Confirm Error]", paymentConfirmData);
      return NextResponse.json(
        { success: false, error: paymentConfirmData },
        { status: response.status }
      );
    }

    // 6. 주문 상태를 'paid'로 업데이트
    const { error: updateError } = await supabase
      .from('orders')
      .update({ status: 'paid', payment_key: paymentKey })
      .eq('id', orderId);
    
    if (updateError) {
      console.error('주문 상태 업데이트 실패:', updateError);
      // 실제 서비스에서는 결제 취소 API 호출 등 롤백 로직 필요
      return NextResponse.json({ 
        success: false, 
        error: '주문 상태 업데이트에 실패했습니다.' 
      }, { status: 500 });
    }

    console.log("✅ 결제 승인 및 주문 확정 완료:", paymentConfirmData);
    return NextResponse.json({ success: true, data: paymentConfirmData });

  } catch (error: any) {
    console.error("[Toss Payments Confirm Exception]", error);
    return NextResponse.json(
      { success: false, error: error.message || "알 수 없는 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}