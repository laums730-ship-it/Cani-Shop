-- Cambia la franja de arriba para que diga solo "Envíos a toda Bolivia"
update public.ajustes
set datos = jsonb_set(datos, '{avisos}', '["Envíos a toda Bolivia"]'::jsonb)
where id = 'tienda';

select datos->'avisos' as franja_de_arriba from public.ajustes where id = 'tienda';
