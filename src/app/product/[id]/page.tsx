import { notFound } from "next/navigation";
import { Camera } from "lucide-react";
import { createServerClientAsync } from "@/utils/supabase/server";
import AddToCartButton from "@/components/AddToCartButton";
import type { Product } from "@/app/page";

export const revalidate = 0;

type ProductDetailPageProps = {
  params: Promise<{ id: string }>;
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
  return data as Product | null;
}

export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  const { id } = await params;
  const product = await getProductById(id);

  if (!product) {
    return notFound();
  }

  return (
    <div className="bg-slate-900 text-white min-h-screen">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-sm p-4">
            <div className="bg-slate-700 w-full aspect-square flex items-center justify-center rounded-md">
              <Camera className="w-24 h-24 text-slate-500" />
            </div>
          </div>

          <div className="flex flex-col">
            <h1 className="text-4xl lg:text-5xl font-extrabold text-slate-100 mb-4">
              {product.name}
            </h1>
            <p className="text-slate-400 mb-6 text-lg leading-relaxed">
              {product.description ?? ""}
            </p>
            <div className="text-4xl font-bold mb-8 text-right text-cyan-400">
              {Number(product.price).toLocaleString()}원
            </div>
            <div className="flex items-center gap-4">
              <AddToCartButton product={product} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}