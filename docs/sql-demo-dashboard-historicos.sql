-- Proyecto WU - Data ficticia para dashboard, históricos y fichas
-- Ejecutar después de docs/sql-proyecto-wu-beta.sql
-- Es idempotente: usa UUID fijos y ON CONFLICT para poder re-ejecutarlo.

create extension if not exists pgcrypto;

-- =========================================================
-- 1) Organización y catálogos demo
-- =========================================================

insert into public.empresas (id, nombre, codigo)
values
  ('10000000-0000-4000-8000-000000000001', 'Inversiones Pesqueras Liguria S.A.C.', 'LIG')
on conflict (id) do update set
  nombre = excluded.nombre,
  codigo = excluded.codigo;

insert into public.organizacion_nodos (id, empresa_id, nodo_padre_id, nombre, codigo, tipo)
values
  ('10000000-0000-4000-8000-000000000101', '10000000-0000-4000-8000-000000000001', null, 'Sede Callao', 'SC', 'SEDE'),
  ('10000000-0000-4000-8000-000000000102', '10000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000101', 'Planta Congelados', 'PC', 'PLANTA'),
  ('10000000-0000-4000-8000-000000000103', '10000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000102', 'Casa de Máquinas', 'CM', 'AREA'),
  ('10000000-0000-4000-8000-000000000104', '10000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000103', 'Sistema de Refrigeración', 'REF', 'SISTEMA'),
  ('10000000-0000-4000-8000-000000000105', '10000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000104', 'Compresores NH3', 'CG-CM', 'UBICACION'),
  ('10000000-0000-4000-8000-000000000106', '10000000-0000-4000-8000-000000000102', null, 'Planta Harina', 'PH', 'PLANTA'),
  ('10000000-0000-4000-8000-000000000107', '10000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000106', 'Área Calderos', 'CAL', 'AREA'),
  ('10000000-0000-4000-8000-000000000108', '10000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000107', 'Sala de Calderos', 'SCAL', 'UBICACION'),
  ('10000000-0000-4000-8000-000000000109', '10000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000102', 'Empaque', 'EMP', 'AREA'),
  ('10000000-0000-4000-8000-000000000110', '10000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000109', 'Línea de Empaque 1', 'EMP-01', 'UBICACION')
on conflict (id) do update set
  empresa_id = excluded.empresa_id,
  nodo_padre_id = excluded.nodo_padre_id,
  nombre = excluded.nombre,
  codigo = excluded.codigo,
  tipo = excluded.tipo;

insert into public.familias_activos (id, nombre, codigo, estado)
values
  ('10000000-0000-4000-8000-000000000201', 'Refrigeración industrial', 'REF', true),
  ('10000000-0000-4000-8000-000000000202', 'Equipos rotativos', 'ROT', true),
  ('10000000-0000-4000-8000-000000000203', 'Generación de vapor', 'VAP', true),
  ('10000000-0000-4000-8000-000000000204', 'Sistemas eléctricos', 'ELE', true),
  ('10000000-0000-4000-8000-000000000205', 'Empaque y proceso', 'EMP', true)
on conflict (id) do update set
  nombre = excluded.nombre,
  codigo = excluded.codigo,
  estado = excluded.estado;

insert into public.tipos_equipo (id, familia_id, nombre, codigo, codigo_corto, estado)
values
  ('10000000-0000-4000-8000-000000000301', '10000000-0000-4000-8000-000000000201', 'Compresor de amoníaco', 'COMPRESOR_AMONIACO', 'CMP', true),
  ('10000000-0000-4000-8000-000000000302', '10000000-0000-4000-8000-000000000202', 'Bomba centrífuga', 'BOMBA_CENTRIFUGA', 'BBA', true),
  ('10000000-0000-4000-8000-000000000303', '10000000-0000-4000-8000-000000000203', 'Caldera pirotubular', 'CALDERA_PIROTUBULAR', 'CAL', true),
  ('10000000-0000-4000-8000-000000000304', '10000000-0000-4000-8000-000000000204', 'Tablero eléctrico', 'TABLERO_ELECTRICO', 'TBE', true),
  ('10000000-0000-4000-8000-000000000305', '10000000-0000-4000-8000-000000000205', 'Faja transportadora', 'FAJA_TRANSPORTADORA', 'FJA', true),
  ('10000000-0000-4000-8000-000000000306', '10000000-0000-4000-8000-000000000201', 'Condensador evaporativo', 'CONDENSADOR_EVAPORATIVO', 'CND', true),
  ('10000000-0000-4000-8000-000000000307', '10000000-0000-4000-8000-000000000202', 'Motor eléctrico', 'MOTOR_ELECTRICO', 'MTR', true),
  ('10000000-0000-4000-8000-000000000308', '10000000-0000-4000-8000-000000000205', 'Detector de metales', 'DETECTOR_METALES', 'DMT', true)
