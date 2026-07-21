create table if not exists public.oem_price_logs (id text primary key, price_id text not null, size_label text not null, tier_packs integer not null, old_price numeric(12,2) not null, new_price numeric(12,2) not null, created_at timestamptz not null default now());
alter table public.oem_price_logs enable row level security;
drop policy if exists "Authenticated users can manage oem_price_logs" on public.oem_price_logs;
create policy "Authenticated users can manage oem_price_logs" on public.oem_price_logs for all to authenticated using (true) with check (true);
grant select, insert, update, delete on public.oem_price_logs to authenticated;
