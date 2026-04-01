# NanaMeets Web

NanaMeets Web is the user platform for shared profiles, messages, and inbox management.

## Stack

- Next.js App Router
- TypeScript
- shadcn-style UI primitives
- Supabase auth and row-level security

## Getting Started

1. Copy `.env.example` to `.env.local`.
2. Fill in your Supabase project URL and anon key from the NanaMeets App workspace.
3. Add `PAYCHANGU_API_KEY` for the subscription checkout route if you want billing enabled in this web app.
4. Use the shared Supabase database and the existing `subscription` table so verified PayChangu payments are stored alongside the rest of the app data.
5. If you need image uploads in the web app, the Next API route `/api/r2-presign` proxies to the deployed Supabase upload function (`r2-presign-web`, with fallback to the shared admin function). Keep the mobile app on its existing Supabase Edge Function so both clients do not overwrite each other.
5. Start the app:

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
# NanaMeets-Web-App-Final
