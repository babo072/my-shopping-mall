import { createServerClientAsync } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import EditProfileForm from "@/components/EditProfileForm";

export default async function MyPage() {
  const supabase = await createServerClientAsync();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    const message = '로그인이 필요합니다.';
    return redirect(`/login?message=${encodeURIComponent(message)}`);
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

    console.log("서버에서 조회한 프로필 데이터:", profile);

  if (error) {
    console.error("프로필 조회 오류:", error);
  }

  return (
    <main className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">마이페이지</h1>
      <div className="bg-slate-800 p-6 rounded-lg max-w-2xl mx-auto">
        <EditProfileForm profile={profile} />
      </div>
    </main>
  );
}