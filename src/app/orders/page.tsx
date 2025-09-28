import { createServerClientAsync } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export const revalidate = 0; // 항상 최신 데이터를 불러오도록 설정

// Supabase 자동 생성 타입이 복잡하므로, 필요한 데이터 타입만 직접 정의합니다.
type OrderItem = {
  quantity: number;
  price: number;
  products: {
    name: string;
  } | null;
};

type Order = {
  id: string;
  created_at: string;
  total_price: number;
  status: string;
  order_items: OrderItem[];
};

export default async function OrdersPage() {
  const supabase = await createServerClientAsync();
  
  // 1. 현재 로그인된 사용자 정보 가져오기
  const { data: { user } } = await supabase.auth.getUser();

  // 2. 로그인되어 있지 않으면 로그인 페이지로 리디렉션
  if (!user) {
    return redirect('/login?message=로그인이 필요합니다.');
  }

  // 3. 현재 사용자의 주문 내역을 가져오기 (가장 최근 주문부터)
  //    관계형 쿼리를 사용하여 orders와 연결된 order_items, products 정보까지 한 번에 가져옵니다.
  const { data: orders, error } = await supabase
    .from('orders')
    .select(`
      id,
      created_at,
      total_price,
      status,
      order_items (
        quantity,
        price,
        products (
          name
        )
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("주문 내역 조회 오류:", error);
    return <p className="text-center p-8 text-red-400">주문 내역을 불러오는 중 오류가 발생했습니다.</p>;
  }

  return (
    <main className="container mx-auto px-4 py-12 text-white">
      <h1 className="text-3xl font-bold mb-8">주문 내역</h1>
      
      {orders.length === 0 ? (
        <div className="text-center py-16 bg-slate-800 rounded-lg">
          <p className="text-slate-400">아직 주문 내역이 없습니다.</p>
          <Link href="/" className="mt-4 inline-block bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded">
            쇼핑 계속하기
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {(orders as Order[]).map(order => (
            <div key={order.id} className="bg-slate-800 border border-slate-700 rounded-lg shadow-lg p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                <div className="mb-2 sm:mb-0">
                  <span className="text-sm text-slate-400">주문번호</span>
                  <p className="font-mono text-lg">{order.id}</p>
                </div>
                <div className="text-sm text-slate-400">
                  {new Date(order.created_at).toLocaleString('ko-KR')}
                </div>
              </div>
              
              <div className="border-t border-slate-700 pt-4">
                {order.order_items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center py-2">
                    <div>
                      <p className="font-semibold text-slate-200">{item.products?.name || '삭제된 상품'}</p>
                      <p className="text-sm text-slate-400">
                        {item.quantity}개 x {item.price.toLocaleString()}원
                      </p>
                    </div>
                    <p className="font-medium text-slate-300">
                      {(item.quantity * item.price).toLocaleString()}원
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-700 pt-4 mt-4 flex justify-between items-center">
                <span 
                  className={`px-3 py-1 text-sm font-semibold rounded-full ${
                    order.status === 'paid' 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-yellow-500/20 text-yellow-400'
                  }`}
                >
                  {order.status === 'paid' ? '결제 완료' : '처리중'}
                </span>
                <p className="font-bold text-xl">총 결제 금액: {order.total_price.toLocaleString()}원</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}