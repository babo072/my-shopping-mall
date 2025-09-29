# My Shopping Mall

A Next.js 15 + Supabase storefront that supports social/email auth, cart checkout with Toss Payments, and an admin dashboard for product and order management. The UI uses a dark slate palette with cyan accents defined in `globals.css`.

## Quick Start

```bash
npm install
npm run dev
```

The app boots at [http://localhost:3000](http://localhost:3000). Use `/login` for email or social sign-in and `/orders` (admin) for the back office.

## Key Features
- **Product catalogue** sourced from Supabase tables (`products`, `product_images`) with responsive cards and carousel previews.
- **Cart + checkout** driven by Zustand (`src/store/cartStore.ts`) and the Toss Payments SDK.
- **Profile management** under `/mypage`, allowing users to store shipping addresses and phone numbers used at checkout.
- **Admin tools** in `/admin` and `/orders`, including product CRUD forms and status filters (`전체`, `결제 완료`, `배송준비중`, `배송중`, `배송완료`). Status constants live in `src/lib/order-status.ts`.

## Environment Variables
Set the following in `.env.local` (never commit secrets):

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
TOSS_SECRET_KEY=
NEXT_PUBLIC_TOSS_CLIENT_KEY=
NEXT_PUBLIC_TEST_MODE=false
```

Additional services (PortOne, Toss test mode, etc.) should be added here as needed.

## Supabase Configuration
1. **Schema**: ensure `profiles` includes `user_name`, `phone_number`, `postcode`, `address`, `detail_address`. Regenerate `src/types/supabase.ts` after altering columns.
2. **Policies**: create helper function and policies that allow admins to read/update all orders and profiles:
   ```sql
   create or replace function public.is_admin()
   returns boolean
   language sql
   security definer
   set search_path = public
   as $$
     select exists (
       select 1 from public.profiles
       where id = auth.uid()
         and role = 'admin'
     );
   $$;
   ```
   Apply policies such as `orders_select_self_or_admin`, `orders_update_self_or_admin`, and `profiles_select_self_or_admin` using `public.is_admin()`.

## Admin Workflow
- `/orders` shows all orders when the viewer is an admin. Use the filter buttons on the top right to drill down by status. Submitting the status form calls `updateOrderStatus`, which revalidates and redirects back to `/orders`.
- `/admin` exposes product add/edit/delete forms. Image uploads use the `product-images` Supabase Storage bucket.

## Styling Notes
The global theme is defined in `src/app/globals.css`. Stick to the provided dark slate backgrounds (`bg-slate-900` range), cyan highlights, and rounded cards. When adding components, follow the Tailwind class ordering (layout → spacing → color) and use the `@/` import alias.

## Developing & Testing
- `npm run lint`: ESLint with `next/core-web-vitals`. Resolve errors before PRs; remaining `<img>` warnings can be deferred until components adopt `next/image`.
- Add unit/component tests next to features (`*.test.tsx`). Prioritise checkout, authentication, and payment verification in any E2E coverage.

## Contributing
Keep commits focused with descriptive subjects (Korean or English). Include screenshots or screencasts for UI changes and document Supabase schema/policy updates in pull requests so reviewers can apply them.
