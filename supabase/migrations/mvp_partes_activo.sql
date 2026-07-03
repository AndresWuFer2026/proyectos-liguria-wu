-- Proyecto WU Beta v1.0 - MVP partes/componentes del activo
-- Ejecutar en Supabase SQL Editor despues de mvp_estabilizacion.sql.
-- Nota: el proyecto actual usa public.equipos como tabla de activos.
-- La FK se crea contra public.activos si existe; si no, contra public.equipos.

create extension if not exists pgcrypto;

create table if not exists public.partes_activo (
  id uuid primary key default gen_random_uuid(),
  activo_id uuid not null,
  nombre text not null,
  tipo_parte text,
  descripcion text,
  criticidad text,
  frecuencia_revision_sugerida text,
  estado text default 'Activo',
  observaciones text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.partes_activo
  add column if not exists activo_id uuid,
  add column if not exists nombre text,
  add column if not exists tipo_parte text,
  add column if not exists descripcion text,
  add column if not exists criticidad text,
  add column if not exists frecuencia_revision_sugerida text,
  add column if not exists estado text default 'Activo',
  add column if not exists observaciones text,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

update public.partes_activo
set estado = 'Activo'
where estado is null
   or trim(estado) = '';

update public.partes_activo
set nombre = 'Parte sin nombre'
where nombre is null
   or trim(nombre) = '';

update public.partes_activo
set criticidad = null
where criticidad is not null
  and criticidad not in ('Alta', 'Media', 'Baja');

alter table public.partes_activo
  alter column nombre set not null,
  alter column estado set default 'Activo',
  alter column created_at set default now(),
  alter column updated_at set default now();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.partes_activo'::regclass
      and conname = 'partes_activo_criticidad_check'
  ) then
    alter table public.partes_activo
      add constraint partes_activo_criticidad_check
      check (criticidad is null or criticidad in ('Alta', 'Media', 'Baja'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.partes_activo'::regclass
      and conname = 'partes_activo_activo_id_fkey'
  ) then
    if to_regclass('public.activos') is not null then
      alter table public.partes_activo
        add constraint partes_activo_activo_id_fkey
        foreign key (activo_id) references public.activos(id) on delete cascade;
    elsif to_regclass('public.equipos') is not null then
      alter table public.partes_activo
        add constraint partes_activo_activo_id_fkey
        foreign key (activo_id) references public.equipos(id) on delete cascade;
    end if;
  end if;
end $$;

create index if not exists partes_activo_activo_id_idx
  on public.partes_activo (activo_id);

create index if not exists partes_activo_estado_idx
  on public.partes_activo (estado);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_partes_activo_updated_at on public.partes_activo;

create trigger set_partes_activo_updated_at
before update on public.partes_activo
for each row
execute function public.set_updated_at();

alter table public.partes_activo enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'partes_activo'
      and policyname = 'partes_activo_select_demo'
  ) then
    create policy partes_activo_select_demo
      on public.partes_activo
      for select
      to anon, authenticated
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'partes_activo'
      and policyname = 'partes_activo_insert_demo'
  ) then
    create policy partes_activo_insert_demo
      on public.partes_activo
      for insert
      to anon, authenticated
      with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'partes_activo'
      and policyname = 'partes_activo_update_demo'
  ) then
    create policy partes_activo_update_demo
      on public.partes_activo
      for update
      to anon, authenticated
      using (true)
      with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'partes_activo'
      and policyname = 'partes_activo_delete_demo'
  ) then
    create policy partes_activo_delete_demo
      on public.partes_activo
      for delete
      to anon, authenticated
      using (true);
  end if;
end $$;

notify pgrst, 'reload schema';
