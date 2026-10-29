-- =====================================================
--  CANI SHOP — Transacciones y estadísticas
--  Guarda la fecha en que cada pedido quedó PAGADO y con qué medio se pagó.
--  Copia TODO, pégalo en Supabase → SQL Editor → Run. Se puede correr varias veces.
-- =====================================================

alter table public.pedidos add column if not exists pagado_en  timestamptz;
alter table public.pedidos add column if not exists medio_pago text not null default 'QR';

-- Cuando un pedido pasa a Pagado (o Entregado) se registra la fecha de pago.
-- Si vuelve a Nuevo / Confirmado / Cancelado, deja de contar como transacción.
create or replace function public.marcar_pago() returns trigger
language plpgsql as $$
begin
  if new.estado in ('pagado', 'entregado') then
    if new.pagado_en is null then new.pagado_en := now(); end if;
  else
    new.pagado_en := null;
  end if;
  return new;
end $$;

drop trigger if exists pedidos_marcan_pago on public.pedidos;
create trigger pedidos_marcan_pago before insert or update of estado, pagado_en
  on public.pedidos for each row execute function public.marcar_pago();

-- Pedidos que ya tenías pagados o entregados: se toma la fecha del pedido
update public.pedidos set pagado_en = creado
where estado in ('pagado', 'entregado') and pagado_en is null;

create index if not exists pedidos_pagado_en on public.pedidos (pagado_en);

select count(*) as transacciones from public.pedidos where pagado_en is not null;
