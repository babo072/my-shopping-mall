'use server';

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { CartItem } from '@/store/cartStore';

export async function createOrder(items: CartItem[]) {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,         // 가능하면 서버 전용 키로 교체 권장
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,    // (예: SUPABASE_URL / SUPABASE_ANON_KEY)
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value ?? null;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {}
        },
        remove(name: string, options: CookieOptions) {
          try {
            // ✅ 빈 값 + 즉시 만료로 사실상 삭제 효과
            cookieStore.set({ name, value: '', ...options, maxAge: 0 });
          } catch {}
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: '로그인이 필요합니다.' as const };
  }

  // 총액 계산(정수 KRW 보정)
  const totalPrice = Math.round(
    items.reduce((sum, it) => sum + Number(it.price) * Number(it.quantity), 0)
  );

  // 1) 주문 생성
  const { data: orderData, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id: user.id,
      total_price: totalPrice,
      status: 'pending',
    })
    .select()
    .single();

  if (orderError || !orderData) {
    console.error('Order creation error:', orderError);
    return { success: false, error: '주문을 생성하지 못했습니다.' as const };
  }

  // 2) 주문 아이템 생성
  const orderItems = items.map((it) => ({
    order_id: orderData.id,
    product_id: it.id,
    quantity: Number(it.quantity),
    price: Number(it.price),
  }));

  const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
  if (itemsError) {
    console.error('Order items creation error:', itemsError);
    return { success: false, error: '주문 상품 정보를 저장하지 못했습니다.' as const };
  }

  return { success: true as const, order: orderData };
}
