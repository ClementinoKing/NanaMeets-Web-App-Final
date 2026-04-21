# NanaMeets Web

NanaMeets Web is the user platform for shared profiles, messages, and inbox management.

## Stack

- Next.js App Router
- TypeScript
- shadcn-style UI primitives
- Supabase auth and row-level security

## Getting Started

1. Copy `.env.example` to `.env.local`.
2. Fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from the NanaMeets App workspace.
3. Add `SUPABASE_SERVICE_ROLE_KEY` so the public short-link redirect at `https://nanameets.com/{code}` can resolve and count clicks server-side.
4. Set `NEXT_PUBLIC_PAYMENT_INIT_URL` to your secure Supabase Edge Function at `/functions/v1/payment-init`.
5. Set `NEXT_PUBLIC_PAYMENT_CALLBACK_URL` and `NEXT_PUBLIC_PAYMENT_RETURN_URL` to your deployed web URLs so PayChangu returns to a public callback page instead of a localhost origin.
6. If you keep the local `/api/payment-init` fallback, also set `PAYCHANGU_API_KEY` or `PAYMENT_API_KEY` on the server.
7. Use the shared Supabase database and the existing `subscription` table so verified PayChangu payments are stored alongside the rest of the app data.
8. If you need image uploads in the web app, the Next API route `/api/r2-presign` proxies to the deployed Supabase upload function (`r2-presign-web`, with fallback to the shared admin function). Keep the mobile app on its existing Supabase Edge Function so both clients do not overwrite each other.
9. Start the app:

```bash
npm run dev
```

## Scripts

- `npm run dev`
- `npm run lint`
- `npm run build`

## Included Flow

- Landing page with auth CTAs
- Sign up and sign in screens
- Protected dashboard shell
- Profile editing
- Direct messages and inbox actions

## PWA

- Installable manifest at `src/app/manifest.ts`
- Shared service worker at `public/sw.js`
- Install prompts on the landing page and authenticated dashboard shell
- Offline fallback page at `public/offline.html`
- For local PWA testing, use HTTPS-capable dev mode so the browser can register the service worker
# NanaMeets-Web-App-Final
