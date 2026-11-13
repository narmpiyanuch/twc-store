alter table public.oem
  add column if not exists price_per_pack numeric(12,2) not null default 0
  check (price_per_pack >= 0);

alter table public.oem
  add column if not exists fulfillment_type text not null default 'pickup'
  check (fulfillment_type in ('delivery', 'pickup'));

comment on column public.oem.quantity is
  'Legacy stock quantity retained for backward compatibility; no longer used by the app.';

comment on column public.oem.price_per_pack is
  'Current agreed selling price per pack for this OEM customer.';

comment on column public.oem.fulfillment_type is
  'pickup = customer collects goods, delivery = store delivers goods.';
