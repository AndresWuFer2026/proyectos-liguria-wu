-- Proyecto WU - Seed demo compatible con Supabase SQL Editor
-- Uso:
-- 1) Pega y ejecuta este archivo completo.
-- 2) Si falla, ejecuta por secciones: 1, 2, 3, etc.
--
-- Esta versión evita:
-- - ON CONFLICT
-- - UUIDs fijos en INSERT
-- - inserts directos a storage
-- - deletes de datos existentes
--
-- Carga data ficticia para dashboard, OT, históricos y fichas.

create extension if not exists pgcrypto;

-- =========================================================
-- 1) Estructura mínima compatible
-- =========================================================

create table if not exists public.empresas (
  id uuid primary key default gen_random_uuid(),
  nombre text,
  codigo text,
  created_at timestamptz default now()
);

alter table public.empresas
  add column if not exists nombre text,
  add column if not exists codigo text;

create table if not exists public.organizacion_nodos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid,
  nodo_padre_id uuid,
  nombre text,
  codigo text,
  tipo text,
  created_at timestamptz default now()
);

alter table public.organizacion_nodos
  add column if not exists empresa_id uuid,
  add column if not exists nodo_padre_id uuid,
  add column if not exists nombre text,
  add column if not exists codigo text,
  add column if not exists tipo text;

create table if not exists public.familias_activos (
  id uuid primary key default gen_random_uuid(),
  nombre text,
  codigo text,
  estado boolean default true,
  created_at timestamptz default now()
);

alter table public.familias_activos
  add column if not exists nombre text,
  add column if not exists codigo text,
  add column if not exists estado boolean default true;

create table if not exists public.tipos_equipo (
  id uuid primary key default gen_random_uuid(),
  familia_id uuid,
  nombre text,
  codigo text,
  codigo_corto text,
  estado boolean default true,
  created_at timestamptz default now()
);

alter table public.tipos_equipo
  add column if not exists familia_id uuid,
  add column if not exists nombre text,
  add column if not exists codigo text,
  add column if not exists codigo_corto text,
  add column if not exists estado boolean default true;

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
  add column if not exists qr_token text,
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
  add column if not exists estado text default 'BORRADOR',
  add column if not exists hora_inicio time,
  add column if not exists hora_fin time,
  add column if not exists horas_hombre numeric,
  add column if not exists observaciones text,
  add column if not exists observaciones_ejecucion text,
  add column if not exists estado_final text;

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
  tipo_documento text,
  nombre text,
  archivo_url text,
  storage_bucket text,
  storage_path text,
  mime_type text,
  observaciones text,
  created_at timestamptz default now()
);

-- =========================================================
-- 2) Empresa, organización y catálogos
-- =========================================================

insert into public.empresas (nombre, codigo)
select 'Inversiones Pesqueras Liguria S.A.C.', 'LIG'
where not exists (
  select 1 from public.empresas where codigo = 'LIG'
);

with empresa as (
  select id from public.empresas where codigo = 'LIG' limit 1
),
seed(nombre, codigo, tipo, padre_codigo) as (
  values
    ('Sede Callao', 'SC', 'SEDE', null),
    ('Planta Congelados', 'PC', 'PLANTA', 'SC'),
    ('Casa de Máquinas', 'CM', 'AREA', 'PC'),
    ('Sistema de Refrigeración', 'REF', 'SISTEMA', 'CM'),
    ('Compresores NH3', 'CG-CM', 'UBICACION', 'REF'),
    ('Planta Harina', 'PH', 'PLANTA', 'SC'),
    ('Área Calderos', 'CAL', 'AREA', 'PH'),
    ('Sala de Calderos', 'SCAL', 'UBICACION', 'CAL'),
    ('Empaque', 'EMP', 'AREA', 'PC'),
    ('Línea de Empaque 1', 'EMP-01', 'UBICACION', 'EMP')
)
insert into public.organizacion_nodos (
  empresa_id,
  nodo_padre_id,
  nombre,
  codigo,
  tipo
)
select
  empresa.id,
  padre.id,
  seed.nombre,
  seed.codigo,
  seed.tipo
