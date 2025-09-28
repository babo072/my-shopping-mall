'use server';

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

export async function updateProfile(formData: FormData) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => cookieStore.get(name)?.value,
        set: (name, value, options) => {
          try { cookieStore.set({ name, value, ...options }); } catch (error) {}
        },
        remove: (name, options) => {
          try { cookieStore.set({ name, value: '', ...options }); } catch (error) {}
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: '로그인이 필요합니다.' };
  }

  // --- [디버그 코드] ---
  console.log("프로필 업데이트 시도하는 사용자 ID:", user.id);
  // --------------------

  const profileData = {
    user_name: formData.get('userName') as string,
    phone_number: formData.get('phoneNumber') as string,
    postcode: formData.get('postcode') as string,
    address: formData.get('address') as string,
    detail_address: formData.get('detailAddress') as string,
  };
  
  const { error } = await supabase
    .from('profiles')
    .update(profileData)
    .eq('id', user.id);

  if (error) {
    console.error('프로필 업데이트 오류:', error);
    return { error: '프로필을 업데이트하는 데 실패했습니다.' };
  }

  revalidatePath('/mypage'); // 마이페이지 데이터 갱신
  return { success: true, message: '프로필이 성공적으로 업데이트되었습니다.' };
}