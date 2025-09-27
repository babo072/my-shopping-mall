import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar"; // Navbar 컴포넌트 import

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "My Little Shop",
  description: "A small shop built with Next.js",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 text-gray-800`}>
        <Navbar /> {/* Navbar를 children 위에 추가 */}
        <main className="min-h-screen">
          {children}
        </main>
        {/* 여기에 Footer를 추가할 수 있습니다. */}
      </body>
    </html>
  );
}