from seed
cross join empresa
left join public.organizacion_nodos padre
  on padre.codigo = seed.padre_codigo
where not exists (
  select 1 from public.organizacion_nodos actual
  where actual.codigo = seed.codigo
);

insert into public.familias_activos (nombre, codigo, estado)
select seed.nombre, seed.codigo, true
from (
  values
    ('Refrigeración industrial', 'REF'),
    ('Equipos rotativos', 'ROT'),
    ('Generación de vapor', 'VAP'),
    ('Sistemas eléctricos', 'ELE'),
    ('Empaque y proceso', 'EMP')
) as seed(nombre, codigo)
where not exists (
  select 1 from public.familias_activos actual
  where actual.codigo = seed.codigo
);

insert into public.tipos_equipo (
  familia_id,
  nombre,
  codigo,
  codigo_corto,
  estado
)
select
  familia.id,
  seed.nombre,
  seed.codigo,
  seed.codigo_corto,
  true
from (
  values
    ('REF', 'Compresor de amoníaco', 'COMPRESOR_AMONIACO', 'CMP'),
    ('ROT', 'Bomba centrífuga', 'BOMBA_CENTRIFUGA', 'BBA'),
    ('VAP', 'Caldera pirotubular', 'CALDERA_PIROTUBULAR', 'CAL'),
    ('ELE', 'Tablero eléctrico', 'TABLERO_ELECTRICO', 'TBE'),
    ('EMP', 'Faja transportadora', 'FAJA_TRANSPORTADORA', 'FJA'),
    ('REF', 'Condensador evaporativo', 'CONDENSADOR_EVAPORATIVO', 'CND'),
    ('ROT', 'Motor eléctrico', 'MOTOR_ELECTRICO', 'MTR'),
    ('EMP', 'Detector de metales', 'DETECTOR_METALES', 'DMT')
) as seed(familia_codigo, nombre, codigo, codigo_corto)
join public.familias_activos familia
  on familia.codigo = seed.familia_codigo
where not exists (
  select 1 from public.tipos_equipo actual
  where actual.codigo = seed.codigo
);

-- =========================================================
-- 3) Activos para dashboard y expedientes
-- =========================================================

insert into public.equipos (
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
  fecha_ultimo_mantenimiento,
  proximo_mantenimiento,
  fecha_proximo_mantenimiento
)
select
  seed.codigo_activo,
  seed.nombre,
  seed.descripcion,
  nodo.id,
  seed.familia,
  seed.tipo_equipo,
  seed.marca,
  seed.modelo,
  seed.serie,
  seed.fabricante,
  seed.proveedor,
  seed.estado_operativo,
  seed.criticidad,
  seed.responsable,
  seed.qr_token,
  seed.ultimo_mantenimiento,
  seed.ultimo_mantenimiento,
  seed.proximo_mantenimiento,
  seed.proximo_mantenimiento
