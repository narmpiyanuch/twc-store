alter table public.oem
  add column if not exists production_rate integer not null default 0
  check (production_rate >= 0);

comment on column public.oem.production_rate is
  'Production rate configured for each OEM customer.';
