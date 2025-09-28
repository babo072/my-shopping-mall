import Link from 'next/link';
import { createServerClientAsync } from "@/utils/supabase/server";
import { Camera } from 'lucide-react';

interface ProductImage {
  image_url: string;
}
export interface Product {
  id: string;
  created_at: string;
  name: string;
  description: string | null;
  price: number;
  product_images: ProductImage[];
}

export const revalidate = 0;

// 👇 1. searchParams를 받을 수 있도록 props 타입을 정의하고, 컴포넌트를 async로 변경합니다.
export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // 👇 2. searchParams 값을 await으로 받아옵니다.
  const params = await searchParams;
  const errorMessage = params?.error;

  const supabase = await createServerClientAsync();
  const { data: products, error } = await supabase
    .from('products')
    .select(`*, product_images (image_url)`)
    .order('created_at', { ascending: false });

  if (error) { /* ... */ }
  
  return (
    <div className="bg-slate-900 text-white">
      <div className="container mx-auto px-4 py-12">
        {/* 👇 3. 에러 메시지가 있으면 화면 상단에 표시합니다. */}
        {errorMessage && (
          <div className="mb-8 p-4 bg-red-500/20 border border-red-500/30 text-red-300 rounded-md text-center">
            <p>{typeof errorMessage === 'string' ? errorMessage : '오류가 발생했습니다.'}</p>
          </div>
        )}

        <h1 className="text-4xl font-extrabold mb-10 text-center text-slate-100">판매 상품</h1>
        
        {(!products || products.length === 0) ? (
          <div className="text-center py-16">
            <p className="text-slate-400">판매 중인 상품이 없습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {(products as Product[]).map((product) => (
              <Link href={`/product/${product.id}`} key={product.id} className="group">
                <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden h-full flex flex-col transition-all duration-300 ease-in-out group-hover:shadow-lg group-hover:shadow-cyan-500/10 group-hover:-translate-y-2">
                  <div className="bg-slate-700 aspect-square flex items-center justify-center overflow-hidden">
                    {product.product_images && product.product_images.length > 0 ? (
                      <img 
                        src={product.product_images[0].image_url} 
                        alt={product.name} 
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <Camera className="w-16 h-16 text-slate-500" />
                    )}
                  </div>
                  <div className="p-5 flex flex-col flex-grow">
                    <h2 className="text-xl font-bold text-slate-100 truncate">{product.name}</h2>
                    <p className="text-sm text-slate-400 mt-2 flex-grow h-10 overflow-hidden">
                      {product.description}
                    </p>
                    <p className="text-2xl font-semibold mt-4 text-right text-cyan-400">
                      {product.price.toLocaleString()}원
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}