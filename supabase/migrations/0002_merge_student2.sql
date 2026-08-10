-- Reconciles the shared schema (0001_init.sql, already applied) with what
-- student2's Browse/Item Detail/Claim/Sent-Claims side needs.
-- Run this once in the Supabase SQL Editor, after 0001_init.sql.
--
-- Context: 0001_init.sql is the schema that's actually live in this shared
-- project (owner_id/claimant_id reference auth.users). Student2's side was
-- developed against a schema where items.owner_id/claims.claimant_id
-- reference public.profiles instead, which PostgREST needs to embed
-- `owner:profiles(name, email)` inside a query on items/claims (used by the
-- Sent Claims page). profiles.id always equals auth.users.id 1:1 (see the
-- handle_new_user trigger in 0001), so re-pointing the FKs is safe and
-- doesn't require touching any existing data.

alter table public.items
  drop constraint if exists items_owner_id_fkey;
alter table public.items
  add constraint items_owner_id_fkey
  foreign key (owner_id) references public.profiles (id) on delete cascade;

alter table public.claims
  drop constraint if exists claims_claimant_id_fkey;
alter table public.claims
  add constraint claims_claimant_id_fkey
  foreign key (claimant_id) references public.profiles (id) on delete cascade;

-- Student2's claim-sending flow treats a unique-constraint violation as
-- "you already sent a claim for this item" (Postgres error code 23505).
-- Add the constraint their app code expects.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'claims_item_id_claimant_id_key'
  ) then
    alter table public.claims
      add constraint claims_item_id_claimant_id_key unique (item_id, claimant_id);
  end if;
end $$;

-- Reciprocal contact visibility: once a claim is accepted, let the claimant
-- see the item owner's profile (and vice versa) so the Sent Claims page's
-- `owner:profiles(name, email)` embed resolves under RLS. Additive to the
-- existing profiles policies (permissive policies combine with OR), and
-- narrower than a blanket "read any profile" grant.
drop policy if exists "profiles_accepted_claim_contact" on public.profiles;
create policy "profiles_accepted_claim_contact"
  on public.profiles for select
  to authenticated
  using (
    exists (
      select 1
      from public.claims c
      join public.items i on i.id = c.item_id
      where c.status = 'accepted'
        and (
          (c.claimant_id = auth.uid() and i.owner_id = profiles.id)
          or (i.owner_id = auth.uid() and c.claimant_id = profiles.id)
        )
    )
  );