on conflict (id) do update set
  familia_id = excluded.familia_id,
  nombre = excluded.nombre,
  codigo = excluded.codigo,
  codigo_corto = excluded.codigo_corto,
  estado = excluded.estado;

-- =========================================================
-- 2) Activos demo para disponibilidad y expedientes
-- =========================================================

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
  fecha_ultimo_mantenimiento,
  proximo_mantenimiento,
  fecha_proximo_mantenimiento
)
values
  ('10000000-0000-4000-8000-000000000401', 'LIG-CG-CM-CMP-001', 'Compresor NH3 Principal 01', 'Compresor principal para túneles de congelamiento.', '10000000-0000-4000-8000-000000000105', 'Refrigeración industrial', 'Compresor de amoníaco', 'MYCOM', 'N8WB', 'MYC-24001', 'Mayekawa', 'Frío Industrial Perú', 'OPERATIVO', 'A', 'Carlos Supervisor', 'QR-LIG-CMP-001', current_date - 18, current_date - 18, current_date + 12, current_date + 12),
  ('10000000-0000-4000-8000-000000000402', 'LIG-CG-CM-CMP-002', 'Compresor NH3 Reserva 02', 'Compresor de respaldo para sala de máquinas.', '10000000-0000-4000-8000-000000000105', 'Refrigeración industrial', 'Compresor de amoníaco', 'Sabroe', 'SAB-128', 'SAB-9088', 'Johnson Controls', 'Refripartes SAC', 'OPERATIVO', 'A', 'Carlos Supervisor', 'QR-LIG-CMP-002', current_date - 45, current_date - 45, current_date + 5, current_date + 5),
  ('10000000-0000-4000-8000-000000000403', 'LIG-CG-CM-BBA-001', 'Bomba recirculación agua fría', 'Bomba centrífuga para recirculación de agua de proceso.', '10000000-0000-4000-8000-000000000105', 'Equipos rotativos', 'Bomba centrífuga', 'KSB', 'Etanorm 80-200', 'KSB-7731', 'KSB', 'Servicios Industriales SAC', 'OPERATIVO', 'B', 'Carlos Supervisor', 'QR-LIG-BBA-001', current_date - 7, current_date - 7, current_date + 53, current_date + 53),
  ('10000000-0000-4000-8000-000000000404', 'LIG-SCAL-CAL-001', 'Caldera pirotubular 01', 'Caldera para generación de vapor de proceso.', '10000000-0000-4000-8000-000000000108', 'Generación de vapor', 'Caldera pirotubular', 'Cleaver Brooks', 'CB-600', 'CB-600-1122', 'Cleaver Brooks', 'Thermo Perú', 'OPERATIVO', 'A', 'Luis Jefe de Planta', 'QR-LIG-CAL-001', current_date - 12, current_date - 12, current_date + 18, current_date + 18),
  ('10000000-0000-4000-8000-000000000405', 'LIG-EMP-TBE-001', 'Tablero línea empaque 01', 'Tablero principal de control para línea de empaque.', '10000000-0000-4000-8000-000000000110', 'Sistemas eléctricos', 'Tablero eléctrico', 'Schneider', 'Prisma P', 'TBE-4451', 'Schneider Electric', 'Electrocontrol SAC', 'OPERATIVO', 'B', 'María Electricista', 'QR-LIG-TBE-001', current_date - 25, current_date - 25, current_date + 35, current_date + 35),
  ('10000000-0000-4000-8000-000000000406', 'LIG-EMP-FJA-001', 'Faja transportadora empaque', 'Faja transportadora de producto terminado.', '10000000-0000-4000-8000-000000000110', 'Empaque y proceso', 'Faja transportadora', 'Dorner', '2200 Series', 'FJA-9920', 'Dorner', 'TecnoBandas Perú', 'MANTENIMIENTO', 'B', 'José Técnico', 'QR-LIG-FJA-001', current_date - 60, current_date - 60, current_date + 2, current_date + 2),
  ('10000000-0000-4000-8000-000000000407', 'LIG-CG-CM-CND-001', 'Condensador evaporativo 01', 'Condensador evaporativo de sistema NH3.', '10000000-0000-4000-8000-000000000105', 'Refrigeración industrial', 'Condensador evaporativo', 'BAC', 'VXC', 'BAC-6310', 'Baltimore Aircoil', 'Frío Industrial Perú', 'FUERA_SERVICIO', 'A', 'Carlos Supervisor', 'QR-LIG-CND-001', current_date - 90, current_date - 90, current_date - 15, current_date - 15),
  ('10000000-0000-4000-8000-000000000408', 'LIG-EMP-DMT-001', 'Detector de metales', 'Detector de metales para empaque final.', '10000000-0000-4000-8000-000000000110', 'Empaque y proceso', 'Detector de metales', 'Mettler Toledo', 'Safeline', 'DMT-5521', 'Mettler Toledo', 'Control Calidad SAC', 'OPERATIVO', 'C', 'Calidad Planta', 'QR-LIG-DMT-001', current_date - 3, current_date - 3, current_date + 87, current_date + 87)
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
  fecha_ultimo_mantenimiento = excluded.fecha_ultimo_mantenimiento,
  proximo_mantenimiento = excluded.proximo_mantenimiento,
  fecha_proximo_mantenimiento = excluded.fecha_proximo_mantenimiento;

