-- =====================================================
--  CANI SHOP — Stock mínimo por producto (solo lo ves tú en el panel)
--  Copia TODO, pégalo en Supabase → SQL Editor → Run. Se puede correr varias veces.
--  No toca tus productos, tu stock ni tus costos.
--  Si un producto no tiene mínimo guardado, el panel usa 3 unidades.
-- =====================================================

create table if not exists public.stock_minimos (
  id      text primary key references public.productos(id) on delete cascade,
  minimo  integer not null default 3 check (minimo >= 0)
);

alter table public.stock_minimos enable row level security;
revoke all on public.stock_minimos from anon;
grant select, insert, update, delete on public.stock_minimos to authenticated;

drop policy if exists "solo admin ve stock_minimos" on public.stock_minimos;
create policy "solo admin ve stock_minimos" on public.stock_minimos
  for all to authenticated using (public.es_admin()) with check (public.es_admin());

select count(*) as productos_con_minimo from public.stock_minimos;
