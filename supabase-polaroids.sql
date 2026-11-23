-- =====================================================================
-- Cani Shop · Pack de polaroids (complemento de Amigo secreto)
-- Pegar en Supabase → SQL Editor → Run, ANTES de subir los archivos nuevos.
-- Se puede correr más de una vez sin problema.
-- =====================================================================

-- 1) Bucket PRIVADO para las fotos de las clientas (solo JPG, máximo 8 MB)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('polaroids', 'polaroids', false, 8388608, array['image/jpeg'])
on conflict (id) do update
  set public = false, file_size_limit = 8388608, allowed_mime_types = array['image/jpeg'];

-- 2) Políticas: cualquiera puede SUBIR a pack/<id>/<1-4>.jpg; solo la administradora puede VER o BORRAR
drop policy if exists "clientes suben polaroids" on storage.objects;
create policy "clientes suben polaroids" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'polaroids' and name ~ '^pack/[a-z0-9]{8,32}/[1-4]\.jpg$');

drop policy if exists "admin ve polaroids" on storage.objects;
create policy "admin ve polaroids" on storage.objects
  for select to authenticated
  using (bucket_id = 'polaroids' and es_admin());

drop policy if exists "admin borra polaroids" on storage.objects;
create policy "admin borra polaroids" on storage.objects
  for delete to authenticated
  using (bucket_id = 'polaroids' and es_admin());

-- 3) crear_pedido: igual que antes + packs de polaroids.
--    El precio lo pone el servidor (ajustes → polaroids.precio, por defecto Bs 15):
--    la clienta no puede cambiarlo desde su navegador.
create or replace function public.crear_pedido(p jsonb)
 returns bigint
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  it jsonb; prod record; items jsonb := '[]'; n int := 0; cant int; vari text; num bigint;
  sc jsonb; cfg jsonb; op jsonb; extra jsonb := '{}'; video_precio numeric;
  colores jsonb; personajes jsonb; cj jsonb; caja_nombre text := ''; carta_txt text := '';
  pk jsonb; pol_n int := 0; pols jsonb := '[]'; pol_precio numeric;
