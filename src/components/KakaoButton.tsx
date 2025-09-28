'use client';
import { createClient } from '@/utils/supabase/client';

export default function KakaoButton() {
  const handleKakaoLogin = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    });
  };

  return <button onClick={handleKakaoLogin} className="w-full py-2 px-4 font-semibold bg-[#FEE500] text-[#3A1D1D] rounded-md hover:opacity-90 transition-opacity">카카오 계정으로 로그인</button>;
}