-- =====================================================
--  CANI SHOP — Videos de TikTok en cada producto
--  Copia TODO, pégalo en Supabase → SQL Editor → Run.
--  Se puede correr más de una vez. No cambia tus productos.
-- =====================================================
alter table public.productos add column if not exists videos jsonb not null default '[]'::jsonb;
select count(*) as productos, count(*) filter (where videos <> '[]'::jsonb) as con_videos from public.productos;
