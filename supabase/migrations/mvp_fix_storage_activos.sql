-- Proyecto WU - MVP Storage único para activos
-- Bucket requerido: activos
-- Rutas:
-- - imagenes-activos/{activoId}/{timestamp-nombreArchivo}
-- - documentos-activos/{activoId}/{timestamp-nombreArchivo}

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

do $$
begin
  if to_regclass('public.activos') is not null then
    alter table public.activos
      add column if not exists imagen_url text,
      add column if not exists updated_at timestamptz default now();
  end if;

  if to_regclass('public.equipos') is not null then
    alter table public.equipos
      add column if not exists imagen_url text,
      add column if not exists foto_url text,
      add column if not exists updated_at timestamptz default now();
  end if;
end $$;

create table if not exists public.documentos_activo (
  id uuid primary key default gen_random_uuid(),
  activo_id uuid not null,
  nombre_archivo text not null,
  tipo_archivo text,
  url text,
  storage_path text,
  uploaded_by uuid,
  created_at timestamptz default now(),
  estado text default 'Activo'
);

alter table public.documentos_activo
  add column if not exists activo_id uuid,
  add column if not exists nombre_archivo text,
  add column if not exists tipo_archivo text,
  add column if not exists url text,
  add column if not exists storage_path text,
  add column if not exists uploaded_by uuid,
  add column if not exists created_at timestamptz default now(),
  add column if not exists estado text default 'Activo',
  add column if not exists mime_type text,
  add column if not exists observaciones text,
  add column if not exists storage_bucket text default 'activos',
  add column if not exists updated_at timestamptz default now();

update public.documentos_activo
set storage_bucket = 'activos'
where storage_bucket is null or storage_bucket = '';

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

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'activos',
  'activos',
  true,
  31457280,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf'
  ]
)
on conflict (id) do update
set
  public = true,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

alter table public.documentos_activo enable row level security;

drop policy if exists "documentos_activo_read_mvp" on public.documentos_activo;
drop policy if exists "documentos_activo_insert_mvp" on public.documentos_activo;
drop policy if exists "documentos_activo_update_mvp" on public.documentos_activo;
drop policy if exists "documentos_activo_delete_mvp" on public.documentos_activo;

create policy "documentos_activo_read_mvp"
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

create policy "documentos_activo_delete_mvp"
on public.documentos_activo
for delete
to anon, authenticated
using (true);

drop policy if exists "storage_activos_read_mvp" on storage.objects;
drop policy if exists "storage_activos_insert_mvp" on storage.objects;
drop policy if exists "storage_activos_update_mvp" on storage.objects;
drop policy if exists "storage_activos_delete_mvp" on storage.objects;

create policy "storage_activos_read_mvp"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'activos');

create policy "storage_activos_insert_mvp"
on storage.objects
for insert
to anon, authenticated
with check (bucket_id = 'activos');

create policy "storage_activos_update_mvp"
on storage.objects
for update
to anon, authenticated
using (bucket_id = 'activos')
with check (bucket_id = 'activos');

create policy "storage_activos_delete_mvp"
on storage.objects
for delete
to anon, authenticated
using (bucket_id = 'activos');

drop trigger if exists documentos_activo_set_updated_at on public.documentos_activo;

create trigger documentos_activo_set_updated_at
before update on public.documentos_activo
for each row
execute function public.set_updated_at();

do $$
begin
  if to_regclass('public.equipos') is not null then
    drop trigger if exists equipos_set_updated_at on public.equipos;

    create trigger equipos_set_updated_at
    before update on public.equipos
    for each row
    execute function public.set_updated_at();
  end if;
end $$;

create index if not exists idx_documentos_activo_activo_id
  on public.documentos_activo (activo_id);

create index if not exists idx_documentos_activo_estado
  on public.documentos_activo (estado);

notify pgrst, 'reload schema';
