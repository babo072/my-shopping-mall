'use server';

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { CartItem } from '@/store/cartStore';
import { isOrderStatusValue } from '@/lib/order-status';

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

export async function updateOrderStatus(formData: FormData) {
  const orderId = formData.get('orderId');
  const status = formData.get('status');
  const redirectTo = formData.get('redirectTo');

  if (typeof orderId !== 'string' || orderId.length === 0) {
    return { error: '주문 ID가 올바르지 않습니다.' } as const;
  }

  if (typeof status !== 'string' || !isOrderStatusValue(status)) {
    return { error: '선택한 주문 상태가 올바르지 않습니다.' } as const;
  }

  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
            cookieStore.set({ name, value: '', ...options, maxAge: 0 });
          } catch {}
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: '로그인이 필요합니다.' } as const;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.role !== 'admin') {
    return { error: '관리자만 주문 상태를 변경할 수 있습니다.' } as const;
  }

  const { error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId);

  if (error) {
    console.error('주문 상태 업데이트 오류:', error);
    return { error: '주문 상태를 변경하는 데 실패했습니다.' } as const;
  }

  revalidatePath('/orders');
  revalidatePath(`/orders/${orderId}`);

  if (typeof redirectTo === 'string' && redirectTo.startsWith('/')) {
    redirect(redirectTo);
  }

  redirect('/orders');
}

export async function updateOrderStatusBatch(formData: FormData) {
  const orderIdsRaw = formData.getAll('orderIds');
  const status = formData.get('status');
  const redirectTo = formData.get('redirectTo');

  const orderIds = orderIdsRaw
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0);

  if (orderIds.length === 0) {
    return { error: '선택한 주문이 없습니다.' } as const;
  }

  if (typeof status !== 'string' || !isOrderStatusValue(status)) {
    return { error: '선택한 주문 상태가 올바르지 않습니다.' } as const;
  }

  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
            cookieStore.set({ name, value: '', ...options, maxAge: 0 });
          } catch {}
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: '로그인이 필요합니다.' } as const;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.role !== 'admin') {
    return { error: '관리자만 주문 상태를 변경할 수 있습니다.' } as const;
  }

  const { error } = await supabase
    .from('orders')
    .update({ status })
    .in('id', orderIds);

  if (error) {
    console.error('주문 상태 일괄 업데이트 오류:', error);
    return { error: '주문 상태를 일괄 변경하는 데 실패했습니다.' } as const;
  }

  revalidatePath('/orders');
  for (const id of orderIds) {
    revalidatePath(`/orders/${id}`);
  }

  if (typeof redirectTo === 'string' && redirectTo.startsWith('/')) {
    redirect(redirectTo);
  }

  redirect('/orders');
}

export async function updateOrderMemo(formData: FormData) {
  const orderId = formData.get('orderId');
  const memo = formData.get('adminNote');
  const redirectTo = formData.get('redirectTo');

  if (typeof orderId !== 'string' || orderId.length === 0) {
    return { error: '주문 ID가 올바르지 않습니다.' } as const;
  }

  if (typeof memo !== 'string') {
    return { error: '메모 값이 올바르지 않습니다.' } as const;
  }

  const adminNote = memo.trim() === '' ? null : memo.trim();

  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
            cookieStore.set({ name, value: '', ...options, maxAge: 0 });
          } catch {}
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: '로그인이 필요합니다.' } as const;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.role !== 'admin') {
    return { error: '관리자만 메모를 작성할 수 있습니다.' } as const;
  }

  const { error } = await supabase
    .from('orders')
    .update({ admin_note: adminNote })
    .eq('id', orderId);

  if (error) {
    console.error('주문 메모 업데이트 오류:', error);
    return { error: '주문 메모를 저장하는 데 실패했습니다.' } as const;
  }

  revalidatePath('/orders');
  revalidatePath(`/orders/${orderId}`);

  if (typeof redirectTo === 'string' && redirectTo.startsWith('/')) {
    redirect(redirectTo);
  }

  redirect(`/orders/${orderId}`);
}