-- =========================================================
-- 3) Documentación técnica y fotos de expediente
-- =========================================================

insert into public.documentos_activos (
  id,
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
values
  ('10000000-0000-4000-8000-000000000901', '10000000-0000-4000-8000-000000000401', '10000000-0000-4000-8000-000000000401', 'FICHA_TECNICA', 'Ficha técnica fabricante MYCOM N8WB', 'https://example.com/demo/ficha-tecnica-mycom-n8wb.pdf', 'activos-documentos', 'demo/mycom-n8wb.pdf', 'application/pdf', 'Documento demo para expediente.'),
  ('10000000-0000-4000-8000-000000000902', '10000000-0000-4000-8000-000000000404', '10000000-0000-4000-8000-000000000404', 'MANUAL', 'Manual operación caldera CB-600', 'https://example.com/demo/manual-caldera-cb600.pdf', 'activos-documentos', 'demo/manual-caldera-cb600.pdf', 'application/pdf', 'Manual demo de operación.'),
  ('10000000-0000-4000-8000-000000000903', '10000000-0000-4000-8000-000000000405', '10000000-0000-4000-8000-000000000405', 'CERTIFICADO', 'Certificado tablero empaque', 'https://example.com/demo/certificado-tablero.pdf', 'activos-documentos', 'demo/certificado-tablero.pdf', 'application/pdf', 'Certificado demo.'),
  ('10000000-0000-4000-8000-000000000904', '10000000-0000-4000-8000-000000000401', '10000000-0000-4000-8000-000000000401', 'FOTO', 'Foto compresor principal', 'https://placehold.co/900x600/png?text=Compresor+NH3+Principal', 'activos-fotos', 'demo/compresor-nh3-principal.png', 'image/png', 'Foto referencial del activo.'),
  ('10000000-0000-4000-8000-000000000905', '10000000-0000-4000-8000-000000000407', '10000000-0000-4000-8000-000000000407', 'FOTO', 'Foto condensador fuera de servicio', 'https://placehold.co/900x600/png?text=Condensador+Fuera+Servicio', 'activos-fotos', 'demo/condensador-fuera-servicio.png', 'image/png', 'Foto referencial del activo fuera de servicio.')
on conflict (id) do update set
  equipo_id = excluded.equipo_id,
  activo_id = excluded.activo_id,
  tipo_documento = excluded.tipo_documento,
  nombre = excluded.nombre,
  archivo_url = excluded.archivo_url,
  storage_bucket = excluded.storage_bucket,
  storage_path = excluded.storage_path,
  mime_type = excluded.mime_type,
  observaciones = excluded.observaciones;

-- =========================================================
-- 4) Programa PM del mes, vencidos y próximos
-- =========================================================

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
  ('10000000-0000-4000-8000-000000000501', '10000000-0000-4000-8000-000000000401', '10000000-0000-4000-8000-000000000401', 'PREVENTIVO', 'MECANICA', 'MENSUAL', date_trunc('month', current_date)::date + 2, date_trunc('month', current_date)::date + 2, 'Carlos Supervisor', 3, 'ALTA', 'PM mensual compresor principal.', 'PROGRAMADO'),
  ('10000000-0000-4000-8000-000000000502', '10000000-0000-4000-8000-000000000402', '10000000-0000-4000-8000-000000000402', 'PREVENTIVO', 'REFRIGERACION', 'MENSUAL', date_trunc('month', current_date)::date + 8, date_trunc('month', current_date)::date + 8, 'Carlos Supervisor', 3, 'ALTA', 'Inspección y lubricación compresor reserva.', 'PROGRAMADO'),
  ('10000000-0000-4000-8000-000000000503', '10000000-0000-4000-8000-000000000403', '10000000-0000-4000-8000-000000000403', 'LUBRICACION', 'MECANICA', 'BIMENSUAL', date_trunc('month', current_date)::date + 12, date_trunc('month', current_date)::date + 12, 'José Técnico', 1.5, 'MEDIA', 'Lubricación bomba de recirculación.', 'PROGRAMADO'),
  ('10000000-0000-4000-8000-000000000504', '10000000-0000-4000-8000-000000000404', '10000000-0000-4000-8000-000000000404', 'INSPECCION', 'MECANICA', 'SEMANAL', current_date - 4, current_date - 4, 'Luis Jefe de Planta', 2, 'ALTA', 'Inspección vencida de caldera.', 'VENCIDO'),
  ('10000000-0000-4000-8000-000000000505', '10000000-0000-4000-8000-000000000405', '10000000-0000-4000-8000-000000000405', 'CALIBRACION', 'ELECTRICA', 'TRIMESTRAL', date_trunc('month', current_date)::date + 20, date_trunc('month', current_date)::date + 20, 'María Electricista', 2, 'MEDIA', 'Calibración de protecciones del tablero.', 'PROGRAMADO'),
  ('10000000-0000-4000-8000-000000000506', '10000000-0000-4000-8000-000000000407', '10000000-0000-4000-8000-000000000407', 'CORRECTIVO PROGRAMADO', 'REFRIGERACION', 'UNICA', current_date + 3, current_date + 3, 'Carlos Supervisor', 6, 'CRITICA', 'Reparación programada de condensador fuera de servicio.', 'PROGRAMADO')
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

