-- Proyecto WU Beta v1.0 - MVP estabilizacion
-- Ejecutar en Supabase SQL Editor.
-- Objetivo:
-- 1) Normalizar estados de ordenes_trabajo al MVP.
-- 2) Corregir constraint conflictivo de fichas_mantenimiento.tipo.
-- 3) Recargar cache de PostgREST.

create extension if not exists pgcrypto;

-- =========================================================
-- 1) Ordenes de trabajo: estado MVP
-- =========================================================

create table if not exists public.ordenes_trabajo (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now()
);

alter table public.ordenes_trabajo
  add column if not exists codigo_ot text,
  add column if not exists equipo_id uuid,
  add column if not exists activo_id uuid,
  add column if not exists tipo_mantenimiento text,
  add column if not exists especialidad text,
  add column if not exists responsable text,
  add column if not exists tecnico_asignado text,
  add column if not exists tecnico text,
  add column if not exists asignado_a text,
  add column if not exists fecha_programada date,
  add column if not exists fecha_reprogramada date,
  add column if not exists duracion_estimada_horas numeric,
  add column if not exists descripcion text,
  add column if not exists prioridad text default 'MEDIA',
  add column if not exists estado text default 'PENDIENTE',
  add column if not exists hora_inicio time,
  add column if not exists hora_fin time,
  add column if not exists horas_hombre numeric,
  add column if not exists observaciones text,
  add column if not exists observaciones_ejecucion text,
  add column if not exists estado_final text;

alter table public.ordenes_trabajo
  alter column estado set default 'PENDIENTE';

do $$
declare
  constraint_record record;
begin
  for constraint_record in
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
      constraint_record.conname
    );
  end loop;
end $$;

update public.ordenes_trabajo
set estado = case upper(coalesce(estado, ''))
  when 'PROGRAMADA' then 'PROGRAMADA'
  when 'APROBADA' then 'PROGRAMADA'
  when 'ASIGNADA' then 'PROGRAMADA'
  when 'REPROGRAMADA' then 'PROGRAMADA'
  when 'PENDIENTE' then 'PENDIENTE'
  when 'BORRADOR' then 'PENDIENTE'
  when 'PENDIENTE_APROBACION' then 'PENDIENTE'
  when 'EN_EJECUCION' then 'EN_EJECUCION'
  when 'VALIDACION' then 'VALIDACION'
  when 'PENDIENTE_VALIDACION' then 'VALIDACION'
  when 'CERRADA' then 'CERRADA'
  when 'CANCELADA' then 'CANCELADA'
  when 'RECHAZADA' then 'CANCELADA'
  else 'PENDIENTE'
end;

alter table public.ordenes_trabajo
  add constraint ordenes_trabajo_estado_check
  check (estado in (
    'PROGRAMADA',
    'PENDIENTE',
    'EN_EJECUCION',
    'VALIDACION',
    'CERRADA',
    'CANCELADA'
  ));

-- =========================================================
-- 2) Fichas: tipo compatible con MVP
-- =========================================================

create table if not exists public.fichas_mantenimiento (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now()
);

alter table public.fichas_mantenimiento
  add column if not exists codigo_ficha text,
  add column if not exists tipo text,
  add column if not exists orden_trabajo_id uuid,
  add column if not exists equipo_id uuid,
  add column if not exists activo_id uuid,
  add column if not exists fecha date,
  add column if not exists especialidad text,
  add column if not exists responsable text,
  add column if not exists descripcion text,
  add column if not exists hora_inicio time,
  add column if not exists hora_fin time,
  add column if not exists horas_hombre numeric,
  add column if not exists estado_final text,
  add column if not exists observaciones text,
  add column if not exists firma_digital text,
  add column if not exists estado text default 'GENERADA';

do $$
declare
  constraint_record record;
begin
  for constraint_record in
    select c.conname
    from pg_constraint c
    join pg_attribute a
      on a.attrelid = c.conrelid
      and a.attnum = any(c.conkey)
    where c.conrelid = 'public.fichas_mantenimiento'::regclass
      and c.contype = 'c'
      and a.attname = 'tipo'
  loop
    execute format(
      'alter table public.fichas_mantenimiento drop constraint if exists %I',
      constraint_record.conname
    );
  end loop;
