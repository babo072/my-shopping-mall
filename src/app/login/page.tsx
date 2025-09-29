import { login, signup } from './actions';
import GoogleButton from '@/components/GoogleButton';
import KakaoButton from '@/components/KakaoButton';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const { message } = await searchParams;

  return (
    <div className="bg-slate-900 text-white min-h-screen flex items-center justify-center">
      <div className="w-full max-w-sm p-8 space-y-6 bg-slate-800 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center">나만의 작은 상점</h1>
        
        <form className="space-y-4">
          <p className="text-xs text-center text-slate-400 bg-slate-700 p-3 rounded-md">
            처음이신가요? 이메일과 비밀번호를 입력하고 회원가입 버튼을 누르면 인증 메일이 발송됩니다.
          </p>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-400">
              이메일
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full px-3 py-2 mt-1 text-white bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-slate-400"
            >
              비밀번호
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full px-3 py-2 mt-1 text-white bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          <div className="flex gap-4">
            <button
              formAction={login}
              className="w-full py-2 px-4 font-semibold text-white bg-cyan-600 rounded-md hover:bg-cyan-700 transition-colors"
            >
              로그인
            </button>
            <button
              formAction={signup}
              className="w-full py-2 px-4 font-semibold text-white bg-slate-600 rounded-md hover:bg-slate-700 transition-colors"
            >
              회원가입
            </button>
          </div>
          {message && (
            <p className="mt-4 p-4 bg-slate-700 text-slate-300 text-center rounded-md">
              {message}
            </p>
          )}
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-600" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-slate-800 text-slate-400">소셜 계정으로 계속하기</span>
          </div>
        </div>

        <div className="space-y-3">
          <GoogleButton />
          <KakaoButton />
        </div>
      </div>
    </div>
  );
}