-- =========================================================
-- 5) Órdenes de trabajo con estados variados
-- =========================================================

insert into public.ordenes_trabajo (
  id,
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
values
  ('10000000-0000-4000-8000-000000000601', 'OT-2026-D001', '10000000-0000-4000-8000-000000000401', '10000000-0000-4000-8000-000000000401', 'PREVENTIVO', 'MECANICA', 'Carlos Supervisor', null, null, null, date_trunc('month', current_date)::date + 2, null, 3, 'PM mensual compresor principal.', 'ALTA', 'PENDIENTE_APROBACION', null, null, null, null, null, null),
  ('10000000-0000-4000-8000-000000000602', 'OT-2026-D002', '10000000-0000-4000-8000-000000000402', '10000000-0000-4000-8000-000000000402', 'PREVENTIVO', 'REFRIGERACION', 'Carlos Supervisor', 'Técnico de Planta', 'Técnico de Planta', 'Técnico de Planta', date_trunc('month', current_date)::date + 8, null, 3, 'Inspección compresor reserva.', 'ALTA', 'ASIGNADA', null, null, null, null, null, null),
  ('10000000-0000-4000-8000-000000000603', 'OT-2026-D003', '10000000-0000-4000-8000-000000000403', '10000000-0000-4000-8000-000000000403', 'CORRECTIVO PROGRAMADO', 'MECANICA', 'Carlos Supervisor', 'Técnico de Planta', 'Técnico de Planta', 'Técnico de Planta', current_date, null, 2.5, 'Cambio preventivo de sello mecánico por goteo detectado.', 'ALTA', 'EN_EJECUCION', '08:00', null, null, null, null, null),
  ('10000000-0000-4000-8000-000000000604', 'OT-2026-D004', '10000000-0000-4000-8000-000000000404', '10000000-0000-4000-8000-000000000404', 'INSPECCION', 'MECANICA', 'Luis Jefe de Planta', 'Técnico de Planta', 'Técnico de Planta', 'Técnico de Planta', current_date - 4, null, 2, 'Inspección vencida de caldera.', 'ALTA', 'PENDIENTE_VALIDACION', '09:00', '11:10', 2.16, 'Se inspeccionó combustión, presión y dispositivos de seguridad.', 'Se inspeccionó combustión, presión y dispositivos de seguridad.', 'Equipo operativo con recomendación de limpieza de quemador.'),
  ('10000000-0000-4000-8000-000000000605', 'OT-2026-D005', '10000000-0000-4000-8000-000000000405', '10000000-0000-4000-8000-000000000405', 'CALIBRACION', 'ELECTRICA', 'María Electricista', null, null, null, date_trunc('month', current_date)::date + 20, null, 2, 'Calibración de protecciones y verificación de borneras.', 'MEDIA', 'APROBADA', null, null, null, null, null, null),
  ('10000000-0000-4000-8000-000000000606', 'OT-2026-D006', '10000000-0000-4000-8000-000000000407', '10000000-0000-4000-8000-000000000407', 'CORRECTIVO PROGRAMADO', 'REFRIGERACION', 'Carlos Supervisor', null, null, null, current_date + 3, null, 6, 'Reparación de fuga y limpieza de serpentín.', 'CRITICA', 'PENDIENTE_APROBACION', null, null, null, null, null, null),
  ('10000000-0000-4000-8000-000000000607', 'OT-2026-D007', '10000000-0000-4000-8000-000000000406', '10000000-0000-4000-8000-000000000406', 'CORRECTIVO', 'MECANICA', 'Carlos Supervisor', 'Técnico de Planta', 'Técnico de Planta', 'Técnico de Planta', current_date - 2, null, 4, 'Alineamiento y tensión de faja transportadora.', 'MEDIA', 'PENDIENTE_VALIDACION', '14:00', '17:30', 3.5, 'Faja alineada y prueba sin desviación.', 'Faja alineada y prueba sin desviación.', 'Equipo en prueba operativa.'),
  ('10000000-0000-4000-8000-000000000608', 'OT-2026-D008', '10000000-0000-4000-8000-000000000408', '10000000-0000-4000-8000-000000000408', 'INSPECCION', 'INSTRUMENTACION', 'Calidad Planta', 'Técnico de Planta', 'Técnico de Planta', 'Técnico de Planta', current_date - 1, null, 1, 'Verificación detector de metales.', 'BAJA', 'CERRADA', '10:00', '10:50', 0.83, 'Pruebas patrón ferrosas y no ferrosas correctas.', 'Pruebas patrón ferrosas y no ferrosas correctas.', 'Equipo operativo y calibrado.'),
  ('10000000-0000-4000-8000-000000000609', 'OT-2026-D009', '10000000-0000-4000-8000-000000000401', '10000000-0000-4000-8000-000000000401', 'PREVENTIVO', 'MECANICA', 'Carlos Supervisor', 'Técnico de Planta', 'Técnico de Planta', 'Técnico de Planta', current_date - 18, null, 3, 'PM mensual histórico de compresor principal.', 'MEDIA', 'CERRADA', '08:30', '11:40', 3.16, 'Se ejecutó PM mensual sin hallazgos críticos.', 'Se ejecutó PM mensual sin hallazgos críticos.', 'Equipo operativo.'),
  ('10000000-0000-4000-8000-000000000610', 'OT-2026-D010', '10000000-0000-4000-8000-000000000404', '10000000-0000-4000-8000-000000000404', 'PREVENTIVO', 'MECANICA', 'Luis Jefe de Planta', 'Técnico de Planta', 'Técnico de Planta', 'Técnico de Planta', current_date - 42, null, 4, 'Limpieza y prueba de seguridad de caldera.', 'ALTA', 'CERRADA', '07:30', '11:30', 4, 'Válvulas de seguridad probadas. Limpieza general realizada.', 'Válvulas de seguridad probadas. Limpieza general realizada.', 'Equipo operativo.'),
  ('10000000-0000-4000-8000-000000000611', 'OT-2026-D011', '10000000-0000-4000-8000-000000000407', '10000000-0000-4000-8000-000000000407', 'CORRECTIVO', 'REFRIGERACION', 'Carlos Supervisor', 'Técnico de Planta', 'Técnico de Planta', 'Técnico de Planta', current_date - 15, null, 5, 'Falla de ventilador axial de condensador.', 'CRITICA', 'CERRADA', '13:00', '18:30', 5.5, 'Se confirma daño de rodamiento. Equipo queda fuera de servicio parcial.', 'Se confirma daño de rodamiento. Equipo queda fuera de servicio parcial.', 'Equipo fuera de servicio hasta cambio de repuesto.'),
  ('10000000-0000-4000-8000-000000000612', 'OT-2026-D012', '10000000-0000-4000-8000-000000000405', '10000000-0000-4000-8000-000000000405', 'PREVENTIVO', 'ELECTRICA', 'María Electricista', null, null, null, current_date - 3, current_date + 5, 2, 'PM eléctrico reprogramado por parada de línea.', 'MEDIA', 'REPROGRAMADA', null, null, null, null, null, null)
on conflict (id) do update set
  codigo_ot = excluded.codigo_ot,
  equipo_id = excluded.equipo_id,
  activo_id = excluded.activo_id,
  tipo_mantenimiento = excluded.tipo_mantenimiento,
  especialidad = excluded.especialidad,
  responsable = excluded.responsable,
  tecnico_asignado = excluded.tecnico_asignado,
  tecnico = excluded.tecnico,
  asignado_a = excluded.asignado_a,
  fecha_programada = excluded.fecha_programada,
  fecha_reprogramada = excluded.fecha_reprogramada,
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

-- =========================================================
-- 6) Fichas cerradas, checklist, evidencias, repuestos y mano de obra
-- =========================================================

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
  ('10000000-0000-4000-8000-000000000701', 'FM-2026-D001', 'PREVENTIVO', '10000000-0000-4000-8000-000000000608', '10000000-0000-4000-8000-000000000408', '10000000-0000-4000-8000-000000000408', current_date - 1, 'INSTRUMENTACION', 'Técnico de Planta', 'Verificación detector de metales.', '10:00', '10:50', 0.83, 'Equipo operativo y calibrado.', 'Pruebas patrón correctas. No se ingresó información adicional.', 'Firma demo técnico', 'GENERADA'),
  ('10000000-0000-4000-8000-000000000702', 'FM-2026-D002', 'PREVENTIVO', '10000000-0000-4000-8000-000000000609', '10000000-0000-4000-8000-000000000401', '10000000-0000-4000-8000-000000000401', current_date - 18, 'MECANICA', 'Técnico de Planta', 'PM mensual histórico de compresor principal.', '08:30', '11:40', 3.16, 'Equipo operativo.', 'Se ejecutó PM mensual sin hallazgos críticos.', 'Firma demo técnico', 'GENERADA'),
  ('10000000-0000-4000-8000-000000000703', 'FM-2026-D003', 'PREVENTIVO', '10000000-0000-4000-8000-000000000610', '10000000-0000-4000-8000-000000000404', '10000000-0000-4000-8000-000000000404', current_date - 42, 'MECANICA', 'Técnico de Planta', 'Limpieza y prueba de seguridad de caldera.', '07:30', '11:30', 4, 'Equipo operativo.', 'Válvulas de seguridad probadas. Limpieza general realizada.', 'Firma demo técnico', 'GENERADA'),
  ('10000000-0000-4000-8000-000000000704', 'FM-2026-D004', 'CORRECTIVO', '10000000-0000-4000-8000-000000000611', '10000000-0000-4000-8000-000000000407', '10000000-0000-4000-8000-000000000407', current_date - 15, 'REFRIGERACION', 'Técnico de Planta', 'Falla de ventilador axial de condensador.', '13:00', '18:30', 5.5, 'Equipo fuera de servicio hasta cambio de repuesto.', 'Se confirma daño de rodamiento. Se recomienda cambio de conjunto.', 'Firma demo técnico', 'GENERADA')
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

