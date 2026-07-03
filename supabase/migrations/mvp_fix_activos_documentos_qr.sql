-- Proyecto WU - MVP fix QR, foto principal y documentos de activos
-- Ejecutar en Supabase SQL Editor después de mvp_fix_ordenes_activo_id.sql.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

alter table public.equipos
  add column if not exists qr_token text,
  add column if not exists qr_data text,
  add column if not exists foto_url text,
  add column if not exists imagen_url text,
  add column if not exists updated_at timestamptz default now();

update public.equipos
set
  qr_token = coalesce(nullif(qr_token, ''), gen_random_uuid()::text),
  qr_data = coalesce(
    nullif(qr_data, ''),
    codigo_activo || '|' || id::text || '|/activos/' || id::text
  )
where qr_token is null
   or qr_token = ''
   or qr_data is null
   or qr_data = '';

create table if not exists public.documentos_activo (
  id uuid primary key default gen_random_uuid(),
  activo_id uuid not null,
  nombre_archivo text not null,
  tipo_archivo text,
  url text,
  storage_path text,
  created_at timestamptz default now(),
  uploaded_by uuid,
  estado text default 'Activo',
  mime_type text,
  observaciones text,
  storage_bucket text,
  updated_at timestamptz default now()
);

alter table public.documentos_activo
  add column if not exists activo_id uuid,
  add column if not exists nombre_archivo text,
  add column if not exists tipo_archivo text,
  add column if not exists url text,
  add column if not exists storage_path text,
  add column if not exists uploaded_by uuid,
  add column if not exists estado text default 'Activo',
  add column if not exists mime_type text,
  add column if not exists observaciones text,
  add column if not exists storage_bucket text,
  add column if not exists updated_at timestamptz default now();

do $$
begin
  if to_regclass('public.equipos') is not null then
    alter table public.documentos_activo
      drop constraint if exists documentos_activo_activo_id_equipos_fkey;

    alter table public.documentos_activo
      add constraint documentos_activo_activo_id_equipos_fkey
      foreign key (activo_id)
      references public.equipos(id)
      on delete cascade
      not valid;
  elsif to_regclass('public.activos') is not null then
    alter table public.documentos_activo
      drop constraint if exists documentos_activo_activo_id_activos_fkey;

    alter table public.documentos_activo
      add constraint documentos_activo_activo_id_activos_fkey
      foreign key (activo_id)
      references public.activos(id)
      on delete cascade
      not valid;
  end if;
end $$;

do $$
begin
  if to_regclass('public.documentos_activos') is not null then
    alter table public.documentos_activos
      add column if not exists activo_id uuid,
      add column if not exists equipo_id uuid,
      add column if not exists nombre text,
      add column if not exists tipo_documento text,
      add column if not exists archivo_url text,
      add column if not exists storage_path text,
      add column if not exists storage_bucket text,
      add column if not exists mime_type text,
      add column if not exists observaciones text,
      add column if not exists created_at timestamptz default now();
  end if;
end $$;

do $$
begin
  if to_regclass('public.documentos_activos') is not null then
    insert into public.documentos_activo (
      activo_id,
      nombre_archivo,
      tipo_archivo,
      url,
      storage_path,
      created_at,
      mime_type,
      observaciones,
      storage_bucket
    )
    select
      coalesce(activo_id, equipo_id),
      coalesce(nullif(nombre, ''), 'Documento activo'),
      coalesce(nullif(tipo_documento, ''), 'OTRO'),
      nullif(archivo_url, ''),
      storage_path,
      coalesce(created_at, now()),
      mime_type,
      observaciones,
      storage_bucket
    from public.documentos_activos
    where coalesce(activo_id, equipo_id) is not null
      and not exists (
        select 1
        from public.documentos_activo destino
        where destino.activo_id = coalesce(documentos_activos.activo_id, documentos_activos.equipo_id)
          and destino.nombre_archivo = coalesce(nullif(documentos_activos.nombre, ''), 'Documento activo')
          and coalesce(destino.storage_path, '') = coalesce(documentos_activos.storage_path, '')
      );
  end if;
end $$;

update public.equipos e
set
  foto_url = coalesce(e.foto_url, fotos.url),
  imagen_url = coalesce(e.imagen_url, fotos.url)
from (
  select distinct on (activo_id)
    activo_id,
    url
  from public.documentos_activo
  where tipo_archivo = 'FOTO'
    and url is not null
    and coalesce(estado, 'Activo') = 'Activo'
  order by activo_id, created_at desc
) fotos
where e.id = fotos.activo_id
  and (e.foto_url is null or e.imagen_url is null);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('activos-fotos', 'activos-fotos', true, 10485760, array['image/jpeg', 'image/png', 'image/webp']),
  ('activos-documentos', 'activos-documentos', true, 20971520, array['application/pdf'])
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

alter table public.documentos_activo enable row level security;

drop policy if exists "documentos_activo_select_mvp" on public.documentos_activo;
drop policy if exists "documentos_activo_insert_mvp" on public.documentos_activo;
drop policy if exists "documentos_activo_update_mvp" on public.documentos_activo;

create policy "documentos_activo_select_mvp"
on public.documentos_activo
for select
to anon, authenticated
using (true);

create policy "documentos_activo_insert_mvp"
on public.documentos_activo
for insert
to anon, authenticated
with check (true);

create policy "documentos_activo_update_mvp"
on public.documentos_activo
for update
to anon, authenticated
using (true)
with check (true);

drop policy if exists "storage_activos_read_mvp" on storage.objects;
drop policy if exists "storage_activos_insert_mvp" on storage.objects;
drop policy if exists "storage_activos_update_mvp" on storage.objects;
drop policy if exists "storage_activos_delete_mvp" on storage.objects;

create policy "storage_activos_read_mvp"
on storage.objects
for select
to anon, authenticated
using (bucket_id in ('activos-fotos', 'activos-documentos'));

create policy "storage_activos_insert_mvp"
on storage.objects
for insert
to anon, authenticated
with check (bucket_id in ('activos-fotos', 'activos-documentos'));

create policy "storage_activos_update_mvp"
on storage.objects
for update
to anon, authenticated
using (bucket_id in ('activos-fotos', 'activos-documentos'))
with check (bucket_id in ('activos-fotos', 'activos-documentos'));

create policy "storage_activos_delete_mvp"
on storage.objects
for delete
to anon, authenticated
using (bucket_id in ('activos-fotos', 'activos-documentos'));

drop trigger if exists documentos_activo_set_updated_at on public.documentos_activo;

create trigger documentos_activo_set_updated_at
before update on public.documentos_activo
for each row
execute function public.set_updated_at();

drop trigger if exists equipos_set_updated_at on public.equipos;

create trigger equipos_set_updated_at
before update on public.equipos
for each row
execute function public.set_updated_at();

create index if not exists idx_documentos_activo_activo_id
  on public.documentos_activo (activo_id);

create index if not exists idx_documentos_activo_estado
  on public.documentos_activo (estado);

notify pgrst, 'reload schema';
