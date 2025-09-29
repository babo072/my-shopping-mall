import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createServerClientAsync } from "@/utils/supabase/server";
import { updateOrderStatus, updateOrderMemo } from "@/app/actions/order";
import {
  ORDER_STATUS_OPTIONS,
  type OrderStatusValue,
  isOrderStatusValue,
} from "@/lib/order-status";

export const revalidate = 0;

interface OrderItem {
  id: number;
  quantity: number;
  price: number;
  products: {
    id: string;
    name: string;
    price: number;
    product_images: { image_url: string }[];
  } | null;
}

interface OrderDetail {
  id: string;
  created_at: string;
  status: string;
  total_price: number;
  payment_key: string | null;
  user_id: string;
  admin_note: string | null;
  order_items: OrderItem[];
}

interface ProfileSummary {
  id: string;
  email: string | null;
  user_name: string | null;
  phone_number: string | null;
  postcode: string | null;
  address: string | null;
  detail_address: string | null;
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerClientAsync();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login?message=" + encodeURIComponent("로그인이 필요합니다."));
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const isAdmin = profile?.role === "admin";

  const { data: order, error } = await supabase
    .from("orders")
    .select(
      `
        id,
        created_at,
        status,
        total_price,
        payment_key,
        user_id,
        admin_note,
        order_items (
          id,
          quantity,
          price,
          products (
            id,
            name,
            price,
            product_images ( image_url )
          )
        )
      `
    )
    .eq("id", id)
    .maybeSingle<OrderDetail>();

  if (error || !order) {
    console.error("주문 상세 조회 오류:", error);
    notFound();
  }

  if (!isAdmin && order.user_id !== user.id) {
    notFound();
  }
  const { data: purchaserProfile } = await supabase
    .from("profiles")
    .select(
      "id, email, user_name, phone_number, postcode, address, detail_address"
    )
    .eq("id", order.user_id)
    .maybeSingle<ProfileSummary>();
  const statusLabelMap = new Map<OrderStatusValue, string>(
    ORDER_STATUS_OPTIONS.map((option) => [option.value, option.label])
  );

  const quantityTotal = order.order_items.reduce(
    (acc, item) => acc + Number(item.quantity ?? 0),
    0
  );

