'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function logout() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => cookieStore.get(name)?.value,
        set: (name, value, options) => {
          try { cookieStore.set({ name, value, ...options }); } catch {
            // ignore cookie write failures in restricted contexts
          }
        },
        remove: (name, options) => {
          try { cookieStore.set({ name, value: '', ...options }); } catch {
            // ignore cookie write failures in restricted contexts
          }
        },
      },
    }
  );

  // Supabase에서 로그아웃을 처리합니다. (세션 및 쿠키 삭제)
  await supabase.auth.signOut();
  
  // 로그아웃 후 메인 페이지로 리디렉션합니다.
  return redirect('/');
}
