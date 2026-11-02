-- =====================================================
--  CANI SHOP — Fecha de entrega de cada pedido
--  Copia TODO, pégalo en Supabase → SQL Editor → Run. Se puede correr varias veces.
--  Antes debes haber corrido supabase-transacciones.sql (guarda la fecha de pago).
--  No toca tus productos, tu stock ni tus costos.
-- =====================================================

alter table public.pedidos add column if not exists entregado_en timestamptz;

-- Cuando un pedido pasa a Entregado se registra la fecha de entrega (si no pusiste una).
-- Si vuelve a otro estado, la fecha se borra.
create or replace function public.marcar_entrega() returns trigger
language plpgsql as $$
begin
  if new.estado = 'entregado' then
    if new.entregado_en is null then new.entregado_en := now(); end if;
  else
    new.entregado_en := null;
  end if;
  return new;
end $$;

drop trigger if exists pedidos_marcan_entrega on public.pedidos;
create trigger pedidos_marcan_entrega before insert or update of estado, entregado_en
  on public.pedidos for each row execute function public.marcar_entrega();

-- Pedidos que ya tenías entregados: se toma la fecha de pago (o la del pedido)
update public.pedidos set entregado_en = coalesce(pagado_en, creado)
where estado = 'entregado' and entregado_en is null;

select count(*) as pedidos_entregados from public.pedidos where entregado_en is not null;