  return (
    <main className="container mx-auto px-4 py-12 text-white">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">주문 상세</h1>
        <Link
          href="/orders"
          className="rounded-md border border-slate-600 px-4 py-2 text-sm text-slate-200 hover:border-primary hover:text-primary"
        >
          주문 목록으로
        </Link>
      </div>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-slate-700 bg-slate-900/80 p-6">
            <h2 className="text-xl font-semibold text-slate-100">주문 정보</h2>
            <dl className="mt-4 space-y-2 text-sm text-slate-300">
              <div className="flex justify-between">
                <dt>주문번호</dt>
                <dd className="font-mono text-slate-100">{order.id}</dd>
              </div>
              <div className="flex justify-between">
                <dt>주문일시</dt>
                <dd>{new Date(order.created_at).toLocaleString("ko-KR")}</dd>
              </div>
              <div className="flex justify-between">
                <dt>결제키</dt>
                <dd>{order.payment_key ?? "-"}</dd>
              </div>
              <div className="flex justify-between">
                <dt>총 결제금액</dt>
                <dd className="font-semibold text-slate-100">
                  {order.total_price.toLocaleString()}원
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-xl border border-slate-700 bg-slate-900/80 p-6">
            <h2 className="text-xl font-semibold text-slate-100">주문자 정보</h2>
            <dl className="mt-4 space-y-2 text-sm text-slate-300">
              <div className="flex justify-between">
                <dt>이름/별칭</dt>
                <dd>{purchaserProfile?.user_name ?? "-"}</dd>
              </div>
              <div className="flex justify-between">
                <dt>이메일</dt>
                <dd>{purchaserProfile?.email ?? "-"}</dd>
              </div>
              <div className="flex justify-between">
                <dt>연락처</dt>
                <dd>{purchaserProfile?.phone_number ?? "-"}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-xl border border-slate-700 bg-slate-900/80 p-6">
            <h2 className="text-xl font-semibold text-slate-100">배송 주소</h2>
            <p className="mt-4 whitespace-pre-line text-sm text-slate-300">
              {[
                purchaserProfile?.postcode,
                purchaserProfile?.address,
                purchaserProfile?.detail_address,
              ]
                .filter(Boolean)
                .join("\n") || "등록된 배송 주소가 없습니다."}
            </p>
          </div>

          <div className="rounded-xl border border-slate-700 bg-slate-900/80 p-6">
            <h2 className="text-xl font-semibold text-slate-100">주문 상품</h2>
            <div className="mt-4 space-y-4">
              {order.order_items.length === 0 ? (
                <p className="text-sm text-slate-400">주문된 상품이 없습니다.</p>
              ) : (
                order.order_items.map((item) => {
                  const productName = item.products?.name ?? "삭제된 상품";
                  const productImage = item.products?.product_images?.[0]?.image_url;
                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 rounded-lg border border-slate-700 bg-slate-800/70 p-4"
                    >
                      <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md bg-slate-700">
                        {productImage ? (
                          <Image
                            src={productImage}
                            alt={productName}
                            fill
                            sizes="64px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-slate-500">
                            이미지 없음
                          </div>
                        )}
                      </div>
                      <div className="flex flex-1 items-center justify-between">
                        <div>
                          <p className="font-semibold text-slate-200">{productName}</p>
                          <p className="text-sm text-slate-400">
                            {item.quantity}개 × {item.price.toLocaleString()}원
                          </p>
                        </div>
                        <p className="text-sm font-semibold text-slate-100">
                          {(item.quantity * item.price).toLocaleString()}원
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <p className="mt-4 text-right text-sm text-slate-400">
              총 수량: {quantityTotal.toLocaleString()}개
            </p>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-xl border border-slate-700 bg-slate-900/80 p-6">
            <h2 className="text-lg font-semibold text-slate-100">주문 상태</h2>
            <form action={updateOrderStatus} className="mt-4 space-y-4">
              <input type="hidden" name="orderId" value={order.id} />
              <input type="hidden" name="redirectTo" value={`/orders/${order.id}`} />
              <select
                name="status"
                defaultValue={isOrderStatusValue(order.status) ? order.status : undefined}
                disabled={!isAdmin}
                className="w-full rounded-md border border-slate-600 bg-slate-900/70 px-3 py-2 text-sm text-slate-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-40"
              >
                {ORDER_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {isAdmin ? (
                <button
                  type="submit"
                  className="w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-sky-400"
                >
                  상태 업데이트
                </button>
              ) : (
                <p className="text-xs text-slate-400">관리자만 상태를 변경할 수 있습니다.</p>
              )}
            </form>
            <p className="mt-4 text-sm text-slate-300">
              현재 상태: {statusLabelMap.get(order.status as OrderStatusValue) ?? order.status}
            </p>
          </div>

          <div className="rounded-xl border border-slate-700 bg-slate-900/80 p-6">
            <h2 className="text-lg font-semibold text-slate-100">관리자 메모</h2>
            {isAdmin ? (
              <form action={updateOrderMemo} className="mt-4 space-y-3">
                <input type="hidden" name="orderId" value={order.id} />
                <input type="hidden" name="redirectTo" value={`/orders/${order.id}`} />
                <textarea
                  name="adminNote"
                  defaultValue={order.admin_note ?? ''}
                  rows={4}
                  placeholder="배송 특이사항, 고객 요청 등을 기록하세요."
                  className="w-full rounded-md border border-slate-600 bg-slate-900/80 px-3 py-2 text-sm text-slate-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>공란으로 저장하면 메모가 삭제됩니다.</span>
                  <button
                    type="submit"
                    className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-sky-400"
                  >
                    메모 저장
                  </button>
                </div>
              </form>
            ) : (
              <p className="mt-3 whitespace-pre-line text-sm text-slate-300">
                {order.admin_note ?? '등록된 메모가 없습니다.'}
              </p>
            )}
          </div>
        </aside>
      </section>
    </main>
  );
}
