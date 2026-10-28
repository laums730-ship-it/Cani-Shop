-- =====================================================
--  CANI SHOP — Scoops: carta personalizada impresa (+Bs 4)
--  Incluye también la caja y el video. Copia TODO, pégalo en
--  Supabase → SQL Editor → Run. Se puede correr más de una vez.
-- =====================================================

create or replace function public.crear_pedido(p jsonb)
returns bigint
language plpgsql security definer set search_path = public as $$
declare
  it jsonb; prod record; items jsonb := '[]'; n int := 0; cant int; vari text; num bigint;
  sc jsonb; cfg jsonb; op jsonb; extra jsonb := '{}'; video_precio numeric;
  colores jsonb; personajes jsonb; cj jsonb; caja_nombre text := ''; carta_txt text := '';
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
    -- Carta personalizada impresa (precio desde tu configuración, por defecto Bs 4)
    if coalesce((sc->>'carta')::boolean, false) and coalesce((cfg->>'carta')::boolean, true) then
      carta_txt := left(btrim(coalesce(sc->>'carta_texto', '')), 280);
      if carta_txt <> '' then
        items := items || jsonb_build_object('id', 'carta-scoop', 'nombre', 'Carta personalizada impresa', 'variante', null,
                                             'cant', 1, 'precio', coalesce(nullif(cfg->>'precioCarta', '')::numeric, 4), 'desc', 0, 'desc_nota', '');
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
end $$;

revoke all on function public.crear_pedido(jsonb) from public;
grant execute on function public.crear_pedido(jsonb) to anon, authenticated;

-- Precio de la carta: Bs 4
update public.ajustes
set datos = jsonb_set(datos, '{scoops,precioCarta}', '4'::jsonb, true)
where id = 'tienda' and datos ? 'scoops';