from (
  values
    ('LIG-CG-CM-CMP-001', 'Compresor NH3 Principal 01', 'Compresor principal para túneles de congelamiento.', 'CG-CM', 'Refrigeración industrial', 'Compresor de amoníaco', 'MYCOM', 'N8WB', 'MYC-24001', 'Mayekawa', 'Frío Industrial Perú', 'OPERATIVO', 'A', 'Carlos Supervisor', 'QR-LIG-CMP-001', current_date - 18, current_date + 12),
    ('LIG-CG-CM-CMP-002', 'Compresor NH3 Reserva 02', 'Compresor de respaldo para sala de máquinas.', 'CG-CM', 'Refrigeración industrial', 'Compresor de amoníaco', 'Sabroe', 'SAB-128', 'SAB-9088', 'Johnson Controls', 'Refripartes SAC', 'OPERATIVO', 'A', 'Carlos Supervisor', 'QR-LIG-CMP-002', current_date - 45, current_date + 5),
    ('LIG-CG-CM-BBA-001', 'Bomba recirculación agua fría', 'Bomba centrífuga para recirculación de agua de proceso.', 'CG-CM', 'Equipos rotativos', 'Bomba centrífuga', 'KSB', 'Etanorm 80-200', 'KSB-7731', 'KSB', 'Servicios Industriales SAC', 'OPERATIVO', 'B', 'Carlos Supervisor', 'QR-LIG-BBA-001', current_date - 7, current_date + 53),
    ('LIG-SCAL-CAL-001', 'Caldera pirotubular 01', 'Caldera para generación de vapor de proceso.', 'SCAL', 'Generación de vapor', 'Caldera pirotubular', 'Cleaver Brooks', 'CB-600', 'CB-600-1122', 'Cleaver Brooks', 'Thermo Perú', 'OPERATIVO', 'A', 'Luis Jefe de Planta', 'QR-LIG-CAL-001', current_date - 12, current_date + 18),
    ('LIG-EMP-TBE-001', 'Tablero línea empaque 01', 'Tablero principal de control para línea de empaque.', 'EMP-01', 'Sistemas eléctricos', 'Tablero eléctrico', 'Schneider', 'Prisma P', 'TBE-4451', 'Schneider Electric', 'Electrocontrol SAC', 'OPERATIVO', 'B', 'María Electricista', 'QR-LIG-TBE-001', current_date - 25, current_date + 35),
    ('LIG-EMP-FJA-001', 'Faja transportadora empaque', 'Faja transportadora de producto terminado.', 'EMP-01', 'Empaque y proceso', 'Faja transportadora', 'Dorner', '2200 Series', 'FJA-9920', 'Dorner', 'TecnoBandas Perú', 'MANTENIMIENTO', 'B', 'José Técnico', 'QR-LIG-FJA-001', current_date - 60, current_date + 2),
    ('LIG-CG-CM-CND-001', 'Condensador evaporativo 01', 'Condensador evaporativo de sistema NH3.', 'CG-CM', 'Refrigeración industrial', 'Condensador evaporativo', 'BAC', 'VXC', 'BAC-6310', 'Baltimore Aircoil', 'Frío Industrial Perú', 'FUERA_SERVICIO', 'A', 'Carlos Supervisor', 'QR-LIG-CND-001', current_date - 90, current_date - 15),
    ('LIG-EMP-DMT-001', 'Detector de metales', 'Detector de metales para empaque final.', 'EMP-01', 'Empaque y proceso', 'Detector de metales', 'Mettler Toledo', 'Safeline', 'DMT-5521', 'Mettler Toledo', 'Control Calidad SAC', 'OPERATIVO', 'C', 'Calidad Planta', 'QR-LIG-DMT-001', current_date - 3, current_date + 87)
) as seed(
  codigo_activo,
  nombre,
  descripcion,
  nodo_codigo,
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
left join public.organizacion_nodos nodo
  on nodo.codigo = seed.nodo_codigo
where not exists (
  select 1 from public.equipos actual
  where actual.codigo_activo = seed.codigo_activo
);

-- =========================================================
-- 4) Programa PM
-- =========================================================

