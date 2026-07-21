create table if not exists public.inventory (
  id text primary key,
  category text not null check (category in ('bottle','cap','tank','glass')),
  brand text,
  name text not null,
  detail text not null default '',
  quantity integer not null default 0 check (quantity >= 0),
  unit text not null,
  color text
);

create table if not exists public.oem (
  id text primary key,
  name text not null,
  quantity integer not null default 0 check (quantity >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.supplier_factories (
  id text primary key,
  name text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.suppliers (
  id text primary key,
  factory_id text not null references public.supplier_factories(id) on delete cascade,
  size_ml integer not null check (size_ml > 0),
  price_per_bottle numeric(12,4) not null check (price_per_bottle >= 0),
  bottles_per_pack integer not null check (bottles_per_pack > 0),
  updated_at timestamptz not null default now(),
  unique(factory_id, size_ml)
);

create table if not exists public.supplier_logs (
  id text primary key,
  supplier_id text not null,
  factory text not null,
  action text not null check (action in ('created','updated','deleted')),
  summary text not null,
  created_at timestamptz not null default now()
);

alter table public.inventory enable row level security;
alter table public.oem enable row level security;
alter table public.supplier_factories enable row level security;
alter table public.suppliers enable row level security;
alter table public.supplier_logs enable row level security;

do $$
declare table_name text;
begin
  foreach table_name in array array['inventory','oem','supplier_factories','suppliers','supplier_logs'] loop
    execute format('drop policy if exists "Authenticated users can manage %s" on public.%I', table_name, table_name);
    execute format('create policy "Authenticated users can manage %s" on public.%I for all to authenticated using (true) with check (true)', table_name, table_name);
  end loop;
end $$;

grant select, insert, update, delete on public.inventory to authenticated;
grant select, insert, update, delete on public.oem to authenticated;
grant select, insert, update, delete on public.supplier_factories to authenticated;
grant select, insert, update, delete on public.suppliers to authenticated;
grant select, insert, update, delete on public.supplier_logs to authenticated;

insert into public.inventory (id,category,brand,name,detail,quantity,unit,color) values
('NEB-350','bottle','เนบิวลา','350 ml','ขวดเปล่า เนบิวลา',120,'ห่อ',null),
('NEB-500','bottle','เนบิวลา','500 ml','ขวดเปล่า เนบิวลา',86,'ห่อ',null),
('NEB-600','bottle','เนบิวลา','600 ml','ขวดเปล่า เนบิวลา',245,'ห่อ',null),
('NEB-780','bottle','เนบิวลา','780 ml','ขวดเปล่า เนบิวลา',54,'ห่อ',null),
('NEB-1500','bottle','เนบิวลา','1,500 ml','ขวดเปล่า เนบิวลา',42,'ห่อ',null),
('PP-350','bottle','พีพี','350 ml','ขวดเปล่า พีพี',98,'ห่อ',null),
('PP-500','bottle','พีพี','500 ml','ขวดเปล่า พีพี',67,'ห่อ',null),
('PP-600','bottle','พีพี','600 ml','ขวดเปล่า พีพี',132,'ห่อ',null),
('PP-1500','bottle','พีพี','1,500 ml','ขวดเปล่า พีพี',38,'ห่อ',null),
('CAP-BLUE','cap',null,'ฝาสีฟ้า','ฝาขวดน้ำดื่ม',32,'ลัง','#54a9cb'),
('CAP-WHITE','cap',null,'ฝาสีขาว','ฝาขวดน้ำดื่ม',18,'ลัง','#e8ecec'),
('CAP-PINK','cap',null,'ฝาสีชมพู','ฝาขวดน้ำดื่ม',9,'ลัง','#ee9fb2'),
('TANK-W18','tank',null,'ถังขาว 18 ลิตร','ถังน้ำดื่มหมุนเวียน',76,'ถัง',null),
('TANK-CLEAR-A','tank',null,'ถังใส แบบ A','ถังใสทรงกลม',48,'ถัง',null),
('TANK-CLEAR-B','tank',null,'ถังใส แบบ B','ถังใสมีหูจับ',35,'ถัง',null),
('CUP','glass',null,'แก้วน้ำ','แก้วพลาสติกพร้อมซีล',160,'ลัง',null),
('GLASS-CRATE','glass',null,'ลังน้ำแก้ว','ลังสำหรับขวดแก้ว',64,'ลัง',null)
on conflict (id) do nothing;

insert into public.oem (id,name,quantity,updated_at) values
('oem-evergreen','Evergreen Hotel',12500,'2026-07-21T00:00:00.000Z'),
('oem-siam','Siam Wellness',8200,'2026-07-21T00:00:00.000Z')
on conflict (id) do nothing;

create table if not exists public.oem_pack_prices (id text primary key, size_label text not null, tier_packs integer not null check (tier_packs in (100,250)), price_per_pack numeric(12,2) not null default 0 check (price_per_pack >= 0), updated_at timestamptz not null default now(), unique(size_label,tier_packs));
create table if not exists public.delivery_settings (id text primary key, fuel_efficiency numeric(8,2) not null default 11.5 check (fuel_efficiency > 0), updated_at timestamptz not null default now());
alter table public.oem_pack_prices enable row level security;
alter table public.delivery_settings enable row level security;
drop policy if exists "Authenticated users can manage oem_pack_prices" on public.oem_pack_prices;
create policy "Authenticated users can manage oem_pack_prices" on public.oem_pack_prices for all to authenticated using (true) with check (true);
drop policy if exists "Authenticated users can manage delivery_settings" on public.delivery_settings;
create policy "Authenticated users can manage delivery_settings" on public.delivery_settings for all to authenticated using (true) with check (true);
grant select, insert, update, delete on public.oem_pack_prices to authenticated;
grant select, insert, update, delete on public.delivery_settings to authenticated;
insert into public.oem_pack_prices (id,size_label,tier_packs,price_per_pack) values ('350-100','350 ml',100,0),('350-250','350 ml',250,0),('500-600-100','500/600 ml',100,0),('500-600-250','500/600 ml',250,0),('1500-100','1,500 ml',100,0),('1500-250','1,500 ml',250,0) on conflict (id) do nothing;
insert into public.delivery_settings (id,fuel_efficiency) values ('pickup',11.5) on conflict (id) do nothing;
