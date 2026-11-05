-- =====================================================
--  CANI SHOP — Tareas dentro del panel (tablero Por empezar / En proceso / Listo)
--  Copia TODO, pégalo en Supabase → SQL Editor → Run. Se puede correr varias veces.
--  SOLO tú las ves (el panel). Los clientes nunca. No toca pedidos, productos ni stock.
--  Deja cargadas tus 20 tareas actuales; si ya existen, no las duplica ni las pisa.
-- =====================================================

create table if not exists public.tareas (
  id      text primary key,
  area    text not null default 'Tienda web',
  titulo  text not null,
  nota    text not null default '',
  pct     integer not null default 0 check (pct between 0 and 100),
  creado  timestamptz not null default now()
);

alter table public.tareas enable row level security;
revoke all on public.tareas from anon;
grant select, insert, update, delete on public.tareas to authenticated;

drop policy if exists "solo admin ve tareas" on public.tareas;
create policy "solo admin ve tareas" on public.tareas
  for all to authenticated using (public.es_admin()) with check (public.es_admin());

insert into public.tareas (id, area, titulo, nota, pct, creado) values
  ('t1', 'Tienda web', 'Tarjeta de sellitos', 'Lista. Falta correr el .sql en Supabase y subir el zip a GitHub. Va en cani-shop-panel-nuevo-y-videos.zip.', 80, now() + interval '0 seconds'),
  ('t2', 'Tienda web', 'Blog con la nota de Obakenu', 'Lista. Va en el mismo zip que los sellitos: falta subirlo. Va en cani-shop-panel-nuevo-y-videos.zip.', 80, now() + interval '1 seconds'),
  ('t3', 'Tienda web', 'Portada del blog con Cani', 'Terminada y dentro del zip. Va en cani-shop-panel-nuevo-y-videos.zip.', 100, now() + interval '2 seconds'),
  ('t16', 'Tienda web', 'Panel nuevo: menú, Inicio y tablero de pedidos', 'Panel nuevo unido con empaques, scoops y videos. Falta subir cani-shop-panel-nuevo-y-videos.zip a GitHub.', 80, now() + interval '3 seconds'),
  ('t4', 'Tienda web', 'Carta a Papá Noel', 'Borrador terminado y en pausa. Decidir si se activa antes de Navidad.', 70, now() + interval '4 seconds'),
  ('t5', 'Tienda web', 'Fiesta del pedido (estilo Partiful)', 'Idea elegida: lluvia de stickers, boleto del pedido, pasos de Cani y sellito ganado. Falta el borrador.', 10, now() + interval '5 seconds'),
  ('t6', 'Tienda web', 'Página de enlaces propia', 'Para reemplazar el Linktree, con Cani y tus colores.', 0, now() + interval '6 seconds'),
  ('t7', 'Redes', 'Mejorar el perfil de TikTok', 'Nombre nuevo, descripción, 3 videos fijados y listas de reproducción.', 0, now() + interval '7 seconds'),
  ('t8', 'Redes', 'Serie #AntojoDelDía', 'Plantilla del copy lista y primer video con copy. Falta publicar y mantener el ritmo.', 40, now() + interval '8 seconds'),
  ('t9', 'Redes', 'Página de Facebook CaniShop Bolivia', 'Creada. Falta foto, portada, descripción, usuario @canishopbo y botón de WhatsApp.', 25, now() + interval '9 seconds'),
  ('t10', 'Redes', 'Mensaje de difusión de los sellitos', 'Texto listo. Enviarlo después de subir la tienda.', 50, now() + interval '10 seconds'),
  ('t11', 'Estrategias', 'Ficha en Google Maps', 'Google Business Profile con fotos y el enlace a la tienda.', 0, now() + interval '11 seconds'),
  ('t12', 'Estrategias', 'Scoops para microinfluencers', 'Elegir 3 cuentas de Santa Cruz y mandarles un Scoop a cambio de un video.', 0, now() + interval '12 seconds'),
  ('t13', 'Estrategias', 'Black Friday (27 de noviembre)', 'Fin de semana de Scoop con regalito extra.', 0, now() + interval '13 seconds'),
  ('t14', 'Estrategias', 'Campaña de Navidad', 'Anuncios, lives semanales y fecha límite de pedidos.', 0, now() + interval '14 seconds'),
  ('t15', 'Estrategias', 'Tu año con Cani (estilo Wrapped)', 'Resumen del año para compartir en historias, en diciembre.', 0, now() + interval '15 seconds'),
  ('t17', 'Redes', 'Videos fijados y descripción de TikTok y Facebook', 'Usar la misma descripción en TikTok y en la página CaniShop Bolivia.', 0, now() + interval '16 seconds'),
  ('t18', 'Tienda web', 'Videos en cada producto', 'Círculos con el video en movimiento, visor a pantalla completa con tarjeta del producto y portada que se puede cambiar. Falta correr supabase-videos-producto.sql, subir el zip y subir el primer video (comprimido a 720p).', 80, now() + interval '17 seconds'),
  ('t19', 'Tienda web', 'Compras, empaques y descuentos en el panel', 'Compras con costos y margen, empaques por pedido, productos del scoop y descuento por unidad. Falta poner el costo de la bolsa rosa y completar los empaques.', 80, now() + interval '18 seconds'),
  ('t20', 'Estrategias', 'Cambiar los emojis por íconos', 'La regla de marca es sin emojis en la tienda y el panel; todavía quedan varios de antes. Pendiente de que Laura lo apruebe.', 0, now() + interval '19 seconds')
on conflict (id) do nothing;

select count(*) as tareas from public.tareas;
