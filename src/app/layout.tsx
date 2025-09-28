import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "나만의 작은 상점",
  description: "Next.js로 만든 미니 쇼핑몰",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // 주석과 불필요한 공백을 제거하여 Hydration 오류를 방지합니다.
    <html lang="ko">
      <body className={`${inter.className} bg-slate-900 text-white`}>
        <Navbar />
        <main className="min-h-screen">{children}</main>
      </body>
    </html>
  );
}