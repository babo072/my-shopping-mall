'use client';
import { createClient } from '@/utils/supabase/client';

export default function GoogleButton() {
  const handleGoogleLogin = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    });
  };

  return <button onClick={handleGoogleLogin} className="w-full py-2 px-4 font-semibold border border-slate-600 rounded-md hover:bg-slate-700 transition-colors">Google 계정으로 로그인</button>;
}