'use server';

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function signup(formData: FormData) {
  const cookieStore = await cookies();
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value; },
        set(name: string, value: string, options: CookieOptions) {
          try { cookieStore.set({ name, value, ...options }); } catch (error) {}
        },
        remove(name: string, options: CookieOptions) {
          try { cookieStore.set({ name, value: '', ...options }); } catch (error) {}
        },
      },
    }
  );

  const { error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    console.error('Signup Error:', error.message);
    const message = '회원가입에 실패했습니다. 다시 시도해주세요.';
    // ✅ URL 인코딩 적용
    return redirect(`/login?message=${encodeURIComponent(message)}`);
  }

  const message = '회원가입 성공! 이메일을 확인하여 계정을 활성화해주세요.';
  // ✅ URL 인코딩 적용
  return redirect(`/login?message=${encodeURIComponent(message)}`);
}

export async function login(formData: FormData) {
  const cookieStore = await cookies();
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value; },
        set(name: string, value: string, options: CookieOptions) {
          try { cookieStore.set({ name, value, ...options }); } catch (error) {}
        },
        remove(name: string, options: CookieOptions) {
          try { cookieStore.set({ name, value: '', ...options }); } catch (error) {}
        },
      },
    }
  );

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error('Login Error:', error.message);
    const message = '이메일 또는 비밀번호가 올바르지 않습니다.';
    // ✅ URL 인코딩 적용
    return redirect(`/login?message=${encodeURIComponent(message)}`);
  }

  return redirect('/');
}