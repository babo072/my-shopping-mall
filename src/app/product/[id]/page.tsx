import { notFound } from "next/navigation";
import { createServerClientAsync } from "@/utils/supabase/server";
import AddToCartButton from "@/components/AddToCartButton";
import ProductImageCarousel from "@/components/ProductImageCarousel";

// 필요한 타입을 명확하게 정의합니다.
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

export const revalidate = 0;

type ProductDetailPageProps = {
  params: Promise<{ id: string }>;
};

// product_images 테이블 정보까지 함께 불러오도록 쿼리를 수정합니다.
async function getProductById(id: string) {
  const supabase = await createServerClientAsync();
  const { data, error } = await supabase
    .from("products")
    .select("*, product_images(image_url)")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Supabase fetch error:", error.message);
    return null;
  }
  return data as Product | null;
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { id } = await params;
  const product = await getProductById(id);

  if (!product) {
    return notFound();
  }

  return (
    <div className="bg-slate-900 text-white min-h-screen">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          
          <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-sm p-4 sticky top-24">
            {/* 기존 이미지 영역을 캐러셀 컴포넌트로 교체 */}
            <ProductImageCarousel images={product.product_images} productName={product.name} />
          </div>
          
          <div className="flex flex-col">
            <h1 className="text-4xl lg:text-5xl font-extrabold text-slate-100 mb-4">
              {product.name}
            </h1>
            <p className="text-slate-400 mb-6 text-lg leading-relaxed">
              {product.description ?? "상품 설명이 없습니다."}
            </p>
            <div className="text-4xl font-bold mb-8 text-right text-cyan-400">
              {Number(product.price).toLocaleString()}원
            </div>
            <div className="flex items-center gap-4">
              {/* AddToCartButton은 product 전체 객체를 필요로 할 수 있으므로 전달 */}
              <AddToCartButton product={product} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}