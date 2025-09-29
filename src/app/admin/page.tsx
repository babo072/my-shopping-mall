import { createServerClientAsync } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Camera } from "lucide-react";
import AddProductForm from "@/components/admin/AddProductForm";
import DeleteButton from "@/components/admin/DeleteButton";

// 타입을 명확하게 정의합니다.
interface ProductImage {
  image_url: string;
}
interface Product {
  id: string;
  created_at: string;
  name: string;
  description: string | null;
  price: number;
  product_images: ProductImage[];
}

export default async function AdminPage() {
  const supabase = await createServerClientAsync();

  // 관리자 권한 확인
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    const message = '관리자 로그인이 필요합니다.';
    return redirect(`/login?message=${encodeURIComponent(message)}`);
  }
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (profileError || profile?.role !== 'admin') {
    const message = '관리자 권한이 없습니다.';
    return redirect(`/?error=${encodeURIComponent(message)}`);
  }

  // 상품 목록과 연결된 이미지 정보 함께 조회
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select(`
      *,
      product_images (
        image_url
      )
    `)
    .order('created_at', { ascending: false });

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">관리자 대시보드</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 새 상품 추가 폼 (클라이언트 컴포넌트) */}
        <AddProductForm />

        {/* 상품 목록 */}
        <div className="lg:col-span-2 bg-slate-800 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4">상품 목록</h2>
          <div className="space-y-4">
            {productsError && <p className="text-red-400">상품 목록을 불러오는 데 실패했습니다.</p>}
            {products && (products as Product[]).map(product => (
              <div key={product.id} className="bg-slate-700 p-4 rounded-md flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16 bg-slate-600 rounded-md overflow-hidden flex-shrink-0">
                    {product.product_images && product.product_images.length > 0 ? (
                      <Image
                        src={product.product_images[0].image_url}
                        alt={product.name}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Camera className="w-8 h-8 text-slate-500" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold">{product.name}</h3>
                    <p className="text-sm text-slate-400">{product.price.toLocaleString()}원</p>
                  </div>
                </div>
                <div className="flex gap-4 items-center flex-shrink-0">
                  <Link href={`/admin/edit/${product.id}`} className="text-sm text-slate-400 hover:text-white">
                    수정
                  </Link>
                  <DeleteButton productId={product.id} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