insert into public.checklist_mantenimiento (id, orden_trabajo_id, ficha_mantenimiento_id, descripcion, resultado)
values
  ('10000000-0000-4000-8000-000000000711', '10000000-0000-4000-8000-000000000609', '10000000-0000-4000-8000-000000000702', 'Limpieza general', 'SI'),
  ('10000000-0000-4000-8000-000000000712', '10000000-0000-4000-8000-000000000609', '10000000-0000-4000-8000-000000000702', 'Inspección visual', 'SI'),
  ('10000000-0000-4000-8000-000000000713', '10000000-0000-4000-8000-000000000609', '10000000-0000-4000-8000-000000000702', 'Lubricación / engrase', 'SI'),
  ('10000000-0000-4000-8000-000000000714', '10000000-0000-4000-8000-000000000609', '10000000-0000-4000-8000-000000000702', 'Verificación de vibraciones', 'NO APLICA'),
  ('10000000-0000-4000-8000-000000000715', '10000000-0000-4000-8000-000000000610', '10000000-0000-4000-8000-000000000703', 'Pruebas de seguridad', 'SI'),
  ('10000000-0000-4000-8000-000000000716', '10000000-0000-4000-8000-000000000608', '10000000-0000-4000-8000-000000000701', 'Calibración / ajuste', 'SI'),
  ('10000000-0000-4000-8000-000000000717', '10000000-0000-4000-8000-000000000611', '10000000-0000-4000-8000-000000000704', 'Medición de parámetros mecánicos', 'SI'),
  ('10000000-0000-4000-8000-000000000718', '10000000-0000-4000-8000-000000000611', '10000000-0000-4000-8000-000000000704', 'Verificación de sensores / instrumentos', 'SI')
