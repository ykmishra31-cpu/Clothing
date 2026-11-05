# TRYy ANGLE — Clothing Shop

A responsive clothing storefront with product discovery, size/colour selection, cart, checkout, order creation, and an admin order-management panel. Manual shipping only: admins update courier/tracking details themselves.

## Run locally

```bash
npm install
cp .env.example .env
npm run dev
```

Open the local URL shown by Vite.

## Demo mode

Without Supabase variables, the store runs in local demo mode. Orders are saved in the current browser's localStorage, so this is for preview/testing only. Demo admin page: `/admin` (demo mode only).

## Supabase setup

1. Create a Supabase project.
2. Put the Project URL and anon/publishable key in `.env`.
3. Run `supabase/migrations/202611060001_tryy_angle_store.sql` in the Supabase SQL Editor.
4. Create an admin user in Supabase Auth.
5. Set `app_metadata.role = "admin"` for that user using a trusted server/admin tool. Never put the service_role key in frontend code.
6. Restart the Vite server.

In connected mode, customers can create orders and admins can review/update them. Product catalogue is currently seeded in `src/data.js`; the migration also creates database tables for future product CRUD. This package intentionally does not include payment gateway credentials or automatic courier APIs.

## Manual shipping flow

Admin → Orders → open an order → set status, courier name and tracking number → Save. The customer can see the order status and tracking information from the order lookup section (order number + phone).

## Deploy

Build with `npm run build`; deploy the `dist` folder to Cloudflare Pages, Netlify, Vercel, or another static host. Configure the same `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` environment variables in the hosting dashboard.
