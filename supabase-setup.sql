-- =====================================================
--  CANI SHOP — configuración de la base de datos
--  Copia TODO este texto, pégalo en Supabase → SQL Editor → Run
-- =====================================================

-- 1) Quién es administrador: pon aquí el correo con el que vas a entrar al panel.
--    Si quieres más administradores: array['correo1@gmail.com','correo2@gmail.com']
create or replace function public.es_admin() returns boolean
language sql stable as $$
  select coalesce(auth.jwt() ->> 'email', '') = any (array['laums730@gmail.com'])
$$;

-- 2) Tabla de productos
create table if not exists public.productos (
  id          text primary key,
  nombre      text not null,
  precio      numeric(10,2) not null default 0,
  categorias  text[] not null default '{}',
  nuevo       boolean not null default false,
  activo      boolean not null default true,
  descripcion text not null default '',
  imagenes    text[] not null default '{}',
  variantes   jsonb not null default '[]',   -- [{"nombre":"Kuromi","stock":3}, ...]
  stock       integer not null default 0,    -- se usa si el producto no tiene modelos
  orden       integer not null default 0,
  creado      timestamptz not null default now()
);

alter table public.productos enable row level security;

grant select on public.productos to anon, authenticated;
grant insert, update, delete on public.productos to authenticated;

drop policy if exists "todos ven productos activos" on public.productos;
create policy "todos ven productos activos" on public.productos
  for select using (activo or public.es_admin());

drop policy if exists "admin crea" on public.productos;
create policy "admin crea" on public.productos
  for insert to authenticated with check (public.es_admin());

drop policy if exists "admin edita" on public.productos;
create policy "admin edita" on public.productos
  for update to authenticated using (public.es_admin()) with check (public.es_admin());

drop policy if exists "admin borra" on public.productos;
create policy "admin borra" on public.productos
  for delete to authenticated using (public.es_admin());

-- 3) Carpeta pública para las fotos
insert into storage.buckets (id, name, public)
values ('fotos', 'fotos', true)
on conflict (id) do update set public = true;

drop policy if exists "fotos publicas" on storage.objects;
create policy "fotos publicas" on storage.objects
  for select using (bucket_id = 'fotos');

drop policy if exists "admin sube fotos" on storage.objects;
create policy "admin sube fotos" on storage.objects
  for insert to authenticated with check (bucket_id = 'fotos' and public.es_admin());

drop policy if exists "admin cambia fotos" on storage.objects;
create policy "admin cambia fotos" on storage.objects
  for update to authenticated using (bucket_id = 'fotos' and public.es_admin());

drop policy if exists "admin borra fotos" on storage.objects;
create policy "admin borra fotos" on storage.objects
  for delete to authenticated using (bucket_id = 'fotos' and public.es_admin());

-- 4) Tu primer producto (el que ya tenías en Shopify)
insert into public.productos (id, nombre, precio, categorias, nuevo, descripcion, imagenes, variantes)
values (
  'armable-acrilico-sanrio',
  'Armable Acrílico Sanrio',
  12,
  array['sanrio'],
  true,
  'Personaliza a tu personaje favorito con diferentes accesorios y outfits. Modelos: Kuromi, My Melody, Cinnamoroll y Hello Kitty.',
  array[
    'https://canishopbo.myshopify.com/cdn/shop/files/a0X7xgON_wzIqcUhIchbBg.webp?v=1792717426&width=900',
    'https://canishopbo.myshopify.com/cdn/shop/files/d7iS3oa1v_6jqHHFFKSSQ_87cfdbbf-d414-4fb1-931b-e497427c624a.webp?v=1792951627&width=900'
  ],
  '[{"nombre":"Cinnamoroll","stock":0},{"nombre":"Kuromi","stock":5},{"nombre":"My Melody","stock":5},{"nombre":"Hello Kitty","stock":5}]'
)
on conflict (id) do nothing;
