-- Proyecto WU Beta v1.0
-- Ejecutar en Supabase SQL Editor.
-- Objetivo: completar flujo Activo -> PM -> OT -> Técnico -> Supervisor -> Ficha -> Historial.

create extension if not exists pgcrypto;

-- =========================================================
-- 1) Tablas base mínimas / columnas usadas por la app
-- =========================================================

create table if not exists public.empresas (
  id uuid primary key default gen_random_uuid(),
  nombre text,
  codigo text,
  created_at timestamptz default now()
);

create table if not exists public.organizacion_nodos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid,
  nodo_padre_id uuid,
  nombre text,
  codigo text,
  tipo text,
  created_at timestamptz default now()
);

create table if not exists public.familias_activos (
  id uuid primary key default gen_random_uuid(),
  nombre text,
  codigo text,
  estado boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.tipos_equipo (
  id uuid primary key default gen_random_uuid(),
  familia_id uuid,
  nombre text,
  codigo text,
  codigo_corto text,
  estado boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.equipos (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now()
);

alter table public.equipos
  add column if not exists codigo_activo text,
  add column if not exists nombre text,
  add column if not exists descripcion text,
  add column if not exists nodo_organizacion_id uuid,
  add column if not exists familia text,
  add column if not exists tipo_equipo text,
  add column if not exists marca text,
  add column if not exists modelo text,
  add column if not exists serie text,
  add column if not exists fabricante text,
  add column if not exists proveedor text,
  add column if not exists estado_operativo text default 'OPERATIVO',
  add column if not exists criticidad text default 'B',
  add column if not exists responsable text,
  add column if not exists qr_token text default gen_random_uuid()::text,
  add column if not exists ultimo_mantenimiento date,
  add column if not exists fecha_ultimo_mantenimiento date,
  add column if not exists proximo_mantenimiento date,
  add column if not exists fecha_proximo_mantenimiento date;

create table if not exists public.programas_mantenimiento (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now()
);

alter table public.programas_mantenimiento
  add column if not exists equipo_id uuid,
  add column if not exists activo_id uuid,
  add column if not exists tipo_mantenimiento text,
  add column if not exists especialidad text,
  add column if not exists frecuencia text,
  add column if not exists fecha_inicial date,
  add column if not exists fecha_inicio date,
  add column if not exists responsable text,
  add column if not exists duracion_estimada_horas numeric,
  add column if not exists prioridad text default 'MEDIA',
  add column if not exists descripcion text,
  add column if not exists estado text default 'PROGRAMADO';

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
  add column if not exists estado text not null default 'BORRADOR',
  add column if not exists hora_inicio time,
  add column if not exists hora_fin time,
  add column if not exists horas_hombre numeric,
  add column if not exists observaciones text,
  add column if not exists observaciones_ejecucion text,
  add column if not exists estado_final text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'ordenes_trabajo_estado_check'
  ) then
    alter table public.ordenes_trabajo
      add constraint ordenes_trabajo_estado_check
      check (estado in (
        'BORRADOR',
        'PENDIENTE_APROBACION',
        'APROBADA',
        'ASIGNADA',
        'EN_EJECUCION',
        'PENDIENTE_VALIDACION',
        'CERRADA',
        'RECHAZADA',
        'REPROGRAMADA',
        'CANCELADA'
      ));
  end if;
end $$;

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

update public.fichas_mantenimiento
set tipo = 'PREVENTIVO'
where tipo is null;

alter table public.fichas_mantenimiento
  alter column tipo set default 'PREVENTIVO';

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

create table if not exists public.documentos_activos (
  id uuid primary key default gen_random_uuid(),
  equipo_id uuid,
  activo_id uuid,
  tipo_documento text not null,
  nombre text not null,
  archivo_url text,
  storage_bucket text,
  storage_path text,
  mime_type text,
  observaciones text,
  created_at timestamptz default now()
);

-- =========================================================
-- 2) Storage para PDFs y fotos del expediente
-- =========================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('activos-documentos', 'activos-documentos', true, 15728640, array['application/pdf']::text[]),
  ('activos-fotos', 'activos-fotos', true, 10485760, array['image/png','image/jpeg','image/webp']::text[])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- =========================================================
-- 3) RLS beta demo: anon/authenticated pueden leer y operar.
--    Ajustar antes de producción.
-- =========================================================

