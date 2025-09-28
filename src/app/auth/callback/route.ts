import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  
  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value;
                },
                set(name: string, value: string, options: CookieOptions) {
                    try {
                      cookieStore.set({ name, value, ...options });
                    } catch (error) {}
                },
                remove(name: string, options: CookieOptions) {
                    try {
                      cookieStore.set({ name, value: '', ...options });
                    } catch (error) {}
                },
            },
        }
    );
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}/`);
    }
  }

  // 👇 영어 메시지를 한글로 수정
  const errorMessage = "소셜 로그인 인증에 실패했습니다.";
  return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(errorMessage)}`);
}