on conflict (id) do update set
  orden_trabajo_id = excluded.orden_trabajo_id,
  ficha_mantenimiento_id = excluded.ficha_mantenimiento_id,
  descripcion = excluded.descripcion,
  resultado = excluded.resultado;

insert into public.hallazgos_mantenimiento (id, orden_trabajo_id, ficha_mantenimiento_id, descripcion, criticidad)
values
  ('10000000-0000-4000-8000-000000000721', '10000000-0000-4000-8000-000000000609', '10000000-0000-4000-8000-000000000702', 'Acople con leve desgaste superficial.', 'BAJA'),
  ('10000000-0000-4000-8000-000000000722', '10000000-0000-4000-8000-000000000610', '10000000-0000-4000-8000-000000000703', 'Quemador requiere limpieza preventiva recurrente.', 'MEDIA'),
  ('10000000-0000-4000-8000-000000000723', '10000000-0000-4000-8000-000000000611', '10000000-0000-4000-8000-000000000704', 'Rodamiento de ventilador axial dañado.', 'ALTA'),
  ('10000000-0000-4000-8000-000000000724', '10000000-0000-4000-8000-000000000608', '10000000-0000-4000-8000-000000000701', 'No se encontraron desviaciones.', 'BAJA')
on conflict (id) do update set
  orden_trabajo_id = excluded.orden_trabajo_id,
  ficha_mantenimiento_id = excluded.ficha_mantenimiento_id,
  descripcion = excluded.descripcion,
  criticidad = excluded.criticidad;

