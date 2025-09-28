// src/utils/supabase/server.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Next.js 15: cookies()는 async 이므로 반드시 await 필요.
 * 이 헬퍼 자체를 async로 만들고, 호출부에서도 await 하세요.
 */
export async function createServerClientAsync() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, // (= publishable key)
    {
      cookies: {
        // 단건 읽기
        get(name: string) {
          return cookieStore.get(name)?.value ?? null
        },
        // 단건 쓰기
        set(name: string, value: string, options: CookieOptions) {
          // RSC에서는 set이 차단될 수 있으니 방어
          try {
            cookieStore.set({ name, value, ...options })
          } catch {
            // 무시 (Server Action/Route Handler에서 다시 시도)
          }
        },
        // 단건 삭제
        remove(name: string, options: CookieOptions) {
          try {
            // Next의 cookie API는 delete 대신 set + maxAge=0 패턴이 안전
            cookieStore.set({ name, value: '', ...options, maxAge: 0 })
          } catch {
            // 무시
          }
        },
      },
    }
  )
}