insert into public.programas_mantenimiento (
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
select
  equipo.id,
  equipo.id,
  seed.tipo_mantenimiento,
  seed.especialidad,
  seed.frecuencia,
  seed.fecha_inicio,
  seed.fecha_inicio,
  seed.responsable,
  seed.duracion,
  seed.prioridad,
  seed.descripcion,
  seed.estado
from (
  values
    ('LIG-CG-CM-CMP-001', 'PREVENTIVO', 'MECANICA', 'MENSUAL', date_trunc('month', current_date)::date + 2, 'Carlos Supervisor', 3, 'ALTA', 'PM mensual compresor principal.', 'PROGRAMADO'),
    ('LIG-CG-CM-CMP-002', 'PREVENTIVO', 'REFRIGERACION', 'MENSUAL', date_trunc('month', current_date)::date + 8, 'Carlos Supervisor', 3, 'ALTA', 'Inspección y lubricación compresor reserva.', 'PROGRAMADO'),
    ('LIG-CG-CM-BBA-001', 'LUBRICACION', 'MECANICA', 'BIMENSUAL', date_trunc('month', current_date)::date + 12, 'José Técnico', 1.5, 'MEDIA', 'Lubricación bomba de recirculación.', 'PROGRAMADO'),
    ('LIG-SCAL-CAL-001', 'INSPECCION', 'MECANICA', 'SEMANAL', current_date - 4, 'Luis Jefe de Planta', 2, 'ALTA', 'Inspección vencida de caldera.', 'VENCIDO'),
    ('LIG-EMP-TBE-001', 'CALIBRACION', 'ELECTRICA', 'TRIMESTRAL', date_trunc('month', current_date)::date + 20, 'María Electricista', 2, 'MEDIA', 'Calibración de protecciones del tablero.', 'PROGRAMADO'),
    ('LIG-CG-CM-CND-001', 'CORRECTIVO PROGRAMADO', 'REFRIGERACION', 'UNICA', current_date + 3, 'Carlos Supervisor', 6, 'CRITICA', 'Reparación programada de condensador fuera de servicio.', 'PROGRAMADO')
) as seed(codigo_activo, tipo_mantenimiento, especialidad, frecuencia, fecha_inicio, responsable, duracion, prioridad, descripcion, estado)
join public.equipos equipo
  on equipo.codigo_activo = seed.codigo_activo
where not exists (
  select 1
  from public.programas_mantenimiento actual
  where actual.equipo_id = equipo.id
    and actual.tipo_mantenimiento = seed.tipo_mantenimiento
    and actual.fecha_inicio = seed.fecha_inicio
);

-- =========================================================
-- 5) Órdenes de trabajo variadas para dashboard y flujo
-- =========================================================