end $$;

update public.fichas_mantenimiento
set tipo = 'PREVENTIVO'
where tipo is null
   or trim(tipo) = '';

update public.fichas_mantenimiento
set tipo = case
  when upper(tipo) like '%CORRECTIVO%' then 'CORRECTIVO'
  when upper(tipo) like '%PREDICTIVO%' then 'PREDICTIVO'
  when upper(tipo) like '%INSPE%' then 'INSPECCION'
  when upper(tipo) like '%LUBRIC%' then 'LUBRICACION'
  when upper(tipo) like '%CALIBR%' then 'CALIBRACION'
  when upper(tipo) like '%OVERHAUL%' then 'OVERHAUL'
  when upper(tipo) in ('PRELIMINAR', 'FINAL', 'MANTENIMIENTO', 'PREVENTIVO') then upper(tipo)
  else 'PREVENTIVO'
end;

alter table public.fichas_mantenimiento
  alter column tipo set default 'PREVENTIVO';

alter table public.fichas_mantenimiento
  add constraint fichas_mantenimiento_tipo_check
  check (tipo in (
    'PREVENTIVO',
    'CORRECTIVO',
    'PREDICTIVO',
    'INSPECCION',
    'LUBRICACION',
    'CALIBRACION',
    'OVERHAUL',
    'MANTENIMIENTO',
    'PRELIMINAR',
    'FINAL'
  ));

-- =========================================================
-- 3) Tablas auxiliares usadas por ficha/historial
-- =========================================================

create table if not exists public.historial_mantenimiento (
  id uuid primary key default gen_random_uuid(),
  equipo_id uuid,
  activo_id uuid,
  orden_trabajo_id uuid,
  ficha_mantenimiento_id uuid,
  fecha date default current_date,
  tipo_mantenimiento text,
  descripcion text,
  estado text default 'CERRADA',
  created_at timestamptz default now()
);

create table if not exists public.checklist_mantenimiento (
  id uuid primary key default gen_random_uuid(),
  orden_trabajo_id uuid,
  ficha_mantenimiento_id uuid,
  descripcion text,
  resultado text,
  created_at timestamptz default now()
);

create table if not exists public.evidencias_mantenimiento (
  id uuid primary key default gen_random_uuid(),
  orden_trabajo_id uuid,
  ficha_mantenimiento_id uuid,
  tipo text,
  descripcion text,
  archivo_url text,
  created_at timestamptz default now()
);

create table if not exists public.hallazgos_mantenimiento (
  id uuid primary key default gen_random_uuid(),
  orden_trabajo_id uuid,
  ficha_mantenimiento_id uuid,
  descripcion text,
  criticidad text,
  created_at timestamptz default now()
);

create table if not exists public.repuestos_mantenimiento (
  id uuid primary key default gen_random_uuid(),
  orden_trabajo_id uuid,
  ficha_mantenimiento_id uuid,
  descripcion text,
  cantidad numeric,
  costo numeric,
  created_at timestamptz default now()
);

create table if not exists public.mano_obra_mantenimiento (
  id uuid primary key default gen_random_uuid(),
  orden_trabajo_id uuid,
  ficha_mantenimiento_id uuid,
  descripcion text,
  horas numeric,
  costo numeric,
  created_at timestamptz default now()
);

create table if not exists public.herramientas_mantenimiento (
  id uuid primary key default gen_random_uuid(),
  orden_trabajo_id uuid,
  ficha_mantenimiento_id uuid,
  descripcion text,
  created_at timestamptz default now()
);

create table if not exists public.materiales_mantenimiento (
  id uuid primary key default gen_random_uuid(),
  orden_trabajo_id uuid,
  ficha_mantenimiento_id uuid,
  descripcion text,
  cantidad numeric,
  created_at timestamptz default now()
);

notify pgrst, 'reload schema';
