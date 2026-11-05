-- TRYy ANGLE store schema
-- Run this in Supabase SQL Editor. Never expose the service_role key in the browser.

create extension if not exists pgcrypto;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  sku text unique,
  name text not null,
  category text not null,
  description text default '',
  price numeric(10,2) not null check (price >= 0),
  compare_at_price numeric(10,2),
  image_url text,
  images jsonb not null default '[]'::jsonb,
  sizes jsonb not null default '[]'::jsonb,
  colors jsonb not null default '[]'::jsonb,
  stock integer not null default 0 check (stock >= 0),
  active boolean not null default true,
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  user_id uuid references auth.users(id) on delete set null,
  customer_name text not null,
  phone text not null,
  email text,
  address text not null,
  city text not null,
  state text not null,
  pincode text not null,
  notes text,
  items jsonb not null default '[]'::jsonb,
  subtotal numeric(10,2) not null,
  shipping numeric(10,2) not null default 0,
  total numeric(10,2) not null,
  status text not null default 'New' check (status in ('New','Confirmed','Packed','Shipped','Out for Delivery','Delivered','Cancelled')),
  courier text,
  tracking_number text,
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_created_at_idx on public.orders(created_at desc);
create index if not exists orders_phone_idx on public.orders(phone);
create index if not exists products_active_category_idx on public.products(active, category);

alter table public.products enable row level security;
alter table public.orders enable row level security;

-- Public catalogue reads; only admins can modify catalogue.
create policy "Public can read active products"
on public.products for select
using (active = true or (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "Admins can insert products"
on public.products for insert to authenticated
with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "Admins can update products"
on public.products for update to authenticated
using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "Admins can delete products"
on public.products for delete to authenticated
using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Customers can create an order. Admins can read/update all orders.
-- For a public store this INSERT policy accepts checkout submissions from anon/authenticated.
create policy "Customers can create orders"
on public.orders for insert to anon, authenticated
with check (
  length(customer_name) between 2 and 120
  and length(phone) between 10 and 15
  and length(pincode) = 6
  and total >= 0
);

create policy "Admins can read orders"
on public.orders for select to authenticated
using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "Admins can update orders"
on public.orders for update to authenticated
using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;
grant insert on public.orders to anon, authenticated;
grant select, update on public.orders to authenticated;

-- IMPORTANT SECURITY NOTE:
-- Public order lookup by order_number + phone should be implemented through a rate-limited
-- Edge Function before enabling public read access. This starter intentionally does not
-- expose the orders table to anonymous SELECT.
