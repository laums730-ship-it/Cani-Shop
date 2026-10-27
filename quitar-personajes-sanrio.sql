-- =====================================================
--  CANI SHOP — Sanrio como un solo personaje (Hello Kitty separado)
--  Quita Kuromi, My Melody, Cinnamoroll, Pochacco y Pompompurin como
--  personajes separados. Sus productos quedan dentro de "Sanrio".
-- =====================================================

-- 1) Sacarlos del menú de personajes
update public.ajustes
set datos = jsonb_set(datos, '{categorias}', (
  select coalesce(jsonb_agg(x order by o), '[]')
  from jsonb_array_elements(datos->'categorias') with ordinality q(x, o)
  where x->>'id' not in ('kuromi','my-melody','cinnamoroll','pochacco','pompompurin')
))
where id = 'tienda' and datos ? 'categorias';

-- 2) Sus productos pasan a Sanrio
update public.productos
set categorias = (
  select array_agg(distinct c order by c)
  from unnest(categorias || array['sanrio']) c
  where c not in ('kuromi','my-melody','cinnamoroll','pochacco','pompompurin')
)
where categorias && array['kuromi','my-melody','cinnamoroll','pochacco','pompompurin'];

-- 3) Personajes que quedan, en este orden
update public.ajustes
set datos = jsonb_set(datos, '{categorias}', (
  select jsonb_agg(x order by
    case x->>'id' when 'sanrio' then 1 when 'hello-kitty' then 2 when 'snoopy' then 3 when 'stitch' then 4
                  when 'obakenu' then 5 when 'bts' then 6 when 'gatitos' then 7 else 50 end, o)
  from jsonb_array_elements(datos->'categorias') with ordinality q(x, o)
))
where id = 'tienda' and datos ? 'categorias';

select x->>'nombre' as personaje
from public.ajustes, jsonb_array_elements(datos->'categorias') x
where id = 'tienda' and x->>'tipo' = 'personaje';
