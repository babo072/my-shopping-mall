import { redirect } from "next/navigation";
import EditProfileForm, { type EditableProfile } from "@/components/EditProfileForm";
import { createServerClientAsync } from "@/utils/supabase/server";

const emptyProfile: EditableProfile = {
  email: null,
  user_name: null,
  phone_number: null,
  postcode: null,
  address: null,
  detail_address: null,
};

export default async function MyPage() {
  const supabase = await createServerClientAsync();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const message = "로그인이 필요합니다.";
    return redirect(`/login?message=${encodeURIComponent(message)}`);
  }

  const { data: profileRow, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error("프로필 조회 오류:", error);
  }

  const profileRecord = (profileRow as EditableProfile | null) ?? emptyProfile;

  const mergedProfile: EditableProfile = {
    email: user.email ?? profileRecord.email,
    user_name: profileRecord.user_name,
    phone_number: profileRecord.phone_number,
    postcode: profileRecord.postcode,
    address: profileRecord.address,
    detail_address: profileRecord.detail_address,
  };

  return (
    <main className="container mx-auto px-4 py-12 text-foreground">
      <h1 className="mb-8 text-3xl font-bold text-primary">마이페이지</h1>
      <div className="mx-auto max-w-2xl rounded-xl border border-slate-700 bg-slate-900/80 p-6 shadow-2xl shadow-slate-950/40">
        <EditProfileForm profile={mergedProfile} />
      </div>
    </main>
  );
}