begin
  -- Productos del carrito
  if jsonb_typeof(p->'items') = 'array' then
    if jsonb_array_length(p->'items') > 60 then raise exception 'Pedido demasiado grande'; end if;
    for it in select * from jsonb_array_elements(p->'items') loop
      select * into prod from productos where id = it->>'id' and activo;
      if not found then continue; end if;
      cant := least(greatest(coalesce((it->>'cant')::int, 1), 1), 99);
      vari := nullif(left(coalesce(it->>'variante', ''), 120), '');
      if jsonb_array_length(prod.variantes) > 0 and not exists (
           select 1 from jsonb_array_elements(prod.variantes) v where v->>'nombre' = vari) then
        continue;
      end if;
      if jsonb_array_length(prod.variantes) = 0 then vari := null; end if;
      items := items || jsonb_build_object('id', prod.id, 'nombre', prod.nombre, 'variante', vari,
                                           'cant', cant, 'precio', prod.precio, 'desc', 0, 'desc_nota', '');
      n := n + 1;
    end loop;
  end if;

  -- Scoop
  sc := p->'scoop';
  if jsonb_typeof(sc) = 'object' then
    select datos->'scoops' into cfg from ajustes where id = 'tienda';
    if cfg is null or coalesce((cfg->>'activo')::boolean, false) = false then raise exception 'Los scoops no están disponibles ahora'; end if;
    select o into op from jsonb_array_elements(cfg->'opciones') o where o->>'nombre' = sc->>'opcion' limit 1;
    if op is null then raise exception 'Opción de scoop no válida'; end if;
    cant := least(greatest(coalesce((sc->>'cant')::int, 1), 1), 20);
    items := items || jsonb_build_object('id', 'scoop', 'nombre', op->>'nombre', 'variante', null,
                                         'cant', cant, 'precio', (op->>'precio')::numeric, 'desc', 0, 'desc_nota', '');
    n := n + 1;
    if coalesce((sc->>'video')::boolean, false) then
      video_precio := coalesce((cfg->>'precioVideo')::numeric, 5);
      items := items || jsonb_build_object('id', 'video-scoop', 'nombre', 'Video de tu Scoop', 'variante', null,
                                           'cant', 1, 'precio', video_precio, 'desc', 0, 'desc_nota', '');
    end if;
    -- Caja elegida (precio desde tu configuración)
    if coalesce(sc->>'caja', '') <> '' then
      select o into cj from jsonb_array_elements(coalesce(cfg->'cajas',
        '[{"nombre":"Caja blanca","precio":0},{"nombre":"Caja especial","precio":5}]'::jsonb)) o
        where o->>'nombre' = sc->>'caja' limit 1;
      if cj is not null then
        caja_nombre := cj->>'nombre';
        if coalesce((cj->>'precio')::numeric, 0) > 0 then
          items := items || jsonb_build_object('id', 'caja-scoop', 'nombre', cj->>'nombre', 'variante', null,
                                               'cant', 1, 'precio', (cj->>'precio')::numeric, 'desc', 0, 'desc_nota', '');
        end if;
      end if;
    end if;
    -- Carta personalizada impresa (precio desde tu configuración, por defecto Bs 3)
    if coalesce((sc->>'carta')::boolean, false) and coalesce((cfg->>'carta')::boolean, true) then
      carta_txt := left(btrim(coalesce(sc->>'carta_texto', '')), 280);
      if carta_txt <> '' then
        items := items || jsonb_build_object('id', 'carta-scoop', 'nombre', 'Carta personalizada impresa', 'variante', null,
                                             'cant', 1, 'precio', coalesce(nullif(cfg->>'precioCarta', '')::numeric, 3), 'desc', 0, 'desc_nota', '');
      end if;
    end if;
    select coalesce(jsonb_agg(left(x, 40)), '[]') into colores
      from (select jsonb_array_elements_text(case when jsonb_typeof(sc->'colores') = 'array' then sc->'colores' else '[]' end) x limit 12) t;
    select coalesce(jsonb_agg(left(x, 40)), '[]') into personajes
      from (select jsonb_array_elements_text(case when jsonb_typeof(sc->'personajes') = 'array' then sc->'personajes' else '[]' end) x limit 15) t;
    extra := jsonb_build_object('tipo', 'scoop', 'caja', caja_nombre, 'colores', colores, 'personajes', personajes,
               'video', coalesce((sc->>'video')::boolean, false), 'tiktok', left(coalesce(sc->>'tiktok', ''), 60),
               'carta', carta_txt);
  end if;

  -- Packs de polaroids (4 fotos por pack, máximo 10 packs)
  if jsonb_typeof(p->'polaroids') = 'array' and jsonb_array_length(p->'polaroids') > 0 then
    select nullif(datos->'polaroids'->>'precio', '')::numeric into pol_precio from ajustes where id = 'tienda';
    pol_precio := coalesce(pol_precio, 15);
    for pk in select * from jsonb_array_elements(p->'polaroids') limit 10 loop
      if coalesce(pk->>'carpeta', '') ~ '^pack/[a-z0-9]{8,32}$' then
        pol_n := pol_n + 1;
        pols := pols || jsonb_build_object(
          'carpeta', pk->>'carpeta',
          'fotos', '["1.jpg","2.jpg","3.jpg","4.jpg"]'::jsonb,
          'textos', (select coalesce(jsonb_agg(left(btrim(coalesce(pk->'textos'->>g, '')), 20) order by g), '[]')
                       from generate_series(0, 3) g));
      end if;
    end loop;
    if pol_n > 0 then
      items := items || jsonb_build_object('id', 'pack-polaroids', 'nombre', 'Pack 4 polaroids', 'variante', null,
                                           'cant', pol_n, 'precio', pol_precio, 'desc', 0, 'desc_nota', '');
      n := n + 1;
      extra := extra || jsonb_build_object('polaroids', pols);
    end if;
  end if;

  if n = 0 then raise exception 'Ningún producto válido'; end if;

  if left(coalesce(p->>'comprobante', ''), 8) = 'pedidos/' then
    extra := extra || jsonb_build_object('comprobante', left(p->>'comprobante', 200));
  end if;

  insert into pedidos (cliente, telefono, ciudad, direccion, entrega, nota, items, extra)
  values (left(coalesce(p->>'cliente', ''), 120), left(coalesce(p->>'telefono', ''), 40),
          left(coalesce(p->>'ciudad', ''), 80), left(coalesce(p->>'direccion', ''), 250),
          left(coalesce(p->>'entrega', ''), 120), left(coalesce(p->>'nota', ''), 500), items, extra)
  returning numero into num;
  return num;
end $function$;
