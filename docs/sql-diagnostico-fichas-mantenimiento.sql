-- Proyecto WU - Diagnóstico de fichas_mantenimiento
-- Ejecuta esto en Supabase y pásame el resultado.

select
  c.column_name,
  c.data_type,
  c.is_nullable,
  c.column_default
from information_schema.columns c
where c.table_schema = 'public'
  and c.table_name = 'fichas_mantenimiento'
order by c.ordinal_position;

select
  conname,
  pg_get_constraintdef(oid) as constraint_definition
from pg_constraint
where conrelid = 'public.fichas_mantenimiento'::regclass
order by conname;

select distinct tipo
from public.fichas_mantenimiento
order by tipo;
