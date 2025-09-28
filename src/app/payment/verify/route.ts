import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { paymentKey, orderId, amount } = await request.json();
  const secretKey = process.env.NEXT_PUBLIC_TOSS_SECRET_KEY;

  // 토스페이먼츠 '결제 승인' API 호출
  // 이 API는 서버에서만 시크릿 키를 이용해 호출해야 합니다.
  const response = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
    method: "POST",
    headers: {
      // Basic 인증 헤더를 생성합니다.
      "Authorization": "Basic " + Buffer.from(`${secretKey}:`).toString("base64"),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      paymentKey,
      orderId,
      amount,
    }),
  });

  const data = await response.json();

  if (response.ok) {
    // ❗️결제 승인 성공 시, 여기에 데이터베이스 주문 정보 저장 로직을 추가합니다.
    // (예: Supabase의 orders 테이블에 주문 정보 기록)
    console.log("결제 승인 성공:", data);
    return NextResponse.json({ success: true, data });
  } else {
    // 결제 승인 실패
    console.error("결제 승인 실패:", data);
    return NextResponse.json({ success: false, error: data }, { status: 400 });
  }
}