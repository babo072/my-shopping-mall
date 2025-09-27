import Link from 'next/link';
import { XCircle } from 'lucide-react';

// 실패 페이지는 간단한 정보만 보여주므로 서버 컴포넌트로 만듭니다.
export default function PaymentFailPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const errorCode = searchParams.code;
  const errorMessage = searchParams.message;

  return (
    <div className="bg-slate-900 text-white min-h-screen flex flex-col items-center justify-center text-center">
      <XCircle className="w-16 h-16 text-red-500 mb-4" />
      <h1 className="text-3xl font-bold mb-2">결제에 실패했습니다.</h1>
      <p className="text-slate-400 mb-8">다시 시도해주시기 바랍니다.</p>
      
      <div className="bg-slate-800 p-4 rounded-lg text-left max-w-md w-full">
        <p className="text-sm"><b>에러 코드:</b> <span className="font-mono">{errorCode}</span></p>
        <p className="text-sm mt-1"><b>실패 사유:</b> <span className="font-mono">{errorMessage}</span></p>
      </div>

      <Link
        href="/cart"
        className="mt-10 bg-slate-600 hover:bg-slate-700 text-white font-bold py-3 px-6 rounded-lg"
      >
        장바구니로 돌아가기
      </Link>
    </div>
  );
}