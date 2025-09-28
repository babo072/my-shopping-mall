import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { createServerClientAsync } from "@/utils/supabase/server"; // 서버용 클라이언트 import

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "나만의 작은 상점",
  description: "Next.js로 만든 미니 쇼핑몰",
};

// RootLayout을 async 함수로 변경합니다.
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 서버에서 현재 사용자 정보를 조회합니다.
  const supabase = await createServerClientAsync();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <html lang="ko">
      <body className={`${inter.className} bg-slate-900 text-white`}>
        {/* Navbar에 사용자 정보를 prop으로 전달합니다. */}
        <Navbar user={user} />
        <main className="min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}