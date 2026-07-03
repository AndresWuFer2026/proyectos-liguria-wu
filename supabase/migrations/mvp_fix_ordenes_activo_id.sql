-- Proyecto WU - MVP fix OT <-> activo
-- Ejecutar en Supabase SQL Editor y luego refrescar la app.

create extension if not exists pgcrypto;

create table if not exists public.ordenes_trabajo (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now()
);

alter table public.ordenes_trabajo
  add column if not exists codigo text,
  add column if not exists codigo_ot text,
  add column if not exists activo_id uuid,
  add column if not exists equipo_id uuid,
  add column if not exists parte_id uuid,
  add column if not exists tipo_mantenimiento text,
  add column if not exists fecha_programada date,
  add column if not exists tecnico_asignado_id uuid,
  add column if not exists tecnico_asignado text,
  add column if not exists supervisor_id uuid,
  add column if not exists estado text default 'PENDIENTE',
  add column if not exists descripcion text,
  add column if not exists prioridad text default 'MEDIA',
  add column if not exists especialidad text,
  add column if not exists responsable text,
  add column if not exists duracion_estimada_horas numeric,
  add column if not exists fecha_reprogramada date,
  add column if not exists hora_inicio time,
  add column if not exists hora_fin time,
  add column if not exists horas_hombre numeric,
  add column if not exists observaciones text,
  add column if not exists observaciones_ejecucion text,
  add column if not exists estado_final text,
  add column if not exists updated_at timestamptz default now();

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'ordenes_trabajo'
      and column_name = 'asset_id'
      and data_type = 'uuid'
  ) then
    execute 'update public.ordenes_trabajo set activo_id = coalesce(activo_id, asset_id) where activo_id is null';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'ordenes_trabajo'
      and column_name = 'equipo'
      and data_type = 'uuid'
  ) then
    execute 'update public.ordenes_trabajo set activo_id = coalesce(activo_id, equipo) where activo_id is null';
  end if;
end $$;

update public.ordenes_trabajo
set
  activo_id = coalesce(activo_id, equipo_id),
  equipo_id = coalesce(equipo_id, activo_id)
where activo_id is null
   or equipo_id is null;

update public.ordenes_trabajo
set
  codigo = coalesce(
    nullif(codigo, ''),
    nullif(codigo_ot, ''),
    'OT-' || to_char(created_at, 'YYYY') || '-' || lpad(row_number_value::text, 4, '0')
  ),
  codigo_ot = coalesce(
    nullif(codigo_ot, ''),
    nullif(codigo, ''),
    'OT-' || to_char(created_at, 'YYYY') || '-' || lpad(row_number_value::text, 4, '0')
  )
from (
  select id, row_number() over (order by created_at, id) as row_number_value
  from public.ordenes_trabajo
) correlativos
where public.ordenes_trabajo.id = correlativos.id
  and (codigo is null or codigo = '' or codigo_ot is null or codigo_ot = '');

update public.ordenes_trabajo
set estado = case upper(coalesce(estado, 'PENDIENTE'))
  when 'PROGRAMADA' then 'PROGRAMADA'
  when 'BORRADOR' then 'PENDIENTE'
  when 'PENDIENTE' then 'PENDIENTE'
  when 'PENDIENTE_APROBACION' then 'PENDIENTE'
  when 'APROBADA' then 'PROGRAMADA'
  when 'ASIGNADA' then 'PROGRAMADA'
  when 'EN_EJECUCION' then 'EN_EJECUCION'
  when 'PENDIENTE_VALIDACION' then 'VALIDACION'
  when 'VALIDACION' then 'VALIDACION'
  when 'CERRADA' then 'CERRADA'
  when 'RECHAZADA' then 'CANCELADA'
  when 'REPROGRAMADA' then 'PROGRAMADA'
  when 'CANCELADA' then 'CANCELADA'
  else 'PENDIENTE'
end;

do $$
declare
  constraint_name text;
begin
  for constraint_name in
    select c.conname
    from pg_constraint c
    join pg_attribute a
      on a.attrelid = c.conrelid
     and a.attnum = any(c.conkey)
    where c.conrelid = 'public.ordenes_trabajo'::regclass
      and c.contype = 'c'
      and a.attname = 'estado'
  loop
    execute format(
      'alter table public.ordenes_trabajo drop constraint if exists %I',
      constraint_name
    );
  end loop;
end $$;

alter table public.ordenes_trabajo
  add constraint ordenes_trabajo_estado_mvp_check
  check (estado in (
    'PROGRAMADA',
    'PENDIENTE',
    'EN_EJECUCION',
    'VALIDACION',
    'CERRADA',
    'CANCELADA'
  ));

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists ordenes_trabajo_set_updated_at on public.ordenes_trabajo;

create trigger ordenes_trabajo_set_updated_at
before update on public.ordenes_trabajo
for each row
execute function public.set_updated_at();

create index if not exists idx_ordenes_trabajo_activo_id
  on public.ordenes_trabajo (activo_id);

create index if not exists idx_ordenes_trabajo_estado
  on public.ordenes_trabajo (estado);

create index if not exists idx_ordenes_trabajo_fecha_programada
  on public.ordenes_trabajo (fecha_programada);

do $$
begin
  if to_regclass('public.partes_activo') is not null then
    alter table public.ordenes_trabajo
      drop constraint if exists ordenes_trabajo_parte_id_fkey;

    alter table public.ordenes_trabajo
      add constraint ordenes_trabajo_parte_id_fkey
      foreign key (parte_id)
      references public.partes_activo(id)
      on delete set null
      not valid;
  end if;

  if to_regclass('public.equipos') is not null then
    alter table public.ordenes_trabajo
      drop constraint if exists ordenes_trabajo_activo_id_equipos_fkey;

    alter table public.ordenes_trabajo
      add constraint ordenes_trabajo_activo_id_equipos_fkey
      foreign key (activo_id)
      references public.equipos(id)
      on delete set null
      not valid;
  elsif to_regclass('public.activos') is not null then
    alter table public.ordenes_trabajo
      drop constraint if exists ordenes_trabajo_activo_id_activos_fkey;

    alter table public.ordenes_trabajo
      add constraint ordenes_trabajo_activo_id_activos_fkey
      foreign key (activo_id)
      references public.activos(id)
      on delete set null
      not valid;
  end if;
end $$;

notify pgrst, 'reload schema';
