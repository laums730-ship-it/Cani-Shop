-- =====================================================
--  CANI SHOP — Casillas WSP y MKT en cada producto (solo lo ves tú en el panel)
--  Copia TODO, pégalo en Supabase → SQL Editor → Run. Se puede correr varias veces.
--  No toca tus productos, tu stock ni tus costos.
-- =====================================================

create table if not exists public.marcas_producto (
  id   text primary key references public.productos(id) on delete cascade,
  wsp  boolean not null default false,
  mkt  boolean not null default false
);

alter table public.marcas_producto enable row level security;
revoke all on public.marcas_producto from anon;
grant select, insert, update, delete on public.marcas_producto to authenticated;

drop policy if exists "solo admin ve marcas_producto" on public.marcas_producto;
create policy "solo admin ve marcas_producto" on public.marcas_producto
  for all to authenticated using (public.es_admin()) with check (public.es_admin());

select count(*) as productos_marcados from public.marcas_producto;
