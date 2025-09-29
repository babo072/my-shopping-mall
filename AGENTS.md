# Repository Guidelines

## Source Layout & Responsibilities
- `src/app`: Next.js App Router tree. Reserve `'use client'` for browser-only logic. Contains API handlers, auth flows, and admin surfaces (`app/orders`, `app/admin`).
- `src/components`: Reusable UI—`components/admin` for dashboard widgets/forms, `components/ui` for primitives shared across views.
- `src/lib` & `src/utils/supabase`: Supabase client factories and domain helpers (`lib/order-status.ts`). Require env vars in `.env.local`.
- `src/store`: Zustand stores (`cartStore.ts`) for client state.
- `src/types`: Supabase-generated typings.
- `public`: Static assets.
- `e2e`: Playwright specs once they exist.

## Build, Test, and Development Commands
- `npm run dev`: Launch Turbopack dev server on `http://localhost:3000` with hot reload.
- `npm run build`: Compile for production; surfaces Server Component or TypeScript breakages.
- `npm run start`: Serve the built app locally to mirror production behaviour.
- `npm run lint`: Run ESLint with `next/core-web-vitals` and TypeScript rules; address or document findings before merging.

## Coding Style & Naming Conventions
Strict TypeScript mode. Default to Server Components, adding `'use client'` only for interactivity/Zustand. Use PascalCase for components, camelCase for helpers, Tailwind class order layout → spacing → color, and `@/` imports. Keep the dark slate + cyan palette from `globals.css`.

## Testing Guidelines
Automated suites are pending. Add unit or component tests alongside features (`*.test.tsx`) and group Playwright specs under `e2e/` when introduced. Focus on checkout, authentication, and payment verification, mocking Supabase and payment SDK clients for deterministic runs. Note manual test steps in pull requests until coverage expands.

## Order & Admin Workflow
- `/orders`: Admin 버튼은 `status` 필터를 제어하고, 검색(`q`)·정렬(`sort`) 폼과 일괄 상태 변경 폼이 함께 동작합니다. 카드마다 체크박스가 `updateOrderStatusBatch`에 연결되며, 링크로 상세 페이지(`/orders/[id]`)로 이동합니다.
- 카드/상세 페이지는 주문자 + 배송 주소를 `profiles`에서 읽어오고, `orders.admin_note`를 표시합니다. RLS가 관리자에게 `orders`, `order_items`, `products`, `profiles` READ 권한을 부여했는지 확인하세요.
- `src/app/actions/order.ts`: `updateOrderStatus`, `updateOrderStatusBatch`, `updateOrderMemo`는 모두 `redirectTo` 값을 존중합니다. 서버 액션 기반 설계를 유지한 채 캐싱 정책을 조정하세요.
- 상태 상수는 `lib/order-status.ts`가 단일 출처입니다. Supabase enum과 동기화하세요.

## Commit & Pull Request Guidelines
Keep commits small with concise subjects (Korean or English, no prefixes). Pull requests should include a summary, UI screenshots or GIFs when relevant, reproduction/testing steps, and links to related Supabase schema changes or issues (especially RLS adjustments). Ensure `npm run lint` passes and list required environment variables before requesting review.

## Environment & Security Notes
Store secrets in `.env.local` or managed vaults. Do not commit keys. Recreate RLS so admins have `SELECT/UPDATE` on `orders`, `order_items`, and `profiles` via `public.is_admin()`. Document any new external service integration.
