'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// 상품 추가
export async function addProduct(productData: {
  name: string;
  description: string;
  short_description: string;
  price: number;
  imageUrls: string[];
}) {
  const { name, description, short_description, price, imageUrls } = productData;

  if (!name || !description || !short_description || isNaN(price) || price <= 0 || imageUrls.length === 0) {
    return { error: '모든 필드를 올바르게 입력하고, 하나 이상의 이미지를 추가해주세요.' };
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => cookieStore.get(name)?.value,
        set: (name, value, options) => {
          try { cookieStore.set({ name, value, ...options }); } catch {
            // ignore write failures in restricted contexts
          }
        },
        remove: (name, options) => {
          try { cookieStore.set({ name, value: '', ...options }); } catch {
            // ignore write failures in restricted contexts
          }
        },
      },
    }
  );

  const { data: product, error: productError } = await supabase
    .from('products')
    .insert([{ name, description, short_description, price }])
    .select().single();

  if (productError) {
    console.error('상품 추가 오류:', productError);
    return { error: '상품을 추가하는 데 실패했습니다.' };
  }

  const imageObjects = imageUrls.map(url => ({ product_id: product.id, image_url: url }));
  const { error: imageError } = await supabase.from('product_images').insert(imageObjects);
  if (imageError) {
    console.error('상품 이미지 저장 오류:', imageError);
    return { error: '상품 이미지를 저장하는 데 실패했습니다.' };
  }

  revalidatePath('/admin');
  revalidatePath('/');
  revalidatePath('/product/[id]', 'layout');
  return { success: true };
}

// 상품 삭제
export async function deleteProduct(productId: string) {
  if (!productId) { return { error: '상품 ID가 필요합니다.' }; }
  
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => cookieStore.get(name)?.value,
        set: (name, value, options) => {
          try { cookieStore.set({ name, value, ...options }); } catch {
            // ignore write failures in restricted contexts
          }
        },
        remove: (name, options) => {
          try { cookieStore.set({ name, value: '', ...options }); } catch {
            // ignore write failures in restricted contexts
          }
        },
      },
    }
  );

  const { error } = await supabase.from('products').delete().eq('id', productId);
  if (error) {
    console.error('상품 삭제 오류:', error);
    return { error: '상품을 삭제하는 데 실패했습니다.' };
  }

  revalidatePath('/admin');
  revalidatePath('/');
  return { success: true };
}

// 상품 정보 및 이미지 업데이트
export async function updateProduct(formData: FormData, newImageUrls: string[]) {
  const id = formData.get('id') as string;
  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const short_description = formData.get('short_description') as string;
  const price = Number(formData.get('price'));

  if (!id || !name || !description || !short_description || isNaN(price) || price <= 0) {
    return { error: '모든 필드를 올바르게 입력해주세요.' };
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => cookieStore.get(name)?.value,
        set: (name, value, options) => {
          try { cookieStore.set({ name, value, ...options }); } catch {
            // ignore write failures in restricted contexts
          }
        },
        remove: (name, options) => {
          try { cookieStore.set({ name, value: '', ...options }); } catch {
            // ignore write failures in restricted contexts
          }
        },
      },
    }
  );

  const { error: productUpdateError } = await supabase
    .from('products')
    .update({ name, description, short_description, price })
    .eq('id', id);
  if (productUpdateError) {
    console.error('상품 정보 수정 오류:', productUpdateError);
    return { error: '상품 정보 수정에 실패했습니다.' };
  }

  if (newImageUrls.length > 0) {
    const imageObjects = newImageUrls.map(url => ({ product_id: id, image_url: url }));
    const { error: imageInsertError } = await supabase.from('product_images').insert(imageObjects);
    if (imageInsertError) {
      console.error('새 상품 이미지 저장 오류:', imageInsertError);
      return { error: '새 상품 이미지 저장에 실패했습니다.' };
    }
  }

  revalidatePath('/admin');
  revalidatePath('/');
  revalidatePath(`/product/${id}`);
  redirect('/admin');
}

// 상품 개별 이미지 삭제
export async function deleteProductImage(imageId: string, imageUrl: string) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => cookieStore.get(name)?.value,
        set: (name, value, options) => {
          try { cookieStore.set({ name, value, ...options }); } catch {
            // ignore write failures in restricted contexts
          }
        },
        remove: (name, options) => {
          try { cookieStore.set({ name, value: '', ...options }); } catch {
            // ignore write failures in restricted contexts
          }
        },
      },
    }
  );
  
  const fileName = imageUrl.split('/').pop();
  if (fileName) {
    const { error: storageError } = await supabase.storage.from('product-images').remove([fileName]);
    if (storageError) {
      console.error('스토리지 이미지 삭제 오류:', storageError);
      return { error: '스토리지에서 이미지 삭제를 실패했습니다.' };
    }
  }

  const { error: dbError } = await supabase.from('product_images').delete().eq('id', imageId);
  if (dbError) {
    console.error('DB 이미지 정보 삭제 오류:', dbError);
    return { error: 'DB에서 이미지 정보 삭제를 실패했습니다.' };
  }

  revalidatePath('/admin');
  revalidatePath('/product/[id]', 'layout');
  return { success: true };
}
