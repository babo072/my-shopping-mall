'use client';

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { addProduct } from "@/app/admin/actions";

export default function AddProductForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const supabase = createClient();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    const formData = new FormData(event.currentTarget);
    const files = formData.getAll('image') as File[];

    if (files.length === 0 || files[0].size === 0) {
      setError('하나 이상의 이미지 파일을 선택해주세요.');
      setIsSubmitting(false);
      return;
    }

    try {
      // 1. 여러 파일을 병렬로 업로드합니다.
      const uploadPromises = files.map(file => {
        const fileExt = file.name.split('.').pop();
        const filePath = `${crypto.randomUUID()}.${fileExt}`;
        return supabase.storage.from('product-images').upload(filePath, file);
      });

      const uploadResults = await Promise.all(uploadPromises);

      const failedUploads = uploadResults.filter(result => result.error);
      if (failedUploads.length > 0) {
        throw new Error('일부 이미지 업로드에 실패했습니다: ' + failedUploads.map(f => f.error!.message).join(', '));
      }

      // 2. 성공한 모든 파일의 공개 URL을 가져옵니다.
      const imageUrls = uploadResults.map(result => {
        const filePath = result.data!.path;
        return supabase.storage.from('product-images').getPublicUrl(filePath).data.publicUrl;
      });

      // 3. 서버 액션을 호출하여 DB에 상품 정보 저장
      const productData = {
        name: formData.get('name') as string,
        description: formData.get('description') as string,
        price: Number(formData.get('price')),
        imageUrls,
      };

      const result = await addProduct(productData);

      if (result.error) {
        throw new Error(result.error);
      } else {
        setSuccessMessage('상품이 성공적으로 추가되었습니다.');
        (event.target as HTMLFormElement).reset();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="lg:col-span-1 bg-slate-800 p-6 rounded-lg h-fit">
      <h2 className="text-xl font-bold mb-4">새 상품 추가</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-slate-400">상품명</label>
          <input type="text" name="name" id="name" required className="mt-1 w-full px-3 py-2 text-white bg-slate-700 border border-slate-600 rounded-md"/>
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-slate-400">설명</label>
          <textarea name="description" id="description" rows={3} required className="mt-1 w-full px-3 py-2 text-white bg-slate-700 border border-slate-600 rounded-md"></textarea>
        </div>
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-slate-400">가격</label>
          <input type="number" name="price" id="price" required className="mt-1 w-full px-3 py-2 text-white bg-slate-700 border border-slate-600 rounded-md"/>
        </div>
        <div>
          <label htmlFor="image" className="block text-sm font-medium text-slate-400">상품 이미지 (여러 개 선택 가능)</label>
          <input type="file" name="image" id="image" accept="image/*" required multiple className="mt-1 w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-cyan-50 file:text-cyan-700 hover:file:bg-cyan-100"/>
        </div>
        <button type="submit" disabled={isSubmitting} className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-md transition-colors disabled:opacity-50">
          {isSubmitting ? '처리 중...' : '상품 추가하기'}
        </button>
        {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
        {successMessage && <p className="text-sm text-green-400 mt-2">{successMessage}</p>}
      </form>
    </div>
  );
}