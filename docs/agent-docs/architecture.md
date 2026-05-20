# Arquitectura del Sistema - Tower App

## 1. Contexto del Sistema (Microservicios / Apps Autónomas)
La plataforma completa está dividida en 4 subaplicaciones independientes que se comunican entre sí mediante APIs REST externas:
1. **Customer App:** Gestión de clientes y solicitudes de auxilio.
2. **Tower App (Nuestra Aplicación):** Gestión de choferes, grúas, disponibilidad y aceptación de viajes.
3. **Feedback App:** Sistema de calificaciones y reportes.
4. **Payments App:** Procesamiento de pagos y tarifas.

## 2. Límites del Dominio (Responsabilidades de la Driver App)
Nuestra aplicación se encarga estrictamente de:
- Autenticación, perfiles y documentación legal de los Choferes (`Towers`).
- Registro y estado de los Vehículos/Grúas (`Tows`).
- Gestión del estado del chofer (Disponible, Ocupado, Fuera de Servicio).
- Recepción de alertas de servicio y flujo de aceptación/rechazo de un viaje.
Sin embargo, la aplicación como tal solamente almacena datos pertinentes a los usuarios principales de la app (towers), sus vehículos asociados, asignaciones viaje-conductor y usuarios administradores. El resto de datos deberán ser solicitados de las otras aplicaciones.

## 3. Estrategia de Almacenamiento Dual (Postgres vs. Redis)
Para maximizar el rendimiento y evitar escrituras costosas en disco, dividimos los datos del dominio en dos capas:

### A. Capa de Persistencia (Neon + Prisma)
Se utiliza para datos estructurados, históricos y de negocio que requieren transaccionalidad ACID.
- Perfiles de los choferes, contraseñas, datos bancarios.
- Información estática de las grúas (patente, modelo, tipo de carga).
- Historial de viajes finalizados y auditorías.

### B. Capa de Memoria Rápida Efímera (Upstash Redis)
Se utiliza exclusivamente para datos de alta frecuencia de lectura/escritura que cambian en tiempo real y no requieren almacenamiento a largo plazo.
- **Estado de Disponibilidad (`status`):** Si el chofer está `AVAILABLE`, `OCCUPIED` u `OFFLINE`.
- **Geolocalización en tiempo real (`location`):** Coordenadas latitud/longitud actuales del chofer durante su guardia o durante un viaje activo.

## 4. Estrategia de Comunicación e Intercambio de Datos

### A. Comunicación Interna (Dentro de la Tower App)
- **Frontend hacia Backend:** Se debe priorizar el uso de **Next.js Server Actions** para mutaciones de datos (formularios, cambios de estado, acciones del chofer).
- **Componentes:** Los componentes del cliente (`"use client"`) invocarán Server Actions para interactuar de forma segura con la base de datos a través de Prisma.

### B. Comunicación Externa (Hacia otras Subaplicaciones)
Cuando la Driver App necesite información de los otros módulos, realizará llamadas HTTP tradicionales (`fetch`) a los endpoints expuestos por las otras apps:
- **Hacia Customer App:** Obtener detalles del cliente que solicita la grúa.
- **Hacia Feedback App:** Obtener las calificaciones del cliente actualmente en viaje y cada cliente en las entradas del historial de viajes.
- **Hacia Payments App:** Consultar historial de liquidaciones y detalles de tickets.

Nuestra app también expondrá endpoints de API públicos (bajo `/app/api/`) para que las demás subaplicaciones consulten diversa información sobre los towers.

## 5. Estructura del Directorio (Raíz del Proyecto)
Se debe respetar estrictamente la convención de carpetas del App Router de Next.js en la raíz (sin directorio `src/`):

- `app/` -> Rutas, páginas, layouts y endpoints de API públicos.
    - `app/api/` -> Endpoints públicos expuestos para Customer, Payments y Feedback.
    - `app/actions/` -> Archivos dedicados exclusivamente a las Server Actions del negocio.
- `components/` -> Componentes UI reutilizables (Botones, Modales, Tarjetas).
- `docs/` -> Documentación de contexto para la IA.
- `lib/` -> Instancias centralizadas de clientes (`prisma.ts` y `redis.ts`).
- `prisma/` -> Archivo `schema.prisma` y migraciones.