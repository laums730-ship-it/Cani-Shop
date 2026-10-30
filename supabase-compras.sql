-- =====================================================
--  CANI SHOP — Compras a proveedores (solo lo ves tú en el panel)
--  Copia TODO, pégalo en Supabase → SQL Editor → Run. Se puede correr varias veces.
--  No toca tus productos, tu stock ni tus costos actuales.
-- =====================================================

create table if not exists public.compras (
  id               uuid primary key default gen_random_uuid(),
  creado           timestamptz not null default now(),
  fecha            date not null default current_date,
  proveedor        text not null default '',
  flota            numeric not null default 0 check (flota >= 0),
  taxi             numeric not null default 0 check (taxi >= 0),
  total_mercaderia numeric not null default 0 check (total_mercaderia >= 0),
  total_gastos     numeric not null default 0 check (total_gastos >= 0),
  sumo_stock       boolean not null default false,
  actualizo_costos boolean not null default true
);

create table if not exists public.compras_items (
  id          uuid primary key default gen_random_uuid(),
  compra_id   uuid not null references public.compras(id) on delete cascade,
  producto_id text references public.productos(id) on delete set null,
  nombre      text not null default '',
  cantidad    integer not null default 0 check (cantidad >= 0),
  costo_total numeric not null default 0 check (costo_total >= 0),
  costo_unit  numeric not null default 0 check (costo_unit >= 0),
  costo_real  numeric not null default 0 check (costo_real >= 0),
  precio      numeric not null default 0 check (precio >= 0),
  orden       integer not null default 0
);

create index if not exists compras_items_compra_idx on public.compras_items (compra_id);
create index if not exists compras_fecha_idx on public.compras (fecha desc);

alter table public.compras enable row level security;
alter table public.compras_items enable row level security;
revoke all on public.compras from anon;
revoke all on public.compras_items from anon;
grant select, insert, update, delete on public.compras to authenticated;
grant select, insert, update, delete on public.compras_items to authenticated;

drop policy if exists "solo admin ve compras" on public.compras;
create policy "solo admin ve compras" on public.compras
  for all to authenticated using (public.es_admin()) with check (public.es_admin());

drop policy if exists "solo admin ve compras_items" on public.compras_items;
create policy "solo admin ve compras_items" on public.compras_items
  for all to authenticated using (public.es_admin()) with check (public.es_admin());

select count(*) as compras_guardadas from public.compras;