insert into public.ordenes_trabajo (
  codigo_ot,
  equipo_id,
  activo_id,
  tipo_mantenimiento,
  especialidad,
  responsable,
  tecnico_asignado,
  tecnico,
  asignado_a,
  fecha_programada,
  fecha_reprogramada,
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
select
  seed.codigo_ot,
  equipo.id,
  equipo.id,
  seed.tipo_mantenimiento,
  seed.especialidad,
  seed.responsable,
  seed.tecnico,
  seed.tecnico,
  seed.tecnico,
  seed.fecha_programada,
  seed.fecha_reprogramada,
  seed.duracion,
  seed.descripcion,
  seed.prioridad,
  seed.estado,
  seed.hora_inicio,
  seed.hora_fin,
  seed.horas_hombre,
  seed.observaciones,
  seed.observaciones,
  seed.estado_final
from (
  values
    ('OT-DEMO-001', 'LIG-CG-CM-CMP-001', 'PREVENTIVO', 'MECANICA', 'Carlos Supervisor', null, date_trunc('month', current_date)::date + 2, null::date, 3, 'PM mensual compresor principal.', 'ALTA', 'PENDIENTE_APROBACION', null::time, null::time, null::numeric, null, null),
    ('OT-DEMO-002', 'LIG-CG-CM-CMP-002', 'PREVENTIVO', 'REFRIGERACION', 'Carlos Supervisor', 'Técnico de Planta', date_trunc('month', current_date)::date + 8, null::date, 3, 'Inspección compresor reserva.', 'ALTA', 'ASIGNADA', null::time, null::time, null::numeric, null, null),
    ('OT-DEMO-003', 'LIG-CG-CM-BBA-001', 'CORRECTIVO PROGRAMADO', 'MECANICA', 'Carlos Supervisor', 'Técnico de Planta', current_date, null::date, 2.5, 'Cambio preventivo de sello mecánico por goteo detectado.', 'ALTA', 'EN_EJECUCION', '08:00'::time, null::time, null::numeric, null, null),
    ('OT-DEMO-004', 'LIG-SCAL-CAL-001', 'INSPECCION', 'MECANICA', 'Luis Jefe de Planta', 'Técnico de Planta', current_date - 4, null::date, 2, 'Inspección vencida de caldera.', 'ALTA', 'PENDIENTE_VALIDACION', '09:00'::time, '11:10'::time, 2.16, 'Se inspeccionó combustión, presión y dispositivos de seguridad.', 'Equipo operativo con recomendación de limpieza de quemador.'),
    ('OT-DEMO-005', 'LIG-EMP-TBE-001', 'CALIBRACION', 'ELECTRICA', 'María Electricista', null, date_trunc('month', current_date)::date + 20, null::date, 2, 'Calibración de protecciones y verificación de borneras.', 'MEDIA', 'APROBADA', null::time, null::time, null::numeric, null, null),
    ('OT-DEMO-006', 'LIG-CG-CM-CND-001', 'CORRECTIVO PROGRAMADO', 'REFRIGERACION', 'Carlos Supervisor', null, current_date + 3, null::date, 6, 'Reparación de fuga y limpieza de serpentín.', 'CRITICA', 'PENDIENTE_APROBACION', null::time, null::time, null::numeric, null, null),
    ('OT-DEMO-007', 'LIG-EMP-FJA-001', 'CORRECTIVO', 'MECANICA', 'Carlos Supervisor', 'Técnico de Planta', current_date - 2, null::date, 4, 'Alineamiento y tensión de faja transportadora.', 'MEDIA', 'PENDIENTE_VALIDACION', '14:00'::time, '17:30'::time, 3.5, 'Faja alineada y prueba sin desviación.', 'Equipo en prueba operativa.'),
    ('OT-DEMO-008', 'LIG-EMP-DMT-001', 'INSPECCION', 'INSTRUMENTACION', 'Calidad Planta', 'Técnico de Planta', current_date - 1, null::date, 1, 'Verificación detector de metales.', 'BAJA', 'CERRADA', '10:00'::time, '10:50'::time, 0.83, 'Pruebas patrón ferrosas y no ferrosas correctas.', 'Equipo operativo y calibrado.'),
    ('OT-DEMO-009', 'LIG-CG-CM-CMP-001', 'PREVENTIVO', 'MECANICA', 'Carlos Supervisor', 'Técnico de Planta', current_date - 18, null::date, 3, 'PM mensual histórico de compresor principal.', 'MEDIA', 'CERRADA', '08:30'::time, '11:40'::time, 3.16, 'Se ejecutó PM mensual sin hallazgos críticos.', 'Equipo operativo.'),
    ('OT-DEMO-010', 'LIG-SCAL-CAL-001', 'PREVENTIVO', 'MECANICA', 'Luis Jefe de Planta', 'Técnico de Planta', current_date - 42, null::date, 4, 'Limpieza y prueba de seguridad de caldera.', 'ALTA', 'CERRADA', '07:30'::time, '11:30'::time, 4, 'Válvulas de seguridad probadas. Limpieza general realizada.', 'Equipo operativo.'),
    ('OT-DEMO-011', 'LIG-CG-CM-CND-001', 'CORRECTIVO', 'REFRIGERACION', 'Carlos Supervisor', 'Técnico de Planta', current_date - 15, null::date, 5, 'Falla de ventilador axial de condensador.', 'CRITICA', 'CERRADA', '13:00'::time, '18:30'::time, 5.5, 'Se confirma daño de rodamiento. Equipo queda fuera de servicio parcial.', 'Equipo fuera de servicio hasta cambio de repuesto.'),
    ('OT-DEMO-012', 'LIG-EMP-TBE-001', 'PREVENTIVO', 'ELECTRICA', 'María Electricista', null, current_date - 3, current_date + 5, 2, 'PM eléctrico reprogramado por parada de línea.', 'MEDIA', 'REPROGRAMADA', null::time, null::time, null::numeric, null, null)
) as seed(
  codigo_ot,
  codigo_activo,
  tipo_mantenimiento,
  especialidad,
  responsable,
  tecnico,
  fecha_programada,
  fecha_reprogramada,
  duracion,
  descripcion,
  prioridad,
  estado,
  hora_inicio,
  hora_fin,
  horas_hombre,
  observaciones,
  estado_final
)
join public.equipos equipo
  on equipo.codigo_activo = seed.codigo_activo
where not exists (
  select 1 from public.ordenes_trabajo actual
  where actual.codigo_ot = seed.codigo_ot
);

-- =========================================================
-- 6) Fichas, históricos y secciones de la ficha
-- =========================================================

