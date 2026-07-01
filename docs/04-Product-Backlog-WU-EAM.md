# Product Backlog – WU EAM
## Proyecto Liguria WU

## Épica 1: Plataforma base

### PB-001: Layout principal
Como usuario, quiero tener un menú lateral y encabezado para navegar por el sistema.

Prioridad: Alta  
Estado: En proceso

### PB-002: Login
Como usuario, quiero ingresar con usuario y contraseña.

Prioridad: Alta  
Estado: Pendiente

### PB-003: Roles de usuario
Como administrador, quiero asignar roles para controlar permisos.

Roles:
- Administrador
- Supervisor
- Técnico
- Consulta

Prioridad: Alta  
Estado: Pendiente

---

## Épica 2: Organización

### PB-004: Gestión de empresas
Registrar empresa cliente.

Prioridad: Alta

### PB-005: Gestión de ubicaciones
Registrar estructura:
Empresa → Planta → Área → Subárea → Ubicación.

Prioridad: Alta

---

## Épica 3: Gestión de activos

### PB-006: Registro de activo
Como administrador, quiero registrar un activo con código único.

Campos:
- Código
- Nombre
- Familia
- Ubicación
- Marca
- Modelo
- Serie
- Estado
- Criticidad
- Foto principal

Prioridad: Muy alta

### PB-007: Generación de QR
Como administrador, quiero generar un QR por activo.

Prioridad: Alta

### PB-008: Expediente digital del activo
Como usuario, quiero ver toda la información del activo en una sola pantalla.

Pestañas:
- Información
- Documentación técnica
- Componentes
- Mantenimientos
- Programa anual
- Fotografías
- Indicadores
- QR

Prioridad: Muy alta

---

## Épica 4: Documentación técnica

### PB-009: Subir ficha técnica del fabricante
Como administrador, quiero subir el PDF de ficha técnica del proveedor.

Prioridad: Muy alta

### PB-010: Subir manuales y planos
Como administrador, quiero subir manuales, planos, certificados y garantías.

Prioridad: Alta

### PB-011: Descargar documentos
Como usuario autorizado, quiero visualizar y descargar documentos técnicos.

Prioridad: Alta

---

## Épica 5: Mantenimiento

### PB-012: Registro de mantenimiento
Como técnico, quiero llenar una ficha desde la web.

Campos:
- Activo
- Fecha
- Tipo
- Especialidad
- Actividades realizadas
- Observaciones
- Recomendaciones
- Estado final
- Fotos

Prioridad: Muy alta

### PB-013: Evidencias fotográficas
Como técnico, quiero subir fotos del mantenimiento.

Prioridad: Alta

### PB-014: Historial por activo
Como usuario, quiero ver todos los mantenimientos anteriores por equipo.

Prioridad: Muy alta

### PB-015: Descargar ficha de mantenimiento
Como administrador, quiero descargar la ficha en PDF.

Prioridad: Alta

---

## Épica 6: Programa anual

### PB-016: Cargar programa anual
Como administrador, quiero programar mantenimientos por activo.

Prioridad: Muy alta

### PB-017: Ver Gantt anual
Como usuario, quiero ver el programa anual en vista Gantt.

Prioridad: Muy alta

### PB-018: Exportar Gantt
Como administrador, quiero descargar el programa anual en Excel y PDF.

Prioridad: Alta

---

## Épica 7: Dashboard

### PB-019: Dashboard operacional
Como administrador, quiero ver indicadores principales.

Indicadores:
- Equipos totales
- PM del mes
- Pendientes
- Vencidos
- Equipos fuera de servicio
- Disponibilidad

Prioridad: Alta

---

## MVP inicial

El MVP debe incluir:

1. Login
2. Dashboard
3. Gestión de activos
4. Expediente digital
5. Documentación técnica PDF
6. Registro de mantenimiento
7. Historial por activo
8. Programa anual tipo Gantt
9. Exportación PDF/Excel