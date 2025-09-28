import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { createServerClientAsync } from "@/utils/supabase/server"; // 서버용 클라이언트 import
import Script from 'next/script'; 

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
  const supabase = await createServerClientAsync();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <html lang="ko">
      <body>
        {/* 👇 다음 우편번호 서비스를 위한 스크립트 추가 */}
        <Script
          src="//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"
          strategy="beforeInteractive"
        />
        <Navbar user={user} />
        <main className="min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}