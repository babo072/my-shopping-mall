import Link from 'next/link';
// 이전에 utils/supabase/server.ts를 만드셨다면 아래 import를 사용하세요
import { createServerClientAsync } from "@/utils/supabase/server"; 
import { Camera } from 'lucide-react';

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
}

export const revalidate = 0;

export default async function Home() {
  const supabase = await createServerClientAsync();
  const { data: products, error } = await supabase.from('products').select('*');

  if (error) return <p className="text-white text-center p-8">상품을 불러오는 중 오류가 발생했습니다.</p>;
  if (!products || products.length === 0) return <p className="text-white text-center p-8">판매 중인 상품이 없습니다.</p>;

  return (
    <div className="bg-slate-900 text-white min-h-screen">
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-extrabold mb-10 text-center text-slate-100">Our Products</h1>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {products.map((product: Product) => (
            <Link href={`/product/${product.id}`} key={product.id} className="group">
              <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden h-full flex flex-col transition-all duration-300 ease-in-out group-hover:shadow-lg group-hover:shadow-cyan-500/10 group-hover:-translate-y-2">
                
                <div className="bg-slate-700 aspect-square flex items-center justify-center">
                  <Camera className="w-16 h-16 text-slate-500" />
                </div>
                
                <div className="p-5 flex flex-col flex-grow">
                  <h2 className="text-xl font-bold text-slate-100 truncate">{product.name}</h2>
                  <p className="text-sm text-slate-400 mt-2 flex-grow">{product.description}</p>
                  <p className="text-2xl font-semibold mt-4 text-right text-cyan-400">
                    {product.price.toLocaleString()}원
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}