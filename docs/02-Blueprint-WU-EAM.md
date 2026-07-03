# Blueprint – Proyecto WU
## Proyecto Liguria WU

### 1. Visión del sistema

Proyecto WU será una plataforma web para gestionar el ciclo de vida de los activos industriales: registro, documentación técnica, mantenimiento, historial, programa anual, evidencias, reportes e indicadores.

---

### 2. Módulos principales

1. Administración
2. Gestión de Activos
3. Expediente Digital del Activo
4. Documentación Técnica
5. Registro de Mantenimiento
6. Programa Anual / Gantt
7. Historial por Equipo
8. Reportes y Descargas
9. Usuarios y Roles
10. Configuración

---

### 3. Roles

#### Administrador
Acceso total al sistema.

#### Supervisor
Revisa, aprueba y consulta mantenimientos.

#### Técnico
Registra mantenimientos, sube fotos y consulta información básica.

#### Consulta
Solo visualiza información autorizada.

---

### 4. Flujo general

Administrador registra activo  
→ sube ficha técnica del fabricante  
→ carga documentos y fotos  
→ programa mantenimiento anual  
→ técnico escanea QR o busca equipo  
→ registra mantenimiento  
→ sube evidencias  
→ supervisor revisa  
→ sistema actualiza historial  
→ administrador descarga reportes  

---

### 5. Expediente digital del activo

Cada activo tendrá una vista 360° con:

- Información interna del activo
- Documentación técnica del fabricante
- Galería fotográfica
- Componentes
- Mantenimientos realizados
- Programa anual
- Historial
- Indicadores
- QR
- Descargas

---

### 6. Documentación técnica

Tipos de documentos:

- Ficha técnica del fabricante
- Manual de operación
- Manual de mantenimiento
- Plano eléctrico
- Plano mecánico
- Catálogo
- Certificado
- Garantía
- Orden de compra
- Acta de recepción

Cada documento deberá registrar:

- Equipo asociado
- Tipo de documento
- Nombre
- Archivo PDF
- Versión
- Fecha de carga
- Usuario que cargó
- Observaciones

---

### 7. Registro de mantenimiento

El técnico podrá registrar:

- Equipo
- Fecha
- Tipo: preventivo, correctivo o predictivo
- Especialidad: mecánico, eléctrico u otra
- Actividades realizadas
- Observaciones
- Recomendaciones
- Estado final del equipo
- Evidencias fotográficas
- PDF generado

---

### 8. Programa anual

El sistema permitirá visualizar el plan anual como Gantt:

- Por planta
- Por área
- Por equipo
- Por especialidad
- Por mes
- Por estado

Estados:

- Programado
- Ejecutado
- Vencido
- Reprogramado

Debe permitir exportar a:

- Excel
- PDF

---

### 9. Pantallas MVP

1. Login
2. Dashboard
3. Gestión de Activos
4. Registro de Activo
5. Expediente del Activo
6. Documentación Técnica
7. Nuevo Mantenimiento
8. Historial del Equipo
9. Programa Anual
10. Reportes
11. Usuarios
12. Configuración

---

### 10. Tecnologías

- Next.js
- TypeScript
- Tailwind CSS
- Supabase
- PostgreSQL
- Supabase Auth
- Supabase Storage
- Vercel
