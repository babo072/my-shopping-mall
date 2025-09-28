import { createServerClientAsync } from "@/utils/supabase/server";
import { notFound, redirect } from "next/navigation";
import EditProductForm from "@/components/admin/EditProductForm";

type EditProductPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params;
  const supabase = await createServerClientAsync();

  // 관리자 권한 확인
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') {
      const message = '관리자 권한이 없습니다.';
      return redirect(`/?error=${encodeURIComponent(message)}`);
    }
  } else {
    const message = '관리자 로그인이 필요합니다.';
    return redirect(`/login?message=${encodeURIComponent(message)}`);
  }
  
  // 수정할 상품의 현재 정보와 '이미지들'을 함께 불러옵니다.
  const { data: product } = await supabase
    .from('products')
    .select('*, product_images(*)')
    .eq('id', id)
    .single();

  if (!product) {
    notFound();
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">상품 수정</h1>
      <div className="bg-slate-800 p-6 rounded-lg max-w-2xl mx-auto">
        <EditProductForm product={product} />
      </div>
    </main>
  );
}