do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'empresas',
    'organizacion_nodos',
    'familias_activos',
    'tipos_equipo',
    'equipos',
    'programas_mantenimiento',
    'ordenes_trabajo',
    'fichas_mantenimiento',
    'checklist_mantenimiento',
    'evidencias_mantenimiento',
    'hallazgos_mantenimiento',
    'repuestos_mantenimiento',
    'mano_obra_mantenimiento',
    'herramientas_mantenimiento',
    'materiales_mantenimiento',
    'historial_mantenimiento',
    'documentos_activos'
  ]
  loop
    if to_regclass('public.' || tbl) is not null then
      execute format('alter table public.%I enable row level security', tbl);

      if not exists (
        select 1 from pg_policies
        where schemaname = 'public' and tablename = tbl and policyname = 'beta_demo_select'
      ) then
        execute format(
          'create policy beta_demo_select on public.%I for select to anon, authenticated using (true)',
          tbl
        );
      end if;

      if not exists (
        select 1 from pg_policies
        where schemaname = 'public' and tablename = tbl and policyname = 'beta_demo_insert'
      ) then
        execute format(
          'create policy beta_demo_insert on public.%I for insert to anon, authenticated with check (true)',
          tbl
        );
      end if;

      if not exists (
        select 1 from pg_policies
        where schemaname = 'public' and tablename = tbl and policyname = 'beta_demo_update'
      ) then
        execute format(
          'create policy beta_demo_update on public.%I for update to anon, authenticated using (true) with check (true)',
          tbl
        );
      end if;
    end if;
  end loop;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'beta_demo_storage_select_activos'
  ) then
    create policy beta_demo_storage_select_activos
      on storage.objects for select to anon, authenticated
      using (bucket_id in ('activos-documentos', 'activos-fotos'));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'beta_demo_storage_insert_activos'
  ) then
    create policy beta_demo_storage_insert_activos
      on storage.objects for insert to anon, authenticated
      with check (bucket_id in ('activos-documentos', 'activos-fotos'));
  end if;
end $$;

-- =========================================================
-- 4) Data demo para recorrer el sistema integral
-- =========================================================

insert into public.empresas (id, nombre, codigo)
values
  ('00000000-0000-4000-8000-000000000001', 'Inversiones Pesqueras Liguria S.A.C.', 'LIG')
on conflict (id) do update set
  nombre = excluded.nombre,
  codigo = excluded.codigo;