insert into public.repuestos_mantenimiento (id, orden_trabajo_id, ficha_mantenimiento_id, descripcion, cantidad, costo)
values
  ('10000000-0000-4000-8000-000000000731', '10000000-0000-4000-8000-000000000609', '10000000-0000-4000-8000-000000000702', 'Grasa grado alimentario', 1, 38),
  ('10000000-0000-4000-8000-000000000732', '10000000-0000-4000-8000-000000000610', '10000000-0000-4000-8000-000000000703', 'Empaque inspección caldera', 2, 120),
  ('10000000-0000-4000-8000-000000000733', '10000000-0000-4000-8000-000000000611', '10000000-0000-4000-8000-000000000704', 'Rodamiento ventilador axial', 1, 480),
  ('10000000-0000-4000-8000-000000000734', '10000000-0000-4000-8000-000000000608', '10000000-0000-4000-8000-000000000701', 'No se ingresó información.', 0, 0)
on conflict (id) do update set
  orden_trabajo_id = excluded.orden_trabajo_id,
  ficha_mantenimiento_id = excluded.ficha_mantenimiento_id,
  descripcion = excluded.descripcion,
  cantidad = excluded.cantidad,
  costo = excluded.costo;

insert into public.mano_obra_mantenimiento (id, orden_trabajo_id, ficha_mantenimiento_id, descripcion, horas, costo)
values
  ('10000000-0000-4000-8000-000000000741', '10000000-0000-4000-8000-000000000608', '10000000-0000-4000-8000-000000000701', 'Técnico de Planta - Instrumentación', 0.83, 35),
  ('10000000-0000-4000-8000-000000000742', '10000000-0000-4000-8000-000000000609', '10000000-0000-4000-8000-000000000702', 'Técnico de Planta - Mecánica', 3.16, 135),
  ('10000000-0000-4000-8000-000000000743', '10000000-0000-4000-8000-000000000610', '10000000-0000-4000-8000-000000000703', 'Técnico de Planta - Calderos', 4, 180),
  ('10000000-0000-4000-8000-000000000744', '10000000-0000-4000-8000-000000000611', '10000000-0000-4000-8000-000000000704', 'Técnico de Planta - Refrigeración', 5.5, 260)
on conflict (id) do update set
  orden_trabajo_id = excluded.orden_trabajo_id,
  ficha_mantenimiento_id = excluded.ficha_mantenimiento_id,
  descripcion = excluded.descripcion,
  horas = excluded.horas,
  costo = excluded.costo;

insert into public.herramientas_mantenimiento (id, orden_trabajo_id, ficha_mantenimiento_id, descripcion)
values
  ('10000000-0000-4000-8000-000000000751', '10000000-0000-4000-8000-000000000609', '10000000-0000-4000-8000-000000000702', 'Torquímetro, juego de llaves, linterna industrial.'),
  ('10000000-0000-4000-8000-000000000752', '10000000-0000-4000-8000-000000000610', '10000000-0000-4000-8000-000000000703', 'Manómetro patrón, kit de limpieza de quemador.'),
  ('10000000-0000-4000-8000-000000000753', '10000000-0000-4000-8000-000000000611', '10000000-0000-4000-8000-000000000704', 'Extractor de rodamientos, multímetro, juego de dados.')
on conflict (id) do update set
  orden_trabajo_id = excluded.orden_trabajo_id,
  ficha_mantenimiento_id = excluded.ficha_mantenimiento_id,
  descripcion = excluded.descripcion;

insert into public.materiales_mantenimiento (id, orden_trabajo_id, ficha_mantenimiento_id, descripcion, cantidad)
values
  ('10000000-0000-4000-8000-000000000761', '10000000-0000-4000-8000-000000000609', '10000000-0000-4000-8000-000000000702', 'Trapo industrial y desengrasante dieléctrico.', 1),
  ('10000000-0000-4000-8000-000000000762', '10000000-0000-4000-8000-000000000610', '10000000-0000-4000-8000-000000000703', 'Limpiador industrial para quemador.', 1),
  ('10000000-0000-4000-8000-000000000763', '10000000-0000-4000-8000-000000000611', '10000000-0000-4000-8000-000000000704', 'Lubricante de montaje.', 1)
on conflict (id) do update set
  orden_trabajo_id = excluded.orden_trabajo_id,
  ficha_mantenimiento_id = excluded.ficha_mantenimiento_id,
  descripcion = excluded.descripcion,
  cantidad = excluded.cantidad;

