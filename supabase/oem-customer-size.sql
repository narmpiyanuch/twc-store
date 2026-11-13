alter table public.oem
  add column if not exists size_ml text
  check (size_ml in ('350', '500', '600', '1500'));

alter table public.oem drop constraint if exists oem_size_ml_check;
update public.oem set size_ml = '500' where size_ml = '500/600';
alter table public.oem
  add constraint oem_size_ml_check
  check (size_ml in ('350', '500', '600', '1500'));

comment on column public.oem.size_ml is
  'Bottle size for the OEM customer: 350, 500, 600, or 1500 ml.';
