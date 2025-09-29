'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { updateProduct, deleteProductImage } from '@/app/admin/actions';
import { createClient } from '@/utils/supabase/client';
import { XCircle } from 'lucide-react';

// product prop의 타입을 명확하게 정의합니다.
type ProductImage = {
  id: string;
  image_url: string;
};
type Product = {
  id: string;
  name: string;
  description: string | null;
  short_description: string | null;
  price: number;
  product_images: ProductImage[];
};

export default function EditProductForm({ product }: { product: Product }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();
  
  const [images, setImages] = useState(product.product_images);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    const formData = new FormData(event.currentTarget);
    const newImageFiles = formData.getAll('new_images') as File[];
    let newImageUrls: string[] = [];

    try {
      if (newImageFiles.length > 0 && newImageFiles[0].size > 0) {
        const uploadPromises = newImageFiles.map(file => {
          const filePath = `${crypto.randomUUID()}.${file.name.split('.').pop()}`;
          return supabase.storage.from('product-images').upload(filePath, file);
        });
        const uploadResults = await Promise.all(uploadPromises);
        
        const failedUploads = uploadResults.filter(r => r.error);
        if (failedUploads.length > 0) {
          throw new Error('새 이미지 업로드에 실패했습니다.');
        }
        
        newImageUrls = uploadResults.map(r => supabase.storage.from('product-images').getPublicUrl(r.data!.path).data.publicUrl);
      }
      
      await updateProduct(formData, newImageUrls);

    } catch (err) {
      const message = err instanceof Error ? err.message : '상품 수정 중 오류가 발생했습니다.';
      setError(message);
      setIsSubmitting(false);
    }
  };
  
  const handleDeleteImage = async (imageId: string, imageUrl: string) => {
    if (window.confirm('이 이미지를 영구적으로 삭제하시겠습니까?')) {
      const result = await deleteProductImage(imageId, imageUrl);
      if (result.error) {
        alert(result.error);
      } else {
        setImages(currentImages => currentImages.filter(img => img.id !== imageId));
        router.refresh();
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <input type="hidden" name="id" value={product.id} />
      
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-slate-400">상품명</label>
        <input type="text" name="name" id="name" required defaultValue={product.name} className="mt-1 w-full p-2 bg-slate-700 border border-slate-600 rounded-md"/>
      </div>

      <div>
        <label htmlFor="short_description" className="block text-sm font-medium text-slate-400">짧은 설명 (목록용)</label>
        <textarea name="short_description" id="short_description" rows={2} required 
          defaultValue={product.short_description || ''}
          className="mt-1 w-full p-2 bg-slate-700 border border-slate-600 rounded-md"
        ></textarea>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-slate-400">상세 설명 (HTML 가능)</label>
        <textarea name="description" id="description" rows={5} required 
          defaultValue={product.description || ''}
          className="mt-1 w-full p-2 bg-slate-700 border border-slate-600 rounded-md"
        ></textarea>
      </div>

      <div>
        <label htmlFor="price" className="block text-sm font-medium text-slate-400">가격</label>
        <input type="number" name="price" id="price" required defaultValue={product.price} className="mt-1 w-full p-2 bg-slate-700 border border-slate-600 rounded-md"/>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-400 mb-2">기존 이미지</label>
        {images.length > 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
            {images.map((image) => (
              <div key={image.id} className="relative group aspect-square overflow-hidden rounded-md">
                <Image
                  src={image.image_url}
                  alt="상품 이미지"
                  fill
                  sizes="160px"
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={() => handleDeleteImage(image.id, image.image_url)}
                  className="absolute top-1 right-1 bg-red-600/80 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                  aria-label="이미지 삭제"
                >
                  <XCircle size={20} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">등록된 이미지가 없습니다.</p>
        )}
      </div>

      <div>
        <label htmlFor="new_images" className="block text-sm font-medium text-slate-400">새 이미지 추가 (다중 선택 가능)</label>
        <input type="file" name="new_images" id="new_images" accept="image/*" multiple className="mt-1 w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-cyan-50 file:text-cyan-700 hover:file:bg-cyan-100"/>
      </div>
      
      <button type="submit" disabled={isSubmitting} className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-4 rounded-md disabled:opacity-50 transition-colors">
        {isSubmitting ? '저장 중...' : '변경사항 저장'}
      </button>
      {error && <p className="text-sm text-red-400 mt-2 text-center">{error}</p>}
    </form>
  );
}
