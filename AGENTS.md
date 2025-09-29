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
- `/orders`: Admin buttons filter by query (`?status=pending`). Cards show purchaser + shipping data from `profiles`; RLS must allow admin reads before testing.
- `src/app/actions/order.ts`: `updateOrderStatus` revalidates then redirects; keep it server-side unless caching is redesigned.
- Maintain canonical statuses in `lib/order-status.ts` and mirror them in Supabase enums.

## Commit & Pull Request Guidelines
Keep commits small with concise subjects (Korean or English, no prefixes). Pull requests should include a summary, UI screenshots or GIFs when relevant, reproduction/testing steps, and links to related Supabase schema changes or issues (especially RLS adjustments). Ensure `npm run lint` passes and list required environment variables before requesting review.

## Environment & Security Notes
Store secrets in `.env.local` or managed vaults. Do not commit keys. Recreate RLS so admins have `SELECT/UPDATE` on `orders` and `profiles` via `public.is_admin()`. Document any new external service integration.
