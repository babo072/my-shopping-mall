// src/app/product/[id]/page.tsx
import { notFound } from "next/navigation";
import { Camera, ShoppingCart } from "lucide-react";
import { createServerClientAsync } from "@/utils/supabase/server";

export const revalidate = 0;

type ProductDetailPageProps = {
  params: Promise<{ id: string }>; // ✅ params는 Promise
};

// DB 조회 함수 (서버용 Supabase 클라이언트 사용)
async function getProductById(id: string) {
  const supabase = await createServerClientAsync();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Supabase fetch error:", error.message);
    return null;
  }
  return data as { id: string; name: string; description?: string; price: number } | null;
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { id } = await params;            // ✅ 먼저 await
  const product = await getProductById(id);

  if (!product) return notFound();

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
        <div className="bg-white border rounded-lg shadow-sm p-4">
          <div className="bg-gray-100 w-full aspect-square flex items-center justify-center rounded-md">
            <Camera className="w-24 h-24 text-gray-300" />
          </div>
        </div>

        <div className="flex flex-col">
          <h1 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4">
            {product.name}
          </h1>
          <p className="text-gray-600 mb-6 text-lg leading-relaxed">
            {product.description ?? ""}
          </p>
          <div className="text-4xl font-bold mb-8 text-right text-blue-600">
            {Number(product.price).toLocaleString()}원
          </div>
          <div className="flex items-center gap-4">
            <button className="flex-1 bg-blue-600 text-white font-bold py-4 px-6 rounded-lg hover:bg-blue-700 transition-all duration-300 ease-in-out flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
              <ShoppingCart className="w-5 h-5" />
              장바구니에 담기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
