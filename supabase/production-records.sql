create table if not exists public.productions (
  id text primary key,
  product_type text not null check (product_type in ('bottled','glass')),
  brand text,
  size_ml text,
  output_quantity integer not null default 0 check (output_quantity >= 0),
  output_unit text not null,
  materials jsonb not null default '[]'::jsonb,
  note text not null default '',
  status text not null default 'active' check (status in ('active','cancelled')),
  produced_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  revisions jsonb not null default '[]'::jsonb
);

alter table public.productions enable row level security;
drop policy if exists "Authenticated users can manage productions" on public.productions;
create policy "Authenticated users can manage productions"
  on public.productions for all to authenticated
  using (true) with check (true);
grant select, insert, update, delete on public.productions to authenticated;
