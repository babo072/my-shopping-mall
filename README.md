This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


src
├── app
│   ├── api
│   │   └── payment
│   │       └── verify
│   │           └── route.ts      // (서버) 결제 검증 API
│   ├── auth
│   │   └── callback
│   │       └── route.ts      // (서버) 소셜 로그인 콜백 처리
│   ├── cart
│   │   └── page.tsx        // (UI) 장바구니 페이지
│   ├── login
│   │   ├── actions.ts      // (서버) 이메일 로그인/가입 로직
│   │   └── page.tsx        // (UI) 로그인/가입 페이지
│   ├── payment
│   │   ├── fail
│   │   │   └── page.tsx    // (UI) 결제 실패 페이지
│   │   └── success
│   │       └── page.tsx    // (UI) 결제 성공 페이지
│   ├── product
│   │   └── [id]
│   │       └── page.tsx    // (UI) 상품 상세 페이지
│   ├── globals.css         // 전역 CSS 및 Tailwind 설정
│   ├── layout.tsx          // 모든 페이지의 기본 레이아웃 (Navbar 포함)
│   └── page.tsx            // 메인 페이지 (상품 목록)
│
├── components              // 재사용 가능한 UI 조각들
│   ├── AddToCartButton.tsx // '장바구니 담기' 버튼
│   ├── GoogleButton.tsx    // 구글 로그인 버튼
│   ├── KakaoButton.tsx     // 카카오 로그인 버튼
│   ├── Navbar.tsx          // 상단 네비게ーション 바
│   └── PaymentButton.tsx   // '결제하기' 버튼 (토스 연동)
│
├── store
│   └── cartStore.ts        // (상태 관리) Zustand 장바구니 스토어
│
└── utils
    └── supabase
        ├── client.ts       // (클라이언트용) Supabase 헬퍼
        └── server.ts       // (서버 컴포넌트용) Supabase 헬퍼