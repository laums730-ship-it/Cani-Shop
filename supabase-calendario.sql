-- =====================================================
--  CANI SHOP — Calendario de contenido
--  Copia TODO este texto, pégalo en Supabase → SQL Editor → Run
--  Crea la tabla del calendario (solo tú la ves) y la llena con el plan de noviembre y diciembre.
--  Se puede correr más de una vez: el plan solo se carga si el calendario está vacío.
-- =====================================================

create table if not exists public.contenido (
  id uuid primary key default gen_random_uuid(),
  fecha date,                       -- vacío = papelito sin día
  tipo text not null default 'antojo',
  titulo text not null default '',
  texto text not null default '',
  estado text not null default 'idea',   -- idea · grabado · publicado
  color text,
  creado timestamptz not null default now()
);
create index if not exists contenido_fecha on public.contenido (fecha);

alter table public.contenido enable row level security;
drop policy if exists "admin contenido" on public.contenido;
create policy "admin contenido" on public.contenido for all to authenticated
  using (public.es_admin()) with check (public.es_admin());

-- Plan inicial (solo si está vacío)
insert into public.contenido (fecha, tipo, titulo, texto, estado, color)
select fecha::date, tipo, titulo, texto, estado, color from (values
('2026-11-09','antojo','#AntojoDelDía','Elige un producto que se venda bien. Usa la plantilla: 3 características, la pregunta "¿Te la llevas o te la llevas?" y los datos de pedido.','idea',null),
('2026-11-10','detras','Detrás de escena: armando un Scoop','Graba el armado desde arriba, sin hablar, con sonido de empaque. Al final, Cani en la cajita.','idea',null),
('2026-11-11','antojo','#AntojoDelDía','','idea',null),
('2026-11-12','clientas','Clientas reales','Unboxing de una clienta o captura de un mensaje bonito (pide permiso antes).','idea',null),
('2026-11-13','antojo','#AntojoDelDía','','idea',null),
('2026-11-14','entretener','Para entretener','Idea: "¿Qué personaje eres según tu Scoop?" o un antes y después de un escritorio decorado.','idea',null),
('2026-11-16','antojo','#AntojoDelDía','Elige un producto que se venda bien. Usa la plantilla: 3 características, la pregunta "¿Te la llevas o te la llevas?" y los datos de pedido.','idea',null),
('2026-11-17','detras','Detrás de escena: armando un Scoop','Graba el armado desde arriba, sin hablar, con sonido de empaque. Al final, Cani en la cajita.','idea',null),
('2026-11-18','antojo','#AntojoDelDía','','idea',null),
('2026-11-19','clientas','Clientas reales','Unboxing de una clienta o captura de un mensaje bonito (pide permiso antes).','idea',null),
('2026-11-20','antojo','#AntojoDelDía','','idea',null),
('2026-11-21','entretener','Para entretener','Idea: "¿Qué personaje eres según tu Scoop?" o un antes y después de un escritorio decorado.','idea',null),
('2026-11-23','antojo','#AntojoDelDía','Elige un producto que se venda bien. Usa la plantilla: 3 características, la pregunta "¿Te la llevas o te la llevas?" y los datos de pedido.','idea',null),
('2026-11-24','detras','Detrás de escena: armando un Scoop','Graba el armado desde arriba, sin hablar, con sonido de empaque. Al final, Cani en la cajita.','idea',null),
('2026-11-25','antojo','#AntojoDelDía','','idea',null),
('2026-11-26','clientas','Clientas reales','Unboxing de una clienta o captura de un mensaje bonito (pide permiso antes).','idea',null),
('2026-11-27','antojo','#AntojoDelDía','','idea',null),
('2026-11-28','entretener','Para entretener','Idea: "¿Qué personaje eres según tu Scoop?" o un antes y después de un escritorio decorado.','idea',null),
('2026-11-30','antojo','#AntojoDelDía','Elige un producto que se venda bien. Usa la plantilla: 3 características, la pregunta "¿Te la llevas o te la llevas?" y los datos de pedido.','idea',null),
('2026-12-01','detras','Detrás de escena: armando un Scoop','Graba el armado desde arriba, sin hablar, con sonido de empaque. Al final, Cani en la cajita.','idea',null),
('2026-12-02','antojo','#AntojoDelDía','','idea',null),
('2026-12-03','clientas','Clientas reales','Unboxing de una clienta o captura de un mensaje bonito (pide permiso antes).','idea',null),
('2026-12-04','antojo','#AntojoDelDía','','idea',null),
('2026-12-05','entretener','Para entretener','Idea: "¿Qué personaje eres según tu Scoop?" o un antes y después de un escritorio decorado.','idea',null),
('2026-12-07','antojo','#AntojoDelDía','Elige un producto que se venda bien. Usa la plantilla: 3 características, la pregunta "¿Te la llevas o te la llevas?" y los datos de pedido.','idea',null),
('2026-12-08','detras','Detrás de escena: armando un Scoop','Graba el armado desde arriba, sin hablar, con sonido de empaque. Al final, Cani en la cajita.','idea',null),
('2026-12-09','antojo','#AntojoDelDía','','idea',null),
('2026-12-10','clientas','Clientas reales','Unboxing de una clienta o captura de un mensaje bonito (pide permiso antes).','idea',null),
('2026-12-11','antojo','#AntojoDelDía','','idea',null),
('2026-12-12','entretener','Para entretener','Idea: "¿Qué personaje eres según tu Scoop?" o un antes y después de un escritorio decorado.','idea',null),
('2026-12-14','antojo','#AntojoDelDía','Elige un producto que se venda bien. Usa la plantilla: 3 características, la pregunta "¿Te la llevas o te la llevas?" y los datos de pedido.','idea',null),
('2026-12-15','detras','Detrás de escena: armando un Scoop','Graba el armado desde arriba, sin hablar, con sonido de empaque. Al final, Cani en la cajita.','idea',null),
('2026-12-16','antojo','#AntojoDelDía','','idea',null),
('2026-12-17','clientas','Clientas reales','Unboxing de una clienta o captura de un mensaje bonito (pide permiso antes).','idea',null),
('2026-12-18','antojo','#AntojoDelDía','','idea',null),
('2026-12-19','entretener','Para entretener','Idea: "¿Qué personaje eres según tu Scoop?" o un antes y después de un escritorio decorado.','idea',null),
('2026-12-21','antojo','#AntojoDelDía','Elige un producto que se venda bien. Usa la plantilla: 3 características, la pregunta "¿Te la llevas o te la llevas?" y los datos de pedido.','idea',null),
('2026-12-22','detras','Detrás de escena: armando un Scoop','Graba el armado desde arriba, sin hablar, con sonido de empaque. Al final, Cani en la cajita.','idea',null),
('2026-12-23','antojo','#AntojoDelDía','','idea',null),
('2026-12-28','antojo','#AntojoDelDía','Elige un producto que se venda bien. Usa la plantilla: 3 características, la pregunta "¿Te la llevas o te la llevas?" y los datos de pedido.','idea',null),
('2026-12-29','detras','Detrás de escena: armando un Scoop','Graba el armado desde arriba, sin hablar, con sonido de empaque. Al final, Cani en la cajita.','idea',null),
('2026-12-30','antojo','#AntojoDelDía','','idea',null),
('2026-12-31','clientas','Clientas reales','Unboxing de una clienta o captura de un mensaje bonito (pide permiso antes).','idea',null),
('2026-11-09','campana','Lanzamiento: tienda nueva con sellitos y blog','Subir el zip, mandar el mensaje de difusión de los sellitos y arreglar el perfil de TikTok y Facebook.','idea',null),
('2026-11-12','campana','Compartir la nota de Obakenu','Video corto "Te cuento quién es Obakenu en 30 segundos" con el enlace al blog.','idea',null),
('2026-11-16','campana','Anuncio: Scoops navideños','Mostrar los Scoops de Navidad y cómo pedirlos.','idea',null),
('2026-11-23','campana','Aviso: se viene Black Friday','Contar que del 27 al 30 hay Scoop con regalito extra.','idea',null),
('2026-11-27','campana','Black Friday: Scoop con regalito extra','Del 27 al 30 de noviembre. Regalito en lugar de descuento.','idea',null),
('2026-11-30','campana','Último día de Black Friday','','idea',null),
('2026-12-01','campana','Empiezan los anuncios pagados','Bs 40 por día hasta el 15. Usar el video con más vistas. Si en 3 días un anuncio no trae mensajes, cambiarlo.','idea',null),
('2026-12-03','live','Live de TikTok','Precios especiales solo durante el live.','idea',null),
('2026-12-10','live','Live de TikTok','','idea',null),
('2026-12-12','campana','Aviso: fecha límite de Navidad','Envíos a otros departamentos hasta el sábado 19. Santa Cruz hasta el 21 o 22.','idea',null),
('2026-12-15','campana','Último día de anuncios','','idea',null),
('2026-12-17','live','Live de TikTok (último antes de Navidad)','','idea',null),
('2026-12-19','campana','Último envío a otros departamentos','Recordar en historias y en el estado de WhatsApp.','idea',null),
('2026-12-22','campana','Último día de pedidos en Santa Cruz','','idea',null),
('2026-12-28','campana','Tu año con Cani','Resumen del año para compartir en historias y agradecer a las clientas.','idea',null),
('2027-01-11','campana','Regreso a clases','Papelería para el colegio: kits y combos.','idea',null),
(null::date,'papelito','Grabar 3 videos de una vez los martes y viernes','','idea','rosa'),
(null,'papelito','Ideas de #AntojoDelDía: libretas, llaveros, stickers, estuches','','idea','lila'),
(null,'papelito','Pedir a 3 clientas permiso para usar su unboxing','','idea','crema'),
(null,'papelito','Probar sonido de teclear al inicio de cada antojo','','idea','menta'),
('2026-11-05','seguidores','4907','Seguidores de TikTok','publicado',null)
) as v(fecha, tipo, titulo, texto, estado, color)
where not exists (select 1 from public.contenido);

-- Listo
select count(*) as filas_en_el_calendario from public.contenido;