insert into public.fichas_mantenimiento (
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
select
  seed.codigo_ficha,
  seed.tipo_ficha,
  orden.id,
  equipo.id,
  equipo.id,
  seed.fecha,
  seed.especialidad,
  'Técnico de Planta',
  orden.descripcion,
  orden.hora_inicio,
  orden.hora_fin,
  orden.horas_hombre,
  orden.estado_final,
  orden.observaciones,
  'Firma demo técnico',
  'GENERADA'
from (
  values
    ('FM-DEMO-001', 'PREVENTIVO', 'OT-DEMO-008', current_date - 1, 'INSTRUMENTACION'),
    ('FM-DEMO-002', 'PREVENTIVO', 'OT-DEMO-009', current_date - 18, 'MECANICA'),
    ('FM-DEMO-003', 'PREVENTIVO', 'OT-DEMO-010', current_date - 42, 'MECANICA'),
    ('FM-DEMO-004', 'CORRECTIVO', 'OT-DEMO-011', current_date - 15, 'REFRIGERACION')
) as seed(codigo_ficha, tipo_ficha, codigo_ot, fecha, especialidad)
join public.ordenes_trabajo orden
  on orden.codigo_ot = seed.codigo_ot
join public.equipos equipo
  on equipo.id = orden.equipo_id
where not exists (
  select 1 from public.fichas_mantenimiento actual
  where actual.codigo_ficha = seed.codigo_ficha
);

insert into public.checklist_mantenimiento (
  orden_trabajo_id,
  ficha_mantenimiento_id,
  descripcion,
  resultado
)
select orden.id, ficha.id, seed.descripcion, seed.resultado
from (
  values
    ('OT-DEMO-009', 'FM-DEMO-002', 'Limpieza general', 'SI'),
    ('OT-DEMO-009', 'FM-DEMO-002', 'Inspección visual', 'SI'),
    ('OT-DEMO-009', 'FM-DEMO-002', 'Lubricación / engrase', 'SI'),
    ('OT-DEMO-009', 'FM-DEMO-002', 'Verificación de vibraciones', 'NO APLICA'),
    ('OT-DEMO-010', 'FM-DEMO-003', 'Pruebas de seguridad', 'SI'),
    ('OT-DEMO-008', 'FM-DEMO-001', 'Calibración / ajuste', 'SI'),
    ('OT-DEMO-011', 'FM-DEMO-004', 'Medición de parámetros mecánicos', 'SI'),
    ('OT-DEMO-011', 'FM-DEMO-004', 'Verificación de sensores / instrumentos', 'SI')
) as seed(codigo_ot, codigo_ficha, descripcion, resultado)
join public.ordenes_trabajo orden
  on orden.codigo_ot = seed.codigo_ot
join public.fichas_mantenimiento ficha
  on ficha.codigo_ficha = seed.codigo_ficha
where not exists (
  select 1 from public.checklist_mantenimiento actual
  where actual.orden_trabajo_id = orden.id
    and actual.descripcion = seed.descripcion
);

insert into public.hallazgos_mantenimiento (
  orden_trabajo_id,
  ficha_mantenimiento_id,
  descripcion,
  criticidad
)
select orden.id, ficha.id, seed.descripcion, seed.criticidad
from (
  values
    ('OT-DEMO-009', 'FM-DEMO-002', 'Acople con leve desgaste superficial.', 'BAJA'),
    ('OT-DEMO-010', 'FM-DEMO-003', 'Quemador requiere limpieza preventiva recurrente.', 'MEDIA'),
    ('OT-DEMO-011', 'FM-DEMO-004', 'Rodamiento de ventilador axial dañado.', 'ALTA'),
    ('OT-DEMO-008', 'FM-DEMO-001', 'No se encontraron desviaciones.', 'BAJA')
) as seed(codigo_ot, codigo_ficha, descripcion, criticidad)
join public.ordenes_trabajo orden
  on orden.codigo_ot = seed.codigo_ot
join public.fichas_mantenimiento ficha
  on ficha.codigo_ficha = seed.codigo_ficha
where not exists (
  select 1 from public.hallazgos_mantenimiento actual
  where actual.orden_trabajo_id = orden.id
    and actual.descripcion = seed.descripcion
);

insert into public.repuestos_mantenimiento (
  orden_trabajo_id,
  ficha_mantenimiento_id,
  descripcion,
  cantidad,
  costo
)
select orden.id, ficha.id, seed.descripcion, seed.cantidad, seed.costo
from (
  values
    ('OT-DEMO-009', 'FM-DEMO-002', 'Grasa grado alimentario', 1, 38),
    ('OT-DEMO-010', 'FM-DEMO-003', 'Empaque inspección caldera', 2, 120),
    ('OT-DEMO-011', 'FM-DEMO-004', 'Rodamiento ventilador axial', 1, 480),
    ('OT-DEMO-008', 'FM-DEMO-001', 'No se ingresó información.', 0, 0)
) as seed(codigo_ot, codigo_ficha, descripcion, cantidad, costo)
join public.ordenes_trabajo orden
  on orden.codigo_ot = seed.codigo_ot
join public.fichas_mantenimiento ficha
  on ficha.codigo_ficha = seed.codigo_ficha
where not exists (
  select 1 from public.repuestos_mantenimiento actual
  where actual.orden_trabajo_id = orden.id
    and actual.descripcion = seed.descripcion
);

insert into public.mano_obra_mantenimiento (
  orden_trabajo_id,
  ficha_mantenimiento_id,
  descripcion,
  horas,
  costo
)
select orden.id, ficha.id, seed.descripcion, seed.horas, seed.costo
from (
  values
    ('OT-DEMO-008', 'FM-DEMO-001', 'Técnico de Planta - Instrumentación', 0.83, 35),
    ('OT-DEMO-009', 'FM-DEMO-002', 'Técnico de Planta - Mecánica', 3.16, 135),
    ('OT-DEMO-010', 'FM-DEMO-003', 'Técnico de Planta - Calderos', 4, 180),
    ('OT-DEMO-011', 'FM-DEMO-004', 'Técnico de Planta - Refrigeración', 5.5, 260)
) as seed(codigo_ot, codigo_ficha, descripcion, horas, costo)
join public.ordenes_trabajo orden
  on orden.codigo_ot = seed.codigo_ot
join public.fichas_mantenimiento ficha
  on ficha.codigo_ficha = seed.codigo_ficha
where not exists (
  select 1 from public.mano_obra_mantenimiento actual
  where actual.orden_trabajo_id = orden.id
    and actual.descripcion = seed.descripcion
);

insert into public.evidencias_mantenimiento (
  orden_trabajo_id,
  ficha_mantenimiento_id,
  tipo,
  descripcion,
  archivo_url
)
select orden.id, ficha.id, seed.tipo, seed.descripcion, seed.archivo_url
from (
  values
    ('OT-DEMO-009', 'FM-DEMO-002', 'FOTO_ANTES', 'Foto antes del PM del compresor.', 'https://placehold.co/900x600/png?text=Antes+Compresor'),
    ('OT-DEMO-009', 'FM-DEMO-002', 'FOTO_DURANTE', 'Foto durante limpieza y verificación.', 'https://placehold.co/900x600/png?text=Durante+PM+Compresor'),
    ('OT-DEMO-009', 'FM-DEMO-002', 'FOTO_DESPUES', 'Foto final equipo operativo.', 'https://placehold.co/900x600/png?text=Despues+Compresor'),
    ('OT-DEMO-010', 'FM-DEMO-003', 'FOTO_DESPUES', 'Caldera luego de limpieza.', 'https://placehold.co/900x600/png?text=Caldera+Limpieza'),
    ('OT-DEMO-011', 'FM-DEMO-004', 'FOTO_ANTES', 'Ventilador axial con rodamiento dañado.', 'https://placehold.co/900x600/png?text=Condensador+Falla'),
    ('OT-DEMO-008', 'FM-DEMO-001', 'FOTO_DESPUES', 'Detector de metales calibrado.', 'https://placehold.co/900x600/png?text=Detector+Calibrado')
) as seed(codigo_ot, codigo_ficha, tipo, descripcion, archivo_url)
join public.ordenes_trabajo orden
  on orden.codigo_ot = seed.codigo_ot
join public.fichas_mantenimiento ficha
  on ficha.codigo_ficha = seed.codigo_ficha
where not exists (
  select 1 from public.evidencias_mantenimiento actual
  where actual.orden_trabajo_id = orden.id
    and actual.tipo = seed.tipo
    and actual.descripcion = seed.descripcion
);

insert into public.historial_mantenimiento (
  equipo_id,
  activo_id,
  orden_trabajo_id,
  ficha_mantenimiento_id,
  fecha,
  tipo_mantenimiento,
  descripcion,
  estado
)
select
  orden.equipo_id,
  orden.equipo_id,
  orden.id,
  ficha.id,
  ficha.fecha,
  orden.tipo_mantenimiento,
  'Ficha ' || ficha.codigo_ficha || ' validada por supervisor.',
  'CERRADA'
from public.fichas_mantenimiento ficha
join public.ordenes_trabajo orden
  on orden.id = ficha.orden_trabajo_id
where ficha.codigo_ficha like 'FM-DEMO-%'
  and not exists (
    select 1 from public.historial_mantenimiento actual
    where actual.ficha_mantenimiento_id = ficha.id
  );

insert into public.documentos_activos (
  equipo_id,
  activo_id,
  tipo_documento,
  nombre,
  archivo_url,
  storage_bucket,
  storage_path,
  mime_type,
  observaciones
)
select
  equipo.id,
  equipo.id,
  seed.tipo_documento,
  seed.nombre,
  seed.archivo_url,
  seed.storage_bucket,
  seed.storage_path,
  seed.mime_type,
  seed.observaciones
from (
  values
    ('LIG-CG-CM-CMP-001', 'FICHA_TECNICA', 'Ficha técnica fabricante MYCOM N8WB', 'https://example.com/demo/ficha-tecnica-mycom-n8wb.pdf', 'activos-documentos', 'demo/mycom-n8wb.pdf', 'application/pdf', 'Documento demo para expediente.'),
    ('LIG-SCAL-CAL-001', 'MANUAL', 'Manual operación caldera CB-600', 'https://example.com/demo/manual-caldera-cb600.pdf', 'activos-documentos', 'demo/manual-caldera-cb600.pdf', 'application/pdf', 'Manual demo de operación.'),
    ('LIG-EMP-TBE-001', 'CERTIFICADO', 'Certificado tablero empaque', 'https://example.com/demo/certificado-tablero.pdf', 'activos-documentos', 'demo/certificado-tablero.pdf', 'application/pdf', 'Certificado demo.'),
    ('LIG-CG-CM-CMP-001', 'FOTO', 'Foto compresor principal', 'https://placehold.co/900x600/png?text=Compresor+NH3+Principal', 'activos-fotos', 'demo/compresor-nh3-principal.png', 'image/png', 'Foto referencial del activo.'),
    ('LIG-CG-CM-CND-001', 'FOTO', 'Foto condensador fuera de servicio', 'https://placehold.co/900x600/png?text=Condensador+Fuera+Servicio', 'activos-fotos', 'demo/condensador-fuera-servicio.png', 'image/png', 'Foto referencial del activo fuera de servicio.')
) as seed(codigo_activo, tipo_documento, nombre, archivo_url, storage_bucket, storage_path, mime_type, observaciones)
join public.equipos equipo
  on equipo.codigo_activo = seed.codigo_activo
where not exists (
  select 1
  from public.documentos_activos actual
  where actual.equipo_id = equipo.id
    and actual.nombre = seed.nombre
);

notify pgrst, 'reload schema';

-- Si el Dashboard sigue en cero, revisa RLS: las tablas deben permitir SELECT
-- al rol anon/authenticated que usa NEXT_PUBLIC_SUPABASE_ANON_KEY.