insert into public.evidencias_mantenimiento (
  id,
  orden_trabajo_id,
  ficha_mantenimiento_id,
  tipo,
  descripcion,
  archivo_url
)
values
  ('10000000-0000-4000-8000-000000000771', '10000000-0000-4000-8000-000000000609', '10000000-0000-4000-8000-000000000702', 'FOTO_ANTES', 'Foto antes del PM del compresor.', 'https://placehold.co/900x600/png?text=Antes+Compresor'),
  ('10000000-0000-4000-8000-000000000772', '10000000-0000-4000-8000-000000000609', '10000000-0000-4000-8000-000000000702', 'FOTO_DURANTE', 'Foto durante limpieza y verificación.', 'https://placehold.co/900x600/png?text=Durante+PM+Compresor'),
  ('10000000-0000-4000-8000-000000000773', '10000000-0000-4000-8000-000000000609', '10000000-0000-4000-8000-000000000702', 'FOTO_DESPUES', 'Foto final equipo operativo.', 'https://placehold.co/900x600/png?text=Despues+Compresor'),
  ('10000000-0000-4000-8000-000000000774', '10000000-0000-4000-8000-000000000610', '10000000-0000-4000-8000-000000000703', 'FOTO_DESPUES', 'Caldera luego de limpieza.', 'https://placehold.co/900x600/png?text=Caldera+Limpieza'),
  ('10000000-0000-4000-8000-000000000775', '10000000-0000-4000-8000-000000000611', '10000000-0000-4000-8000-000000000704', 'FOTO_ANTES', 'Ventilador axial con rodamiento dañado.', 'https://placehold.co/900x600/png?text=Condensador+Falla'),
  ('10000000-0000-4000-8000-000000000776', '10000000-0000-4000-8000-000000000608', '10000000-0000-4000-8000-000000000701', 'FOTO_DESPUES', 'Detector de metales calibrado.', 'https://placehold.co/900x600/png?text=Detector+Calibrado')
on conflict (id) do update set
  orden_trabajo_id = excluded.orden_trabajo_id,
  ficha_mantenimiento_id = excluded.ficha_mantenimiento_id,
  tipo = excluded.tipo,
  descripcion = excluded.descripcion,
  archivo_url = excluded.archivo_url;

-- =========================================================
-- 7) Historial del expediente
-- =========================================================

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
  ('10000000-0000-4000-8000-000000000781', '10000000-0000-4000-8000-000000000408', '10000000-0000-4000-8000-000000000408', '10000000-0000-4000-8000-000000000608', '10000000-0000-4000-8000-000000000701', current_date - 1, 'INSPECCION', 'Ficha FM-2026-D001 validada por supervisor.', 'CERRADA'),
  ('10000000-0000-4000-8000-000000000782', '10000000-0000-4000-8000-000000000401', '10000000-0000-4000-8000-000000000401', '10000000-0000-4000-8000-000000000609', '10000000-0000-4000-8000-000000000702', current_date - 18, 'PREVENTIVO', 'PM compresor principal cerrado con ficha FM-2026-D002.', 'CERRADA'),
  ('10000000-0000-4000-8000-000000000783', '10000000-0000-4000-8000-000000000404', '10000000-0000-4000-8000-000000000404', '10000000-0000-4000-8000-000000000610', '10000000-0000-4000-8000-000000000703', current_date - 42, 'PREVENTIVO', 'PM caldera cerrado con ficha FM-2026-D003.', 'CERRADA'),
  ('10000000-0000-4000-8000-000000000784', '10000000-0000-4000-8000-000000000407', '10000000-0000-4000-8000-000000000407', '10000000-0000-4000-8000-000000000611', '10000000-0000-4000-8000-000000000704', current_date - 15, 'CORRECTIVO', 'Correctivo condensador cerrado con recomendación de repuesto.', 'CERRADA')
on conflict (id) do update set
  equipo_id = excluded.equipo_id,
  activo_id = excluded.activo_id,
  orden_trabajo_id = excluded.orden_trabajo_id,
  ficha_mantenimiento_id = excluded.ficha_mantenimiento_id,
  fecha = excluded.fecha,
  tipo_mantenimiento = excluded.tipo_mantenimiento,
  descripcion = excluded.descripcion,
  estado = excluded.estado;

notify pgrst, 'reload schema';

-- Resultado esperado aproximado en dashboard, considerando solo esta semilla:
-- Equipos totales: +8
-- OT pendientes: +8
-- PM del mes: +5
-- PM vencidos: +3
-- Equipos fuera de servicio: +1
-- Disponibilidad: 75.0% si solo existen estos 8 equipos
-- Correctivos: +4
-- Preventivos: +5
