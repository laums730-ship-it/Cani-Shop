-- =====================================================
--  CANI SHOP — ajustes de la tienda (avisos, banners, textos)
--  Copia TODO este texto, pégalo en Supabase → SQL Editor → Run
-- =====================================================

create table if not exists public.ajustes (
  id     text primary key default 'tienda',
  datos  jsonb not null default '{}',
  editado timestamptz not null default now()
);

alter table public.ajustes enable row level security;

grant select on public.ajustes to anon, authenticated;
grant insert, update on public.ajustes to authenticated;

drop policy if exists "todos ven ajustes" on public.ajustes;
create policy "todos ven ajustes" on public.ajustes
  for select using (true);

drop policy if exists "admin crea ajustes" on public.ajustes;
create policy "admin crea ajustes" on public.ajustes
  for insert to authenticated with check (public.es_admin());

drop policy if exists "admin edita ajustes" on public.ajustes;
create policy "admin edita ajustes" on public.ajustes
  for update to authenticated using (public.es_admin()) with check (public.es_admin());
