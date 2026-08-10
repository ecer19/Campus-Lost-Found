-- Campus Lost & Found — shared schema + RLS
-- Run this once in the Supabase project's SQL Editor (shared by both students).

create extension if not exists "pgcrypto";

create type item_type as enum ('lost', 'found');
create type item_status as enum ('open', 'claimed', 'returned', 'closed');
create type claim_status as enum ('pending', 'accepted', 'rejected');
create type item_category as enum (
  'Electronics', 'Wallet / Money', 'Keys', 'Bag', 'Clothing',
  'Books', 'ID / Cards', 'Accessories', 'Other'
);

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  name text,
  created_at timestamptz not null default now()
);

create table items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles (id) on delete cascade,
  type item_type not null,
  title text not null,
  description text not null,
  category item_category not null,
  location text not null,
  item_date date not null,
  image_url text not null,
  status item_status not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table claims (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references items (id) on delete cascade,
  claimant_id uuid not null references profiles (id) on delete cascade,
  message text not null,
  status claim_status not null default 'pending',
  created_at timestamptz not null default now(),
  unique (item_id, claimant_id)
);

-- Auto-create a profile row when a user first signs in via magic link.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger items_set_updated_at
  before update on items
  for each row execute function public.set_updated_at();

-- Row Level Security --------------------------------------------------

alter table profiles enable row level security;
alter table items enable row level security;
alter table claims enable row level security;

-- profiles: a user can always read their own row.
create policy "profiles: self select"
  on profiles for select
  using (auth.uid() = id);

-- profiles: contact info becomes visible to the other party only once a
-- claim on one of the owner's items has been accepted.
create policy "profiles: accepted-claim contact select"
  on profiles for select
  using (
    exists (
      select 1
      from claims c
      join items i on i.id = c.item_id
      where c.status = 'accepted'
        and (
          (c.claimant_id = auth.uid() and i.owner_id = profiles.id)
          or (i.owner_id = auth.uid() and c.claimant_id = profiles.id)
        )
    )
  );

create policy "profiles: self insert"
  on profiles for insert
  with check (auth.uid() = id);

create policy "profiles: self update"
  on profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- items: listings are public (Browse/Item Detail are public pages).
create policy "items: public select"
  on items for select
  using (true);

create policy "items: owner insert"
  on items for insert
  with check (auth.uid() = owner_id);

create policy "items: owner update"
  on items for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "items: owner delete"
  on items for delete
  using (auth.uid() = owner_id);

-- claims: visible to the claimant and to the item owner.
create policy "claims: claimant or owner select"
  on claims for select
  using (
    auth.uid() = claimant_id
    or exists (
      select 1 from items i
      where i.id = claims.item_id and i.owner_id = auth.uid()
    )
  );

-- claims: a user may only claim someone else's open, found item, as themself.
create policy "claims: self insert on open found items"
  on claims for insert
  with check (
    auth.uid() = claimant_id
    and exists (
      select 1 from items i
      where i.id = item_id
        and i.type = 'found'
        and i.status = 'open'
        and i.owner_id <> auth.uid()
    )
  );

-- claims: only the item owner may accept/reject claims on their items.
create policy "claims: owner update status"
  on claims for update
  using (
    exists (select 1 from items i where i.id = claims.item_id and i.owner_id = auth.uid())
  )
  with check (
    exists (select 1 from items i where i.id = claims.item_id and i.owner_id = auth.uid())
  );

-- Storage ---------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('item-images', 'item-images', true)
on conflict (id) do nothing;

create policy "item-images: public read"
  on storage.objects for select
  using (bucket_id = 'item-images');

create policy "item-images: authenticated upload own folder"
  on storage.objects for insert
  with check (
    bucket_id = 'item-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "item-images: owner update own folder"
  on storage.objects for update
  using (
    bucket_id = 'item-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "item-images: owner delete own folder"
  on storage.objects for delete
  using (
    bucket_id = 'item-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
