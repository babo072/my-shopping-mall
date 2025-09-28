import { NextResponse } from "next/server";

export const runtime = "nodejs"; // Buffer 사용을 위해 Node.js 런타임으로 지정
export const dynamic = "force-dynamic"; // 캐시 방지

export async function POST(request: Request) {
  try {
    const { paymentKey, orderId, amount } = await request.json();

    // 1. 필수 파라미터 검증
    if (!paymentKey || !orderId || amount == null) {
      return NextResponse.json(
        { success: false, error: "필수 파라미터가 누락되었습니다." },
        { status: 400 }
      );
    }

    // 2. 시크릿 키 환경변수 확인
    const secretKey = process.env.NEXT_PUBLIC_TOSS_SECRET_KEY;
    if (!secretKey) {
      console.error("[Toss Payments] TOSS_SECRET_KEY가 설정되지 않았습니다.");
      return NextResponse.json(
        { success: false, error: "서버 설정 오류입니다." },
        { status: 500 }
      );
    }

    // 3. 결제 금액(amount)이 유효한 숫자인지 확인
    const amountNumber = Number(amount);
    if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
      return NextResponse.json(
        { success: false, error: "결제 금액이 유효하지 않습니다." },
        { status: 400 }
      );
    }

    // 4. Basic 인증 헤더 생성
    const authHeader =
      "Basic " + Buffer.from(`${secretKey}:`).toString("base64");

    // 5. 토스페이먼츠 결제 승인 API 호출
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

    const data = await response.json();

    // 6. 토스페이먼츠 응답 처리
    if (!response.ok) {
      console.error("[Toss Payments Confirm Error]", data);
      return NextResponse.json(
        { success: false, error: data },
        { status: response.status }
      );
    }

    // 7. TODO: 결제 성공 시 데이터베이스에 주문 정보 저장 로직 구현
    console.log("✅ 결제 승인 성공:", data);
    // 예: await saveOrderToDatabase({ orderId, amount: amountNumber, paymentDetails: data });
    
    return NextResponse.json({ success: true, data });

  } catch (error: any) {
    console.error("[Toss Payments Confirm Exception]", error);
    return NextResponse.json(
      { success: false, error: error.message || "알 수 없는 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}