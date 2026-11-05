-- =====================================================
--  CANI SHOP — Empaques (caja, bolsa, sobres…) con su costo. SOLO lo ves tú en el panel.
--  Copia TODO, pégalo en Supabase → SQL Editor → Run. Se puede correr varias veces.
--  No toca tus productos, tu stock ni tus costos. Los clientes nunca ven esto.
--  Los costos quedan en 0: ponlos tú en el panel → Compras → "Mis empaques".
-- =====================================================

create table if not exists public.empaques (
  id       text primary key,
  nombre   text not null,
  costo    numeric not null default 0 check (costo >= 0),
  defecto  boolean not null default false,   -- si está marcado, se agrega solo a los pedidos nuevos
  orden    integer not null default 0
);

alter table public.empaques enable row level security;
revoke all on public.empaques from anon;
grant select, insert, update, delete on public.empaques to authenticated;

drop policy if exists "solo admin ve empaques" on public.empaques;
create policy "solo admin ve empaques" on public.empaques
  for all to authenticated using (public.es_admin()) with check (public.es_admin());

insert into public.empaques (id, nombre, costo, orden) values
  ('caja-blanca',        'Caja blanca',              0, 1),
  ('bolsa-rosa-envios',  'Bolsa rosa para envíos',   0, 2),
  ('sobre-papel-chico',  'Sobre de papel (chico)',   0, 3),
  ('sobre-papel-grande', 'Sobre de papel (grande)',  0, 4)
on conflict (id) do nothing;

select count(*) as empaques from public.empaques;