insert into public.organizacion_nodos (id, empresa_id, nodo_padre_id, nombre, codigo, tipo)
values
  ('00000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000001', null, 'Sede Callao', 'SC', 'SEDE'),
  ('00000000-0000-4000-8000-000000000102', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000101', 'Planta Congelados', 'PC', 'PLANTA'),
  ('00000000-0000-4000-8000-000000000103', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000102', 'Casa de Máquinas', 'CM', 'AREA'),
  ('00000000-0000-4000-8000-000000000104', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000103', 'Sistema de Compresión', 'SCM', 'SISTEMA'),
  ('00000000-0000-4000-8000-000000000105', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000104', 'Compresores Generales', 'CG-CM', 'UBICACION')
on conflict (id) do update set
  empresa_id = excluded.empresa_id,
  nodo_padre_id = excluded.nodo_padre_id,
  nombre = excluded.nombre,
  codigo = excluded.codigo,
  tipo = excluded.tipo;

insert into public.familias_activos (id, nombre, codigo, estado)
values
  ('00000000-0000-4000-8000-000000000201', 'Equipos rotativos', 'ROT', true),
  ('00000000-0000-4000-8000-000000000202', 'Sistemas eléctricos', 'ELE', true),
  ('00000000-0000-4000-8000-000000000203', 'Refrigeración industrial', 'REF', true)
on conflict (id) do update set
  nombre = excluded.nombre,
  codigo = excluded.codigo,
  estado = excluded.estado;

insert into public.tipos_equipo (id, familia_id, nombre, codigo, codigo_corto, estado)
values
  ('00000000-0000-4000-8000-000000000301', '00000000-0000-4000-8000-000000000203', 'Compresor de amoníaco', 'COMPRESOR_AMONIACO', 'CMP', true),
  ('00000000-0000-4000-8000-000000000302', '00000000-0000-4000-8000-000000000201', 'Bomba centrífuga', 'BOMBA_CENTRIFUGA', 'BBA', true),
  ('00000000-0000-4000-8000-000000000303', '00000000-0000-4000-8000-000000000202', 'Tablero eléctrico', 'TABLERO_ELECTRICO', 'TBE', true)
on conflict (id) do update set
  familia_id = excluded.familia_id,
  nombre = excluded.nombre,
  codigo = excluded.codigo,
  codigo_corto = excluded.codigo_corto,
  estado = excluded.estado;

insert into public.equipos (
  id,
  codigo_activo,
  nombre,
  descripcion,
  nodo_organizacion_id,
  familia,
  tipo_equipo,
  marca,
  modelo,
  serie,
  fabricante,
  proveedor,
  estado_operativo,
  criticidad,
  responsable,
  qr_token,
  ultimo_mantenimiento,
  proximo_mantenimiento
)
values
  (
    '00000000-0000-4000-8000-000000000401',
    'LIG-CG-CM-CMP-001',
    'Compresor principal de amoníaco',
    'Compresor principal para sistema de frío de planta congelados.',
    '00000000-0000-4000-8000-000000000105',
    'Refrigeración industrial',
    'Compresor de amoníaco',
    'MYCOM',
    'N8WB',
    'MYC-2024-001',
    'Mayekawa',
    'Proveedor Industrial Perú',
    'OPERATIVO',
    'A',
    'Supervisor de Mantenimiento',
    'QR-LIG-CMP-001',
    current_date - 35,
    current_date + 25
  ),
  (
    '00000000-0000-4000-8000-000000000402',
    'LIG-CG-CM-BBA-001',
    'Bomba de recirculación de agua',
    'Bomba centrífuga para servicios auxiliares.',
    '00000000-0000-4000-8000-000000000105',
    'Equipos rotativos',
    'Bomba centrífuga',
    'KSB',
    'Etanorm',
    'KSB-7781',
    'KSB',
    'Servicios Industriales SAC',
    'OPERATIVO',
    'B',
    'Supervisor de Mantenimiento',
    'QR-LIG-BBA-001',
    current_date - 15,
    current_date + 45
  )
on conflict (id) do update set
  codigo_activo = excluded.codigo_activo,
  nombre = excluded.nombre,
  descripcion = excluded.descripcion,
  nodo_organizacion_id = excluded.nodo_organizacion_id,
  familia = excluded.familia,
  tipo_equipo = excluded.tipo_equipo,
  marca = excluded.marca,
  modelo = excluded.modelo,
  serie = excluded.serie,
  fabricante = excluded.fabricante,
  proveedor = excluded.proveedor,
  estado_operativo = excluded.estado_operativo,
  criticidad = excluded.criticidad,
  responsable = excluded.responsable,
  qr_token = excluded.qr_token,
  ultimo_mantenimiento = excluded.ultimo_mantenimiento,
  proximo_mantenimiento = excluded.proximo_mantenimiento;

insert into public.programas_mantenimiento (
  id,
  equipo_id,
  activo_id,
  tipo_mantenimiento,
  especialidad,
  frecuencia,
  fecha_inicial,
  fecha_inicio,
  responsable,
  duracion_estimada_horas,
  prioridad,
  descripcion,
  estado
)
values
  (
    '00000000-0000-4000-8000-000000000501',
    '00000000-0000-4000-8000-000000000401',
    '00000000-0000-4000-8000-000000000401',
    'PREVENTIVO',
    'MECANICA',
    'MENSUAL',
    current_date,
    current_date,
    'Supervisor de Mantenimiento',
    3,
    'ALTA',
    'Inspección, limpieza y verificación de parámetros mecánicos del compresor.',
    'PROGRAMADO'
  )
on conflict (id) do update set
  equipo_id = excluded.equipo_id,
  activo_id = excluded.activo_id,
  tipo_mantenimiento = excluded.tipo_mantenimiento,
  especialidad = excluded.especialidad,
  frecuencia = excluded.frecuencia,
  fecha_inicial = excluded.fecha_inicial,
  fecha_inicio = excluded.fecha_inicio,
  responsable = excluded.responsable,
  duracion_estimada_horas = excluded.duracion_estimada_horas,
  prioridad = excluded.prioridad,
  descripcion = excluded.descripcion,
  estado = excluded.estado;

insert into public.ordenes_trabajo (
  id,
  codigo_ot,
  equipo_id,
  activo_id,
  tipo_mantenimiento,
  especialidad,
  responsable,
  tecnico_asignado,
  fecha_programada,
  duracion_estimada_horas,
  descripcion,
  prioridad,
  estado,
  hora_inicio,
  hora_fin,
  horas_hombre,
  observaciones,
  observaciones_ejecucion,
  estado_final
)
values
  (
    '00000000-0000-4000-8000-000000000601',
    'OT-2026-0001',
    '00000000-0000-4000-8000-000000000401',
    '00000000-0000-4000-8000-000000000401',
    'PREVENTIVO',
    'MECANICA',
    'Supervisor de Mantenimiento',
    null,
    current_date + 1,
    3,
    'Mantenimiento preventivo mensual del compresor principal.',
    'ALTA',
    'PENDIENTE_APROBACION',
    null,
    null,
    null,
    null,
    null,
    null
  ),
  (
    '00000000-0000-4000-8000-000000000602',
    'OT-2026-0002',
    '00000000-0000-4000-8000-000000000401',
    '00000000-0000-4000-8000-000000000401',
    'INSPECCION',
    'MECANICA',
    'Supervisor de Mantenimiento',
    'Técnico de Planta',
    current_date,
    2,
    'Inspección por ruido anormal en acople.',
    'MEDIA',
    'ASIGNADA',
    null,
    null,
    null,
    null,
    null,
    null
  ),
  (
    '00000000-0000-4000-8000-000000000603',
    'OT-2026-0003',
    '00000000-0000-4000-8000-000000000402',
    '00000000-0000-4000-8000-000000000402',
    'CORRECTIVO PROGRAMADO',
    'MECANICA',
    'Supervisor de Mantenimiento',
    'Técnico de Planta',
    current_date,
    2,
    'Cambio de sello mecánico en bomba de recirculación.',
    'ALTA',
    'PENDIENTE_VALIDACION',
    '08:00',
    '10:15',
    2.25,
    'Se ejecutó cambio de sello y prueba operacional sin fugas.',
    'Se ejecutó cambio de sello y prueba operacional sin fugas.',
    'Equipo operativo y sin fugas visibles.'
  ),
  (
    '00000000-0000-4000-8000-000000000604',
    'OT-2026-0004',
    '00000000-0000-4000-8000-000000000401',
    '00000000-0000-4000-8000-000000000401',
    'PREVENTIVO',
    'MECANICA',
    'Supervisor de Mantenimiento',
    'Técnico de Planta',
    current_date - 20,
    3,
    'Mantenimiento preventivo ejecutado del compresor.',
    'MEDIA',
    'CERRADA',
    '09:00',
    '12:00',
    3,
    'Equipo queda operativo. Se recomienda revisar nuevamente en 30 días.',
    'Equipo queda operativo. Se recomienda revisar nuevamente en 30 días.',
    'Equipo operativo.'
  )
on conflict (id) do update set
  codigo_ot = excluded.codigo_ot,
  equipo_id = excluded.equipo_id,
  activo_id = excluded.activo_id,
  tipo_mantenimiento = excluded.tipo_mantenimiento,
  especialidad = excluded.especialidad,
  responsable = excluded.responsable,
  tecnico_asignado = excluded.tecnico_asignado,
  fecha_programada = excluded.fecha_programada,
  duracion_estimada_horas = excluded.duracion_estimada_horas,
  descripcion = excluded.descripcion,
  prioridad = excluded.prioridad,
  estado = excluded.estado,
  hora_inicio = excluded.hora_inicio,
  hora_fin = excluded.hora_fin,
  horas_hombre = excluded.horas_hombre,
  observaciones = excluded.observaciones,
  observaciones_ejecucion = excluded.observaciones_ejecucion,
  estado_final = excluded.estado_final;

insert into public.checklist_mantenimiento (id, orden_trabajo_id, descripcion, resultado)
values
  ('00000000-0000-4000-8000-000000000701', '00000000-0000-4000-8000-000000000603', 'Verificación de fugas en sello mecánico.', 'OK'),
  ('00000000-0000-4000-8000-000000000702', '00000000-0000-4000-8000-000000000604', 'Inspección visual de acople, fajas y guarda.', 'OK')
on conflict (id) do update set
  orden_trabajo_id = excluded.orden_trabajo_id,
  descripcion = excluded.descripcion,
  resultado = excluded.resultado;

insert into public.hallazgos_mantenimiento (id, orden_trabajo_id, descripcion, criticidad)
values
  ('00000000-0000-4000-8000-000000000711', '00000000-0000-4000-8000-000000000603', 'Sello mecánico con desgaste visible.', 'MEDIA'),
  ('00000000-0000-4000-8000-000000000712', '00000000-0000-4000-8000-000000000604', 'Sin hallazgos críticos.', 'BAJA')
on conflict (id) do update set
  orden_trabajo_id = excluded.orden_trabajo_id,
  descripcion = excluded.descripcion,
  criticidad = excluded.criticidad;

insert into public.repuestos_mantenimiento (id, orden_trabajo_id, descripcion, cantidad, costo)
values
  ('00000000-0000-4000-8000-000000000721', '00000000-0000-4000-8000-000000000603', 'Sello mecánico 1 1/2"', 1, 280),
  ('00000000-0000-4000-8000-000000000722', '00000000-0000-4000-8000-000000000604', 'Grasa grado alimentario', 1, 35)
on conflict (id) do update set
  orden_trabajo_id = excluded.orden_trabajo_id,
  descripcion = excluded.descripcion,
  cantidad = excluded.cantidad,
  costo = excluded.costo;

insert into public.mano_obra_mantenimiento (id, orden_trabajo_id, descripcion, horas, costo)
values
  ('00000000-0000-4000-8000-000000000731', '00000000-0000-4000-8000-000000000603', 'Técnico de Planta', 2.25, 90),
  ('00000000-0000-4000-8000-000000000732', '00000000-0000-4000-8000-000000000604', 'Técnico de Planta', 3, 120)
on conflict (id) do update set
  orden_trabajo_id = excluded.orden_trabajo_id,
  descripcion = excluded.descripcion,
  horas = excluded.horas,
  costo = excluded.costo;

insert into public.evidencias_mantenimiento (id, orden_trabajo_id, tipo, descripcion)
values
  ('00000000-0000-4000-8000-000000000741', '00000000-0000-4000-8000-000000000603', 'FOTO_ANTES', 'Pendiente de adjuntar imagen antes del cambio.'),
  ('00000000-0000-4000-8000-000000000742', '00000000-0000-4000-8000-000000000603', 'FOTO_DESPUES', 'Pendiente de adjuntar imagen final del equipo.'),
  ('00000000-0000-4000-8000-000000000743', '00000000-0000-4000-8000-000000000604', 'FOTOGRAFIA', 'Evidencia cargada en campo.')
on conflict (id) do update set
  orden_trabajo_id = excluded.orden_trabajo_id,
  tipo = excluded.tipo,
  descripcion = excluded.descripcion;

insert into public.fichas_mantenimiento (
  id,
  codigo_ficha,
  tipo,
  orden_trabajo_id,
  equipo_id,
  activo_id,
  fecha,
  especialidad,
  responsable,
  descripcion,
  hora_inicio,
  hora_fin,
  horas_hombre,
  estado_final,
  observaciones,
  firma_digital,
  estado
)
values
  (
    '00000000-0000-4000-8000-000000000801',
    'FM-2026-000001',
    'PREVENTIVO',
    '00000000-0000-4000-8000-000000000604',
    '00000000-0000-4000-8000-000000000401',
    '00000000-0000-4000-8000-000000000401',
    current_date - 20,
    'MECANICA',
    'Técnico de Planta',
    'Mantenimiento preventivo ejecutado del compresor.',
    '09:00',
    '12:00',
    3,
    'Equipo operativo.',
    'Equipo queda operativo. Se recomienda revisar nuevamente en 30 días.',
    'Firma digital demo',
    'GENERADA'
  )
on conflict (id) do update set
  codigo_ficha = excluded.codigo_ficha,
  tipo = excluded.tipo,
  orden_trabajo_id = excluded.orden_trabajo_id,
  equipo_id = excluded.equipo_id,
  activo_id = excluded.activo_id,
  fecha = excluded.fecha,
  especialidad = excluded.especialidad,
  responsable = excluded.responsable,
  descripcion = excluded.descripcion,
  hora_inicio = excluded.hora_inicio,
  hora_fin = excluded.hora_fin,
  horas_hombre = excluded.horas_hombre,
  estado_final = excluded.estado_final,
  observaciones = excluded.observaciones,
  firma_digital = excluded.firma_digital,
  estado = excluded.estado;

insert into public.historial_mantenimiento (
  id,
  equipo_id,
  activo_id,
  orden_trabajo_id,
  ficha_mantenimiento_id,
  fecha,
  tipo_mantenimiento,
  descripcion,
  estado
)
values
  (
    '00000000-0000-4000-8000-000000000901',
    '00000000-0000-4000-8000-000000000401',
    '00000000-0000-4000-8000-000000000401',
    '00000000-0000-4000-8000-000000000604',
    '00000000-0000-4000-8000-000000000801',
    current_date - 20,
    'PREVENTIVO',
    'Mantenimiento preventivo cerrado y validado por supervisor.',
    'CERRADA'
  )
on conflict (id) do update set
  equipo_id = excluded.equipo_id,
  activo_id = excluded.activo_id,
  orden_trabajo_id = excluded.orden_trabajo_id,
  ficha_mantenimiento_id = excluded.ficha_mantenimiento_id,
  fecha = excluded.fecha,
  tipo_mantenimiento = excluded.tipo_mantenimiento,
  descripcion = excluded.descripcion,
  estado = excluded.estado;

-- =========================================================
-- 5) Refrescar schema cache de PostgREST
-- =========================================================

notify pgrst, 'reload schema';
