# Arquitectura de Datos en Redis - Gestión de Conductores (Real-Time)

Este documento contiene la especificación de las estructuras de datos utilizadas en Upstash Redis para gestionar el estado, la ubicación en tiempo real y la disponibilidad de los conductores de forma concurrente.

---

## 1. Perfil y Estado del Conductor (Hash)
Almacena la información de identidad, datos del vehículo y el estado de disponibilidad actual del conductor.

* **Tipo de dato:** `HASH`
* **Patrón de Clave:** `tower:profile:{user_id}`
* **Campos (Fields):**
  * `clerk_id` (String): ID único del usuario en Clerk.
  * `status` (String): Estado operativo actual. Valores: `"available"` o `"unavailable"`.
  * `vehicle` (String/JSON): Objeto JSON serializado con los datos del vehículo (ej: `{"plate":"ABC-123","model":"Toyota Corolla"}`).

### Comandos de Referencia:
```bash
# Registrar o actualizar perfil completo (al iniciar sesión o conectarse)
HSET tower:profile:tower_123 clerk_id "user_clk_987" status "available" vehicle "{\"plate\":\"ABC-123\",\"model\":\"Toyota Corolla\"}"

# Cambiar únicamente el estado (ej: al aceptar un viaje)
HSET tower:profile:tower_123 status "unavailable"
```

---

## 2. Índice Geoespacial de Conductores Activos (GeoSet)
Estructura global indexada que contiene a **todos los conductores disponibles en tiempo real**. Se utiliza para resolver de forma eficiente las búsquedas por cercanía desde la aplicación del cliente.

* **Tipo de dato:** `GEOSET` (Sorted Set administrado mediante comandos `GEO`)
* **Clave Única:** `towers:locations:available`
* **Miembro (Member):** `{user_id}` (El ID del usuario actúa como identificador único dentro del mapa).

### Comandos de Referencia:
```bash
# Actualizar coordenadas del conductor (Se ejecuta recurrentemente cada 5-10 segundos)
GEOADD towers:locations:available -58.3816 -34.6037 "tower_123"

# Remover al conductor del mapa (Cuando cambia a "no_disponible" o se desconecta)
ZREM towers:locations:available "tower_123"

# Buscar conductores en un radio de 3km alrededor de un pasajero
GEOSEARCH towers:locations:available FROMLONLAT -58.3816 -34.6037 BYRADIUS 3 km WITHDIST
```

---

## 3. Control de Presencia / Heartbeat (String con TTL)
Dado que los elementos individuales de un GeoSet no soportan un tiempo de expiración (TTL) propio, se utiliza una clave independiente por usuario como mecanismo de control. Si la app del conductor deja de emitir señal, esta clave expira de forma automática, marcando al usuario como desconectado.

* **Tipo de dato:** `STRING`
* **Patrón de Clave:** `tower:heartbeat:{user_id}`
* **Valor:** `"1"` (Valor estático/dummy)
* **Tiempo de Vida (TTL):** 30 segundos (Se extiende con cada actualización de ubicación).

### Comandos de Referencia:
```bash
# Crear o renovar la presencia del conductor por 30 segundos
SET tower:heartbeat:tower_123 "1" EX 30

# Verificar si el conductor sigue en línea (Antes de asignarle un viaje)
EXISTS tower:heartbeat:tower_123

# Forzar eliminación inmediata (Desconexión voluntaria / Logout)
DEL tower:heartbeat:tower_123
```

---

## Reglas de Negocio para la Implementación

1. **Pipeline de Actualización Rutinaria:** Cada vez que el cliente móvil del conductor envíe su ubicación en segundo plano, el backend debe ejecutar en un único **Pipeline** de Redis:
   * `GEOADD towers:locations:available <lon> <lat> <tower_id>`
   * `SET tower:heartbeat:<tower_id> "1" EX 30`
   * `HSET tower:profile:<tower_id> status "available"` (Para asegurar consistencia).

2. **Consistencia en Baja:** Si el estado del conductor pasa a `"unavailable"`, se debe remover inmediatamente del GeoSet usando `ZREM` para evitar que figure en las búsquedas de los pasajeros.

3. **Estrategia de Limpieza Pasiva (Lazy Cleanup):** Al ejecutar un `GEOSEARCH` para un pasajero, el backend recibirá una lista de IDs de conductores cercanos. Antes de responder al cliente, se debe validar la existencia de `tower:heartbeat:{id}` para cada uno de ellos. Si el heartbeat de un ID ya no existe, el backend debe excluirlo del resultado enviado al pasajero y disparar un comando `ZREM towers:locations:available {id}` en segundo plano para limpiar el GeoSet de registros huérfanos.

---

## 4. Solicitudes de Viaje Pendientes (Hash con TTL)
Almacena los detalles de una solicitud de viaje hecha por un cliente, mientras se busca o asigna una torre. Se utiliza para el seguimiento del estado por parte de la Customer App.

*   **Tipo de dato:** `HASH`
*   **Patrón de Clave:** `trip:request:{trip_id}`
*   **Campos (Fields):**
    *   `customer_id` (String): ID único del cliente que realizó la solicitud.
    *   `trip_id` (String): ID único del viaje.
    *   `trip_origin_lat` (String): Latitud del origen del viaje.
    *   `trip_origin_long` (String): Longitud del origen del viaje.
    *   `trip_destination_lat` (String): Latitud del destino del viaje.
    *   `trip_destination_long` (String): Longitud del destino del viaje.
    *   `vehicle_brand` (String): Marca del vehículo solicitado.
    *   `vehicle_model` (String): Modelo del vehículo solicitado.
    *   `vehicle_year` (Number): Año del vehículo solicitado.
    *   `preferred_tow_type` (String): Tipo de remolque preferido.
    *   `status` (String): Estado actual de la solicitud. Valores posibles: `"pending"`, `"accepted"`, `"cancelled"`, `"completed"`.
    *   `tower_clerk_id` (String, opcional): ID de Clerk de la torre asignada (se añade si la solicitud es `accepted`).
    *   `tower_location_lat` (String, opcional): Latitud de la torre asignada (se añade si la solicitud es `accepted`).
    *   `tower_location_long` (String, opcional): Longitud de la torre asignada (se añade si la solicitud es `accepted`).
*   **Tiempo de Vida (TTL):** 300 segundos (5 minutos). La solicitud expira si no es procesada o cancelada.

### Comandos de Referencia:
```bash
# Crear o actualizar una solicitud de viaje
HSET trip:request:trip_ABCDEF customer_id "cust_123" trip_id "trip_ABCDEF" status "pending" ...
EXPIRE trip:request:trip_ABCDEF 300

# Obtener el estado de una solicitud
HGETALL trip:request:trip_ABCDEF

# Actualizar el estado de una solicitud (ej. a "accepted" por una torre)
HSET trip:request:trip_ABCDEF status "accepted" tower_clerk_id "tower_123" tower_location_lat "-38.7100" tower_location_long "-62.2600"

# Eliminar una solicitud (ej. si se cancela o completa)
DEL trip:request:trip_ABCDEF
```
