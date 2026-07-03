# Reglas de Negocio – Proyecto WU Beta v0.9

## RN-001: Generación automática de ficha

El usuario no llenará una ficha PDF manualmente.

El técnico registrará la información mediante un formulario web y el sistema generará automáticamente la ficha de mantenimiento en PDF.

---

## RN-002: Plantilla estándar

La ficha de mantenimiento tendrá una plantilla estándar para todos los equipos de planta.

La plantilla incluirá información mecánica, eléctrica, refrigeración, instrumentación y actividades generales.

---

## RN-003: Secciones sin información

La ficha PDF siempre mantendrá su estructura completa.

Cuando una sección no tenga datos registrados, deberá mostrarse el mensaje:

**No se registró información.**

Ejemplos:

- Repuestos: No se registró uso de repuestos o materiales.
- Evidencias: No se registraron fotografías.
- Hallazgos: No se registraron hallazgos.
- Recomendaciones: No se registraron recomendaciones.

---

## RN-004: Trazabilidad

Cada ficha tendrá un código único.

Ejemplo:

FM-2026-000001

---

## RN-005: Almacenamiento

El sistema guardará:

1. Los datos estructurados del mantenimiento.
2. Las fotografías cargadas.
3. El PDF generado.
4. El historial asociado al activo.

---

## RN-006: QR de ficha

Cada ficha PDF tendrá un QR que permitirá acceder al registro digital de la ficha dentro del sistema.
