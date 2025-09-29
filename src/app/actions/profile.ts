'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

type ProfileFormData = {
  user_name: string | null;
  phone_number: string | null;
  postcode: string | null;
  address: string | null;
  detail_address: string | null;
};

export async function updateProfile(formData: FormData) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => cookieStore.get(name)?.value,
        set: (name, value, options) => {
          try { cookieStore.set({ name, value, ...options }); } catch {}
        },
        remove: (name, options) => {
          try { cookieStore.set({ name, value: '', ...options }); } catch {}
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: '로그인이 필요합니다.' };
  }

  const toNullableString = (value: FormDataEntryValue | null): string | null => {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  };

  const profileData: ProfileFormData = {
    user_name: toNullableString(formData.get('userName')),
    phone_number: toNullableString(formData.get('phoneNumber')),
    postcode: toNullableString(formData.get('postcode')),
    address: toNullableString(formData.get('address')),
    detail_address: toNullableString(formData.get('detailAddress')),
  };

  const { error } = await supabase
    .from('profiles')
    .upsert(
      {
        id: user.id,
        email: user.email ?? null,
        ...profileData,
      },
      { onConflict: 'id' }
    );

  if (error) {
    console.error('프로필 업데이트 오류:', error);
    return {
      error:
        error.message ?? '프로필을 업데이트하는 데 실패했습니다.',
    };
  }

  revalidatePath('/mypage'); // 마이페이지 데이터 갱신
  return { success: true, message: '프로필이 성공적으로 업데이트되었습니다.' };
}
