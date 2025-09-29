import { notFound } from "next/navigation";
import { createServerClientAsync } from "@/utils/supabase/server";
import AddToCartButton from "@/components/AddToCartButton";
import ProductImageCarousel from "@/components/ProductImageCarousel";
import DOMPurify from 'isomorphic-dompurify';

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

  const sanitizedDescription = DOMPurify.sanitize(product.description ?? '', {
    USE_PROFILES: { html: true },
    ADD_TAGS: ['img', 'figure', 'figcaption'],
    ADD_ATTR: ['loading', 'target', 'rel', 'srcset', 'sizes'],
  });

  return (
    <div className="bg-slate-900 text-white min-h-screen">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] items-start">
          <div className="space-y-6">
            <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-sm p-4">
              <ProductImageCarousel images={product.product_images} productName={product.name} />
            </div>

            <div className="rounded-lg border border-slate-700 bg-slate-800/80 p-6">
              <div className="flex flex-col gap-6">
                <div>
                  <p className="text-sm uppercase tracking-wide text-slate-400">가격</p>
                  <p className="text-3xl font-bold text-cyan-400">
                    {Number(product.price).toLocaleString()}원
                  </p>
                </div>
                <AddToCartButton product={product} />
              </div>
            </div>
          </div>

          <div className="flex flex-col">
            <h1 className="text-4xl lg:text-5xl font-extrabold text-slate-100 mb-4">
              {product.name}
            </h1>

            {/* 소독된 HTML을 렌더링합니다. */}
            <div
              className="prose prose-invert prose-dark max-w-none text-slate-300"
              dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
