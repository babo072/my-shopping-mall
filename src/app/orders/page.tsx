import { createServerClientAsync } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { updateOrderStatus, updateOrderStatusBatch } from "@/app/actions/order";
import {
  ORDER_STATUS_OPTIONS,
  isOrderStatusValue,
  type OrderStatusValue,
} from "@/lib/order-status";

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
  user_id: string;
  created_at: string;
  total_price: number;
  status: string;
  admin_note: string | null;
  order_items: OrderItem[];
};

type ProfileSummary = {
  id: string;
  email: string | null;
  user_name: string | null;
  phone_number: string | null;
  address: string | null;
  detail_address: string | null;
  postcode: string | null;
};

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; sort?: string }>;
}) {
  const params = await searchParams;
  const requestedStatus = params?.status;
  const searchQuery = typeof params?.q === 'string' ? params.q.trim() : '';

  type SortOption = 'recent' | 'oldest' | 'amount-desc' | 'amount-asc';

  const sortOption: SortOption = (() => {
    const value = (params?.sort ?? '').toString().toLowerCase();
    switch (value) {
      case 'oldest':
      case 'amount-desc':
      case 'amount-asc':
        return value;
      default:
        return 'recent';
    }
  })();
  const supabase = await createServerClientAsync();
  
  // 1. 현재 로그인된 사용자 정보 가져오기
  const { data: { user } } = await supabase.auth.getUser();

  // 2. 로그인되어 있지 않으면 로그인 페이지로 리디렉션
  if (!user) {
    return redirect('/login?message=로그인이 필요합니다.');
  }

  // 3. 사용자 권한 확인 (관리자는 모든 주문을 확인할 수 있음)
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, email, user_name, phone_number, address, detail_address, postcode')
    .eq('id', user.id)
    .maybeSingle();

  const isAdmin = profile?.role === 'admin';
  const userMetadata = (user.user_metadata ?? {}) as Record<string, unknown>;

  const currentProfile: ProfileSummary | null = profile
    ? {
        id: profile.id ?? user.id,
        email: profile.email ?? user.email ?? null,
        user_name:
          profile.user_name ??
          (typeof userMetadata.user_name === 'string' ? userMetadata.user_name : null),
        phone_number:
          profile.phone_number ??
          (typeof userMetadata.phone_number === 'string' ? userMetadata.phone_number : null),
        address:
          profile.address ??
          (typeof userMetadata.address === 'string' ? userMetadata.address : null),
        detail_address:
          profile.detail_address ??
          (typeof userMetadata.detail_address === 'string'
            ? userMetadata.detail_address
            : null),
        postcode:
          profile.postcode ??
          (typeof userMetadata.postcode === 'string' ? userMetadata.postcode : null),
      }
    : {
        id: user.id,
        email: user.email ?? null,
        user_name:
          typeof userMetadata.user_name === 'string' ? userMetadata.user_name : null,
        phone_number:
          typeof userMetadata.phone_number === 'string' ? userMetadata.phone_number : null,
        address:
          typeof userMetadata.address === 'string' ? userMetadata.address : null,
        detail_address:
          typeof userMetadata.detail_address === 'string'
            ? userMetadata.detail_address
            : null,
        postcode:
          typeof userMetadata.postcode === 'string' ? userMetadata.postcode : null,
      };

  // 4. 주문 내역을 가져오기 (관리자는 전체, 일반 사용자는 자신의 주문만)
  let baseQuery = supabase
    .from('orders')
    .select(`
      id,
      admin_note,
      user_id,
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
    `);

  switch (sortOption) {
    case 'oldest':
      baseQuery = baseQuery.order('created_at', { ascending: true });
      break;
    case 'amount-desc':
      baseQuery = baseQuery.order('total_price', { ascending: false });
      break;
    case 'amount-asc':
      baseQuery = baseQuery.order('total_price', { ascending: true });
      break;
    case 'recent':
    default:
      baseQuery = baseQuery.order('created_at', { ascending: false });
      break;
  }

  const ordersQuery = isAdmin ? baseQuery : baseQuery.eq('user_id', user.id);

  type StatusFilter = OrderStatusValue | 'in-progress';

  const statusFilter: StatusFilter | undefined = (() => {
    if (!requestedStatus || requestedStatus === 'all') return undefined;
    if (requestedStatus === 'in-progress') return 'in-progress';
    return isOrderStatusValue(requestedStatus) ? requestedStatus : undefined;
  })();

  const filteredQuery = (() => {
    if (!isAdmin || !statusFilter) return ordersQuery;
    if (statusFilter === 'in-progress') {
      return ordersQuery.in('status', ['paid', 'pending', 'shipped']);
    }
    return ordersQuery.eq('status', statusFilter);
  })();

  const { data: orders, error } = await filteredQuery;

  if (error) {
    console.error("주문 내역 조회 오류:", error);
    return <p className="text-center p-8 text-red-400">주문 내역을 불러오는 중 오류가 발생했습니다.</p>;
  }

  const orderList = (orders as Order[] | null) ?? [];

  const statusLabelMap = new Map<OrderStatusValue, string>(
    ORDER_STATUS_OPTIONS.map((option) => [option.value, option.label])
  );

  const statusBadgeClassMap: Record<OrderStatusValue, string> = {
    paid: "bg-emerald-500/20 text-emerald-300",
    pending: "bg-amber-400/20 text-amber-200",
    shipped: "bg-sky-500/20 text-sky-200",
    delivered: "bg-indigo-500/20 text-indigo-200",
  };

  const profilesById: Record<string, ProfileSummary> = {};

  if (currentProfile) {
    profilesById[currentProfile.id] = currentProfile;
  }

  if (isAdmin && orderList.length > 0) {
    const userIds = Array.from(new Set(orderList.map((order) => order.user_id)));

    const { data: profileRows, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, user_name, phone_number, address, detail_address, postcode')
      .in('id', userIds);

    if (profilesError) {
      console.error('주문자 프로필 조회 오류:', profilesError);
    } else if (profileRows) {
      for (const row of profileRows as Array<ProfileSummary & { id: string }>) {
        profilesById[row.id] = {
          id: row.id,
          email: row.email,
          user_name: row.user_name,
          phone_number: row.phone_number,
          address: row.address,
          detail_address: row.detail_address,
          postcode: row.postcode,
        };
      }
    }
  }

  const normalizedSearch = searchQuery.toLowerCase();

  const visibleOrders = orderList.filter((order) => {
    if (!normalizedSearch) return true;
    const profileInfo = profilesById[order.user_id];
    return (
      order.id.toLowerCase().includes(normalizedSearch) ||
      (profileInfo?.email?.toLowerCase().includes(normalizedSearch) ?? false) ||
      (profileInfo?.user_name?.toLowerCase().includes(normalizedSearch) ?? false)
    );
  });

  const createStatusHref = (value: string) => {
    const nextParams = new URLSearchParams();
    if (value !== 'all') {
      nextParams.set('status', value);
    }
    if (searchQuery) nextParams.set('q', searchQuery);
    if (sortOption !== 'recent') nextParams.set('sort', sortOption);
    const queryString = nextParams.toString();
    return `/orders${queryString ? `?${queryString}` : ''}`;
  };

  const statusFilterLabel = statusFilter ?? 'all';

  const currentParams = new URLSearchParams();
  if (statusFilterLabel !== 'all') currentParams.set('status', statusFilterLabel);
  if (searchQuery) currentParams.set('q', searchQuery);
  if (sortOption !== 'recent') currentParams.set('sort', sortOption);
  const currentPath = currentParams.toString()
    ? `/orders?${currentParams.toString()}`
    : '/orders';

  return (
    <main className="container mx-auto px-4 py-12 text-white">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <h1 className="text-3xl font-bold">주문 내역</h1>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
          {isAdmin && (
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'all', label: '전체' },
                { value: 'in-progress', label: '진행중' },
                ...ORDER_STATUS_OPTIONS,
              ].map((option) => {
                const matchesFilter =
                  option.value === 'all'
                    ? !statusFilter
                    : option.value === 'in-progress'
                      ? statusFilter === 'in-progress'
                      : statusFilter === option.value;
                return (
                  <Link
                    key={option.value}
                    href={createStatusHref(option.value)}
                    className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                      matchesFilter
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-slate-600 text-slate-200 hover:border-primary hover:text-primary'
                    }`}
                  >
                    {option.label}
                  </Link>
                );
              })}
            </div>
          )}
          <form className="flex flex-wrap items-center gap-2" action="/orders" method="get">
            {statusFilterLabel !== 'all' && (
              <input type="hidden" name="status" value={statusFilterLabel} />
            )}
            <input
              type="text"
              name="q"
              defaultValue={searchQuery}
              placeholder="주문번호, 이메일, 이름 검색"
              className="w-48 rounded-md border border-slate-600 bg-slate-900/80 px-3 py-2 text-sm text-slate-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <select
              name="sort"
              defaultValue={sortOption}
              className="rounded-md border border-slate-600 bg-slate-900/80 px-3 py-2 text-sm text-slate-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="recent">최신순</option>
              <option value="oldest">오래된 순</option>
              <option value="amount-desc">금액 높은 순</option>
              <option value="amount-asc">금액 낮은 순</option>
            </select>
            <button
              type="submit"
              className="rounded-md border border-primary px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/10"
            >
              검색
            </button>
          </form>
        </div>
      </div>

      {isAdmin && (
        <form
          id="batch-update-form"
          action={updateOrderStatusBatch}
          className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-slate-700 bg-slate-900/80 p-4 text-sm"
        >
          <input type="hidden" name="redirectTo" value={currentPath} />
          <label htmlFor="batch-status" className="font-semibold text-slate-200">
            선택한 주문 상태
          </label>
          <select
            id="batch-status"
            name="status"
            className="rounded-md border border-slate-600 bg-slate-900/80 px-3 py-2 text-slate-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            defaultValue={statusFilterLabel !== 'all' && statusFilterLabel !== 'in-progress' ? statusFilterLabel : 'paid'}
          >
            {ORDER_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-md border border-primary px-4 py-2 font-semibold text-primary transition-colors hover:bg-primary/10"
          >
            선택 상태 변경
          </button>
          <p className="text-xs text-slate-400">
            체크박스로 주문을 선택한 뒤 상태를 일괄 변경하세요.
          </p>
        </form>
      )}

      {visibleOrders.length === 0 ? (
        <div className="text-center py-16 bg-slate-800 rounded-lg">
          <p className="text-slate-400">
            {searchQuery
              ? `"${searchQuery}"에 대한 주문을 찾을 수 없습니다.`
              : '아직 주문 내역이 없습니다.'}
          </p>
          {!isAdmin && (
            <Link
              href="/"
              className="mt-4 inline-block bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded"
            >
              쇼핑 계속하기
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {visibleOrders.map(order => {
            const profileInfo = profilesById[order.user_id];
            const orderItems = Array.isArray(order.order_items)
              ? order.order_items
              : [];
            const purchaserName =
              profileInfo?.user_name || profileInfo?.email || order.user_id;
            const purchaserEmail = profileInfo?.email;
            const primaryItem = orderItems[0];
            const distinctItemCount = orderItems.length;
            const quantityTotal = orderItems.reduce(
              (acc, item) => acc + Number(item.quantity ?? 0),
              0
            );
            const productSummary = (() => {
              if (!primaryItem) return '상품 없음';
              if (distinctItemCount > 1) {
                return `${primaryItem.products?.name ?? '상품'} 외 ${distinctItemCount - 1}건`;
              }
              return primaryItem.products?.name ?? '상품 1건';
            })();
            const shippingAddressLine = [
              profileInfo?.postcode,
              profileInfo?.address,
              profileInfo?.detail_address,
            ]
              .filter(Boolean)
              .join('\n');
            const shippingPhone = profileInfo?.phone_number;

            return (
            <div key={order.id} className="bg-slate-800 border border-slate-700 rounded-lg shadow-lg p-6">
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-center gap-3">
                  {isAdmin && (
                    <input
                      type="checkbox"
                      form="batch-update-form"
                      name="orderIds"
                      value={order.id}
                      className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-primary focus:ring-primary/50"
                      aria-label={`${order.id} 선택`}
                    />
                  )}
                  <div>
                    <span className="text-sm text-slate-400">주문번호</span>
                    <p className="font-mono text-lg text-slate-100">{order.id}</p>
                  </div>
                </div>
                <div className="text-sm text-slate-400">
                  {new Date(order.created_at).toLocaleString('ko-KR')}
                </div>
              </div>

              <div className="mb-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg bg-slate-900/60 p-3 text-sm text-slate-300">
                  <p className="font-semibold text-slate-200">주문자 정보</p>
                  <p className="mt-1">이름/별칭: {purchaserName}</p>
                  {purchaserEmail && <p>이메일: {purchaserEmail}</p>}
                  {profileInfo?.phone_number && <p>연락처: {profileInfo.phone_number}</p>}
                  {order.user_id !== user.id && (
                    <p className="text-xs text-slate-400">고객 ID: {order.user_id}</p>
                  )}
                </div>
                <div className="rounded-lg bg-slate-900/60 p-3 text-sm text-slate-300">
                  <p className="font-semibold text-slate-200">배송 주소</p>
                  {shippingAddressLine ? (
                    <p className="mt-1 whitespace-pre-line">{shippingAddressLine}</p>
                  ) : (
                    <p className="mt-1 text-slate-500">등록된 배송 주소가 없습니다.</p>
                  )}
                  {shippingPhone && <p className="mt-1">연락처: {shippingPhone}</p>}
                  {isAdmin && order.admin_note && (
                    <p className="mt-2 text-xs text-primary/80">메모: {order.admin_note}</p>
                  )}
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

              <div className="mt-4 flex flex-col gap-3 border-t border-slate-700 pt-4 sm:flex-row sm:items-center sm:justify-between">
                {isAdmin ? (
                  <form action={updateOrderStatus} className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <input type="hidden" name="orderId" value={order.id} />
                    <input type="hidden" name="redirectTo" value={currentPath} />
                    <label
                      htmlFor={`status-${order.id}`}
                      className="text-xs font-semibold uppercase tracking-wide text-slate-400"
                    >
                      주문 상태
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <select
                        id={`status-${order.id}`}
                        name="status"
                        defaultValue={isOrderStatusValue(order.status) ? order.status : 'paid'}
                        className="rounded-md border border-slate-600 bg-slate-900/80 px-3 py-2 text-sm text-slate-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                      >
                        {ORDER_STATUS_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <button
                        type="submit"
                        className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-sky-400"
                      >
                        업데이트
                      </button>
                      <Link
                        href={`/orders/${order.id}`}
                        className="rounded-md border border-slate-600 px-3 py-2 text-sm text-slate-200 transition-colors hover:border-primary hover:text-primary"
                      >
                        상세 보기
                      </Link>
                    </div>
                  </form>
                ) : (
                  <span
                    className={`px-3 py-1 text-sm font-semibold uppercase tracking-wide ${
                      isOrderStatusValue(order.status)
                        ? statusBadgeClassMap[order.status]
                        : 'bg-slate-600/30 text-slate-200'
                    } rounded-full`}
                  >
                    {isOrderStatusValue(order.status)
                      ? statusLabelMap.get(order.status)
                      : '상태 미지정'}
                  </span>
                )}
                <div className="text-right text-slate-200">
                  <p className="text-sm text-slate-300">
                    상품: {productSummary} ({quantityTotal.toLocaleString()}개)
                  </p>
                  <p className="text-xl font-bold text-slate-100">
                    총 결제 금액: {order.total_price.toLocaleString()}원
                  </p>
                  <Link
                    href={`/orders/${order.id}`}
                    className="mt-2 inline-block text-sm text-primary hover:underline"
                  >
                    상세 페이지로 이동
                  </Link>
                </div>
              </div>
            </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
