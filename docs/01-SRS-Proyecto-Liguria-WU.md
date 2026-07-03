# SRS – Proyecto Liguria WU
## Sistema Integral de Gestión de Activos y Mantenimiento

### 1. Objetivo del sistema

Desarrollar una plataforma web para registrar, consultar y gestionar la información de activos, equipos, fichas técnicas, mantenimientos, evidencias fotográficas, documentación técnica y programa anual de mantenimiento.

---

### 2. Usuarios del sistema

#### Administrador
Puede:
- Crear usuarios.
- Crear empresas, plantas, áreas y ubicaciones.
- Registrar equipos.
- Subir documentación técnica.
- Ver reportes.
- Descargar fichas.
- Gestionar el programa anual.

#### Técnico
Puede:
- Iniciar sesión.
- Buscar o escanear un equipo.
- Registrar mantenimiento.
- Subir fotos.
- Ver historial básico del equipo.

#### Supervisor
Puede:
- Revisar mantenimientos.
- Aprobar fichas.
- Ver pendientes.
- Descargar reportes.

#### Consulta
Puede:
- Ver información.
- Descargar documentos autorizados.
- No puede editar.

---

### 3. Módulos del MVP

#### 3.1 Login
Ingreso mediante usuario y contraseña.

#### 3.2 Dashboard
Vista general del sistema:
- Equipos totales.
- Mantenimientos del mes.
- Pendientes.
- Vencidos.
- Equipos fuera de servicio.

#### 3.3 Gestión de Activos
Registro y consulta de equipos:
- Código único.
- QR.
- Planta.
- Área.
- Ubicación.
- Marca.
- Modelo.
- Serie.
- Estado.
- Criticidad.
- Foto principal.

#### 3.4 Documentación Técnica
Permite subir documentos del proveedor o fabricante:
- Ficha técnica del fabricante.
- Manual de operación.
- Manual de mantenimiento.
- Plano eléctrico.
- Plano mecánico.
- Catálogo.
- Certificado.
- Garantía.
- Orden de compra.

#### 3.5 Registro de Mantenimiento
El técnico registra:
- Equipo.
- Fecha.
- Tipo de mantenimiento.
- Especialidad: mecánico, eléctrico u otro.
- Actividades realizadas.
- Observaciones.
- Recomendaciones.
- Estado del equipo.
- Fotos de evidencia.

#### 3.6 Historial por Equipo
Cada equipo debe mostrar:
- Mantenimientos anteriores.
- Documentos cargados.
- Fotos.
- Fichas descargables.
- Estado histórico.

#### 3.7 Programa Anual de Mantenimiento
Vista tipo Gantt:
- Por planta.
- Por equipo.
- Por mes.
- Por especialidad.
- Exportable a Excel y PDF.

---

### 4. Flujo principal

Administrador crea equipo  
→ sube documentación técnica  
→ programa mantenimiento anual  
→ técnico ingresa con usuario  
→ escanea QR o busca equipo  
→ registra mantenimiento  
→ sube fotos  
→ sistema guarda historial  
→ administrador descarga ficha o reporte  

---

### 5. Alcance inicial

El MVP debe permitir:

- Login.
- Dashboard.
- Registro de equipos.
- Carga de documentos PDF.
- Registro de mantenimiento.
- Subida de fotografías.
- Historial por equipo.
- Programa anual.
- Descarga de fichas.