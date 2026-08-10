-- Campus Lost & Found — Student 1 (Report & Manage) schema
-- Run this once in the Supabase SQL Editor (Dashboard -> SQL Editor -> New query).
-- Safe to re-run: uses IF NOT EXISTS / OR REPLACE / DROP POLICY IF EXISTS where possible.

-- =========================================================
-- 1. profiles
-- =========================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  name text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Auto-create a profile row (name = null) whenever a new auth user signs up.
-- `name is null` is what drives the /profile-setup redirect in the app.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name)
  values (new.id, new.email, null)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =========================================================
-- 2. items
-- =========================================================
create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  type text not null check (type in ('lost', 'found')),
  title text not null,
  description text,
  category text not null check (category in (
    'Electronics', 'Wallet / Money', 'Keys', 'Bag',
    'Clothing', 'Books', 'ID / Cards', 'Accessories', 'Other'
  )),
  location text not null,
  item_date date not null,
  image_url text not null,
  status text not null default 'open' check (status in ('open', 'claimed', 'returned', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists items_owner_id_idx on public.items (owner_id);
create index if not exists items_status_idx on public.items (status);

alter table public.items enable row level security;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists items_set_updated_at on public.items;
create trigger items_set_updated_at
  before update on public.items
  for each row execute function public.set_updated_at();

-- Browsing is public (landing page has an unauthenticated "Browse Items" entry point).
drop policy if exists "items_select_all" on public.items;
create policy "items_select_all"
  on public.items for select
  using (true);

drop policy if exists "items_insert_own" on public.items;
create policy "items_insert_own"
  on public.items for insert
  to authenticated
  with check (owner_id = auth.uid());

drop policy if exists "items_update_own" on public.items;
create policy "items_update_own"
  on public.items for update
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- Delete only allowed when the item has no pending/accepted claims (use Close otherwise).
-- Enforced at the DB level, not just in the UI.
drop policy if exists "items_delete_own_no_claims" on public.items;
create policy "items_delete_own_no_claims"
  on public.items for delete
  to authenticated
  using (
    owner_id = auth.uid()
    and not exists (
      select 1 from public.claims c
      where c.item_id = items.id and c.status in ('pending', 'accepted')
    )
  );

-- =========================================================
-- 3. claims
-- =========================================================
create table if not exists public.claims (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items (id) on delete cascade,
  claimant_id uuid not null references auth.users (id) on delete cascade,
  message text not null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz not null default now()
);

create index if not exists claims_item_id_idx on public.claims (item_id);
create index if not exists claims_claimant_id_idx on public.claims (claimant_id);

alter table public.claims enable row level security;

-- A claimant can see their own claims; an item owner can see claims on their own items.
drop policy if exists "claims_select_own_or_item_owner" on public.claims;
create policy "claims_select_own_or_item_owner"
  on public.claims for select
  to authenticated
  using (
    claimant_id = auth.uid()
    or exists (
      select 1 from public.items i
      where i.id = claims.item_id and i.owner_id = auth.uid()
    )
  );

-- Only against found items that are still open, and not by the item's own owner.
drop policy if exists "claims_insert_own" on public.claims;
create policy "claims_insert_own"
  on public.claims for insert
  to authenticated
  with check (
    claimant_id = auth.uid()
    and exists (
      select 1 from public.items i
      where i.id = item_id and i.type = 'found' and i.status = 'open' and i.owner_id <> auth.uid()
    )
  );

-- No direct UPDATE policy: accept/reject go through the SECURITY DEFINER
-- RPCs below so the "accept -> reject other pending claims" transition stays atomic.

-- =========================================================
-- 4. RPCs (SECURITY DEFINER) for claim actions and masked claim reads
-- =========================================================

-- Claimant name is always visible to the item owner; claimant email only once accepted.
-- Row Level Security can't mask a single column conditionally, so this is a function
-- rather than a direct SELECT grant on profiles/claims.
create or replace function public.get_received_claims()
returns table (
  claim_id uuid,
  item_id uuid,
  claimant_id uuid,
  claimant_name text,
  claimant_email text,
  message text,
  status text,
  created_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select
    c.id as claim_id,
    c.item_id,
    c.claimant_id,
    p.name as claimant_name,
    case when c.status = 'accepted' then p.email else null end as claimant_email,
    c.message,
    c.status,
    c.created_at
  from public.claims c
  join public.items i on i.id = c.item_id
  join public.profiles p on p.id = c.claimant_id
  where i.owner_id = auth.uid()
  order by c.created_at desc;
$$;

grant execute on function public.get_received_claims() to authenticated;

create or replace function public.accept_claim(p_claim_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item_id uuid;
  v_owner_id uuid;
begin
  select c.item_id into v_item_id from public.claims c where c.id = p_claim_id;
  if v_item_id is null then
    raise exception 'Claim not found';
  end if;

  select i.owner_id into v_owner_id from public.items i where i.id = v_item_id;
  if v_owner_id is null or v_owner_id <> auth.uid() then
    raise exception 'Not authorized to act on this claim';
  end if;

  update public.claims set status = 'accepted' where id = p_claim_id;
  update public.items set status = 'claimed' where id = v_item_id;
  update public.claims
    set status = 'rejected'
    where item_id = v_item_id and id <> p_claim_id and status = 'pending';
end;
$$;

grant execute on function public.accept_claim(uuid) to authenticated;

create or replace function public.reject_claim(p_claim_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item_id uuid;
  v_owner_id uuid;
begin
  select c.item_id into v_item_id from public.claims c where c.id = p_claim_id;
  if v_item_id is null then
    raise exception 'Claim not found';
  end if;

  select i.owner_id into v_owner_id from public.items i where i.id = v_item_id;
  if v_owner_id is null or v_owner_id <> auth.uid() then
    raise exception 'Not authorized to act on this claim';
  end if;

  update public.claims set status = 'rejected' where id = p_claim_id;
end;
$$;

grant execute on function public.reject_claim(uuid) to authenticated;

-- =========================================================
-- 5. Storage: item-images bucket (public)
-- =========================================================
insert into storage.buckets (id, name, public)
values ('item-images', 'item-images', true)
on conflict (id) do nothing;

drop policy if exists "item_images_public_read" on storage.objects;
create policy "item_images_public_read"
  on storage.objects for select
  using (bucket_id = 'item-images');

drop policy if exists "item_images_insert_own_folder" on storage.objects;
create policy "item_images_insert_own_folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'item-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "item_images_update_own_folder" on storage.objects;
create policy "item_images_update_own_folder"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'item-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "item_images_delete_own_folder" on storage.objects;
create policy "item_images_delete_own_folder"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'item-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
