# Documentación de la API

Este documento detalla los endpoints implementados en el sistema para la gestión de administración.

## Autenticación de APIs de Administración (prefijo `/api/tower/`)

Las APIs bajo el prefijo `/api/tower/` (gestionando Towers, Administradores, Vehículos y Asignaciones) están diseñadas para ser utilizadas por otros backends. Requieren una clave API válida enviada en el encabezado `x-api-key`.

**Ejemplo de Encabezado de Autorización:**
```
x-api-key: your_admin_api_key_here
```
Si la clave API no es válida o no se proporciona, la API devolverá una respuesta `403 Forbidden`.

---

## Endpoints Implementados de Administración (`/api/tower/`)

*(Estos endpoints corresponden a la gestión de recursos de administración y han sido actualizados para usar autenticación por API Key. Las respuestas de error `403 Forbidden` son genéricas para la clave API.)*

### Endpoints de Towers

#### `GET /api/tower/towers`
Obtiene una lista de todas las Towers registradas en el sistema.
- **Requiere:** Clave API de administrador válida.
- **Cabeceras:** `x-api-key: <TU_CLAVE_API>`
- **Respuesta Exitosa (200 OK):**
  ```json
  {
    "success": true,
    "data": [
      {
        "tower_id": "cll2f4j2m00003z4l9v7m0s4s",
        "clerk_id": "user_abc123",
        "email": "tower1@example.com",
        "full_name": "Tower One",
        "payments_alias": null,
        "createdAt": "2023-01-01T12:00:00.000Z",
        "updatedAt": "2023-01-01T12:00:00.000Z"
      }
    ]
  }
  ```
- **Errores:**
  - `403 Forbidden`: `{"success": false, "error": "No autorizado. Se requiere una clave API válida."}`
  - `500 Internal Server Error`: `{"success": false, "error": "Error al obtener la lista de Towers."}`

#### `GET /api/tower/towers/[id]`
Obtiene los detalles de una Tower específica por su `tower_id`.
- **Requiere:** Clave API de administrador válida.
- **Cabeceras:** `x-api-key: <TU_CLAVE_API>`
- **Parámetros de Ruta:**
  - `id` (string, requerido): El `tower_id` de la Tower.
- **Respuesta Exitosa (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "tower_id": "cll2f4j2m00003z4l9v7m0s4s",
      "clerk_id": "user_abc123",
      "email": "tower1@example.com",
      "full_name": "Tower One",
      "payments_alias": null,
      "createdAt": "2023-01-01T12:00:00.000Z",
      "updatedAt": "2023-01-01T12:00:00.000Z"
    }
  }
  ```
- **Errores:**
  - `403 Forbidden`: `{"success": false, "error": "No autorizado. Se requiere una clave API válida."}`
  - `404 Not Found`: `{"success": false, "error": "Tower no encontrada."}`
  - `500 Internal Server Error`: `{"success": false, "error": "Error al obtener la Tower."}`

#### `POST /api/tower/towers`
Crea una nueva Tower en Clerk y en la base de datos de Prisma.
- **Requiere:** Clave API de administrador válida.
- **Cabeceras:** `x-api-key: <TU_CLAVE_API>`
- **Cuerpo de la Solicitud (application/json):**
  ```json
  {
    "firstName": "Nuevo",
    "lastName": "Tower",
    "emailAddress": "new.tower@example.com",
    "password": "SecurePassword123!"
  }
  ```
- **Respuesta Exitosa (201 Created):**
  ```json
  {
    "success": true,
    "data": {
      "tower_id": "cll2f4j2m00003z4l9v7m0s4s",
      "clerk_id": "user_new_clerk_id",
      "email": "new.tower@example.com",
      "full_name": "Nuevo Tower",
      "payments_alias": null,
      "createdAt": "2023-01-01T12:00:00.000Z",
      "updatedAt": "2023-01-01T12:00:00.000Z"
    }
  }
  ```
- **Errores:**
  - `403 Forbidden`: `{"success": false, "error": "No autorizado. Se requiere una clave API válida."}`
  - `400 Bad Request`: `{"success": false, "error": "Faltan campos obligatorios: firstName, lastName, emailAddress, password."}`
  - `500 Internal Server Error`: `{"success": false, "error": "Error desconocido al crear Tower."}` (o un mensaje de error más específico de Clerk)

#### `PUT /api/tower/towers/[id]`
Actualiza los detalles de una Tower existente por su `tower_id`.
- **Requiere:** Clave API de administrador válida.
- **Cabeceras:** `x-api-key: <TU_CLAVE_API>`
- **Parámetros de Ruta:**
  - `id` (string, requerido): El `tower_id` de la Tower a actualizar.
- **Cuerpo de la Solicitud (application/json):** (Algunos campos son opcionales)
  ```json
  {
    "full_name": "Nombre Actualizado",
    "email": "updated.tower@example.com",
    "payments_alias": "alias_pago_nuevo"
  }
  ```
- **Respuesta Exitosa (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "tower_id": "cll2f4j2m00003z4l9v7m0s4s",
      "clerk_id": "user_abc123",
      "email": "updated.tower@example.com",
      "full_name": "Nombre Actualizado",
      "payments_alias": "alias_pago_nuevo",
      "createdAt": "2023-01-01T12:00:00.000Z",
      "updatedAt": "2023-01-01T12:00:00.000Z"
    }
  }
  ```
- **Errores:**
  - `403 Forbidden`: `{"success": false, "error": "No autorizado. Se requiere una clave API válida."}`
  - `404 Not Found`: `{"success": false, "error": "Tower no encontrada en la base de datos."}`
  - `500 Internal Server Error`: `{"success": false, "error": "Error al actualizar la Tower."}`

#### `DELETE /api/tower/towers/[id]`
Elimina una Tower por su `tower_id` y su usuario asociado en Clerk.
- **Requiere:** Clave API de administrador válida.
- **Cabeceras:** `x-api-key: <TU_CLAVE_API>`
- **Parámetros de Ruta:**
  - `id` (string, requerido): El `tower_id` de la Tower a eliminar.
- **Respuesta Exitosa (200 OK):**
  ```json
  {
    "success": true
  }
  ```
- **Errores:**
  - `403 Forbidden`: `{"success": false, "error": "No autorizado. Se requiere una clave API válida."}`
  - `404 Not Found`: `{"success": false, "error": "Tower no encontrada."}`
  - `500 Internal Server Error`: `{"success": false, "error": "Error al eliminar la Tower."}`

### Endpoints de Administradores

#### `GET /api/tower/admins`
Obtiene una lista de todos los Administradores registrados en el sistema.
- **Requiere:** Clave API de administrador válida.
- **Cabeceras:** `x-api-key: <TU_CLAVE_API>`
- **Respuesta Exitosa (200 OK):**
  ```json
  {
    "success": true,
    "data": [
      {
        "admin_id": "cll2f4j2m00003z4l9v7m0s4s",
        "clerk_id": "user_admin_abc",
        "email": "admin1@example.com",
        "full_name": "Admin User One",
        "createdAt": "2023-01-01T12:00:00.000Z",
        "updatedAt": "2023-01-01T12:00:00.000Z"
      }
    ]
  }
  ```
- **Errores:**
  - `403 Forbidden`: `{"success": false, "error": "No autorizado. Se requiere una clave API válida."}`
  - `500 Internal Server Error`: `{"success": false, "error": "Error al obtener la lista de Administradores."}`

#### `GET /api/tower/admins/[id]`
Obtiene los detalles de un Administrador específico por su `admin_id`.
- **Requiere:** Clave API de administrador válida.
- **Cabeceras:** `x-api-key: <TU_CLAVE_API>`
- **Parámetros de Ruta:**
  - `id` (string, requerido): El `admin_id` del Administrador.
- **Respuesta Exitosa (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "admin_id": "cll2f4j2m00003z4l9v7m0s4s",
      "clerk_id": "user_admin_abc",
      "email": "admin1@example.com",
      "full_name": "Admin User One",
      "createdAt": "2023-01-01T12:00:00.000Z",
      "updatedAt": "2023-01-01T12:00:00.000Z"
    }
  }
  ```
- **Errores:**
  - `403 Forbidden`: `{"success": false, "error": "No autorizado. Se requiere una clave API válida."}`
  - `404 Not Found`: `{"success": false, "error": "Administrador no encontrado."}`
  - `500 Internal Server Error`: `{"success": false, "error": "Error al obtener el Administrador."}`

#### `POST /api/tower/admins`
Crea un nuevo Administrador en Clerk y en la base de datos de Prisma.
- **Requiere:** Clave API de administrador válida.
- **Cabeceras:** `x-api-key: <TU_CLAVE_API>`
- **Cuerpo de la Solicitud (application/json):**
  ```json
  {
    "firstName": "Nuevo",
    "lastName": "Admin",
    "emailAddress": "new.admin@example.com",
    "password": "SecurePassword123!"
  }
  ```
- **Respuesta Exitosa (201 Created):**
  ```json
  {
    "success": true,
    "data": {
      "admin_id": "cll2f4j2m00003z4l9v7m0s4s",
      "clerk_id": "user_new_admin_clerk_id",
      "email": "new.admin@example.com",
      "full_name": "Nuevo Admin",
      "createdAt": "2023-01-01T12:00:00.000Z",
      "updatedAt": "2023-01-01T12:00:00.000Z"
    }
  }
  ```
- **Errores:**
  - `403 Forbidden`: `{"success": false, "error": "No autorizado. Se requiere una clave API válida."}`
  - `400 Bad Request`: `{"success": false, "error": "Faltan campos obligatorios: firstName, lastName, emailAddress, password."}`
  - `500 Internal Server Error`: `{"success": false, "error": "Error desconocido al crear Admin."}` (o un mensaje de error más específico de Clerk)

#### `PUT /api/tower/admins/[id]`
Actualiza los detalles de un Administrador existente por su `admin_id`.
- **Requiere:** Clave API de administrador válida.
- **Cabeceras:** `x-api-key: <TU_CLAVE_API>`
- **Parámetros de Ruta:**
  - `id` (string, requerido): El `admin_id` del Administrador a actualizar.
- **Cuerpo de la Solicitud (application/json):** (Algunos campos son opcionales)
  ```json
  {
    "full_name": "Admin Actualizado",
    "email": "updated.admin@example.com"
  }
  ```
- **Respuesta Exitosa (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "admin_id": "cll2f4j2m00003z4l9v7m0s4s",
      "clerk_id": "user_admin_abc",
      "email": "updated.admin@example.com",
      "full_name": "Admin Actualizado",
      "createdAt": "2023-01-01T12:00:00.000Z",
      "updatedAt": "2023-01-01T12:00:00.000Z"
    }
  }
  ```
- **Errores:**
  - `403 Forbidden`: `{"success": false, "error": "No autorizado. Se requiere una clave API válida."}`
  - `404 Not Found`: `{"success": false, "error": "Administrador no encontrado en la base de datos."}`
  - `500 Internal Server Error`: `{"success": false, "error": "Error al actualizar el administrador."}`

#### `DELETE /api/tower/admins/[id]`
Elimina un Administrador por su `admin_id` y su usuario asociado en Clerk.
- **Requiere:** Clave API de administrador válida.
- **Cabeceras:** `x-api-key: <TU_CLAVE_API>`
- **Parámetros de Ruta:**
  - `id` (string, requerido): El `admin_id` del Administrador a eliminar.
- **Respuesta Exitosa (200 OK):**
  ```json
  {
    "success": true
  }
  ```
- **Errores:**
  - `403 Forbidden`: `{"success": false, "error": "No autorizado. Se requiere una clave API válida."}`
  - `404 Not Found`: `{"success": false, "error": "Administrador no encontrado."}`
  - `500 Internal Server Error`: `{"success": false, "error": "Error al eliminar el administrador."}`

### Endpoints de Vehículos

#### `GET /api/tower/vehicles`
Obtiene una lista de todos los Vehículos registrados en el sistema.
- **Requiere:** Clave API de administrador válida.
- **Cabeceras:** `x-api-key: <TU_CLAVE_API>`
- **Respuesta Exitosa (200 OK):**
  ```json
  {
    "success": true,
    "data": [
      {
        "vehicle_id": "uuid-vehicle-1",
        "brand": "Ford",
        "model": "F-150",
        "year": 2020,
        "max_load": 1500.0,
        "tower_id": "cll2f4j2m00003z4l9v7m0s4s",
        "createdAt": "2023-01-01T12:00:00.000Z",
        "updatedAt": "2023-01-01T12:00:00.000Z"
      }
    ]
  }
  ```
- **Errores:**
  - `403 Forbidden`: `{"success": false, "error": "No autorizado. Se requiere una clave API válida."}`
  - `500 Internal Server Error`: `{"success": false, "error": "Error al obtener la lista de Vehículos."}`

#### `GET /api/tower/vehicles/[id]`
Obtiene los detalles de un Vehículo específico por su `vehicle_id`.
- **Requiere:** Clave API de administrador válida.
- **Cabeceras:** `x-api-key: <TU_CLAVE_API>`
- **Parámetros de Ruta:**
  - `id` (string, requerido): El `vehicle_id` del Vehículo.
- **Respuesta Exitosa (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "vehicle_id": "uuid-vehicle-1",
      "brand": "Ford",
      "model": "F-150",
      "year": 2020,
      "max_load": 1500.0,
      "tower_id": "cll2f4j2m00003z4l9v7m0s4s",
      "createdAt": "2023-01-01T12:00:00.000Z",
      "updatedAt": "2023-01-01T12:00:00.000Z"
    }
  }
  ```
- **Errores:**
  - `403 Forbidden`: `{"success": false, "error": "No autorizado. Se requiere una clave API válida."}`
  - `404 Not Found`: `{"success": false, "error": "Vehículo no encontrado."}`
  - `500 Internal Server Error`: `{"success": false, "error": "Error al obtener el vehículo."}`

#### `POST /api/tower/vehicles`
Crea un nuevo Vehículo.
- **Requiere:** Clave API de administrador válida.
- **Cabeceras:** `x-api-key: <TU_CLAVE_API>`
- **Cuerpo de la Solicitud (application/json):**
  ```json
  {
    "brand": "Chevrolet",
    "model": "Silverado",
    "year": 2021,
    "max_load": 2000.0,
    "tower_id": "cll2f4j2m00003z4l9v7m0s4s"
  }
  ```
- **Respuesta Exitosa (201 Created):**
  ```json
  {
    "success": true,
    "data": {
      "vehicle_id": "uuid-new-vehicle",
      "brand": "Chevrolet",
      "model": "Silverado",
      "year": 2021,
      "max_load": 2000.0,
      "tower_id": "cll2f4j2m00003z4l9v7m0s4s",
      "createdAt": "2023-01-01T12:00:00.000Z",
      "updatedAt": "2023-01-01T12:00:00.000Z"
    }
  }
  ```
- **Errores:**
  - `403 Forbidden`: `{"success": false, "error": "No autorizado. Se requiere una clave API válida."}`
  - `400 Bad Request`: `{"success": false, "error": "Faltan campos obligatorios para el vehículo: brand, model, year, max_load, tower_id."}`
  - `404 Not Found`: `{"success": false, "error": "La Tower especificada no existe."}`
  - `500 Internal Server Error`: `{"success": false, "error": "Error desconocido al crear vehículo."}`

#### `PUT /api/tower/vehicles/[id]`
Actualiza los detalles de un Vehículo existente por su `vehicle_id`.
- **Requiere:** Clave API de administrador válida.
- **Cabeceras:** `x-api-key: <TU_CLAVE_API>`
- **Parámetros de Ruta:**
  - `id` (string, requerido): El `vehicle_id` del Vehículo a actualizar.
- **Cuerpo de la Solicitud (application/json):** (Algunos campos son opcionales)
  ```json
  {
    "brand": "GMC",
    "model": "Sierra",
    "max_load": 2200.0,
    "tower_id": "cll2f4j2m00003z4l9v7m0s4s"
  }
  ```
- **Respuesta Exitosa (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "vehicle_id": "uuid-vehicle-1",
      "brand": "GMC",
      "model": "Sierra",
      "year": 2020,
      "max_load": 2200.0,
      "tower_id": "cll2f4j2m00003z4l9v7m0s4s",
      "createdAt": "2023-01-01T12:00:00.000Z",
      "updatedAt": "2023-01-01T12:00:00.000Z"
    }
  }
  ```
- **Errores:**
  - `403 Forbidden`: `{"success": false, "error": "No autorizado. Se requiere una clave API válida."}`
  - `404 Not Found`: `{"success": false, "error": "Vehículo no encontrado."}` o `{"success": false, "error": "La Tower especificada no existe."}`
  - `500 Internal Server Error`: `{"success": false, "error": "Error al actualizar el vehículo."}`

#### `DELETE /api/tower/vehicles/[id]`
Elimina un Vehículo por su `vehicle_id`.
- **Requiere:** Clave API de administrador válida.
- **Cabeceras:** `x-api-key: <TU_CLAVE_API>`
- **Parámetros de Ruta:**
  - `id` (string, requerido): El `vehicle_id` del Vehículo a eliminar.
- **Respuesta Exitosa (200 OK):**
  ```json
  {
    "success": true
  }
  ```
- **Errores:**
  - `403 Forbidden`: `{"success": false, "error": "No autorizado. Se requiere una clave API válida."}`
  - `404 Not Found`: `{"success": false, "error": "Vehículo no encontrado."}`
  - `500 Internal Server Error`: `{"success": false, "error": "Error al eliminar el vehículo."}`

### Endpoints de Asignaciones

#### `GET /api/tower/assignments`
Obtiene una lista de todas las Asignaciones registradas en el sistema.
- **Requiere:** Clave API de administrador válida.
- **Cabeceras:** `x-api-key: <TU_CLAVE_API>`
- **Respuesta Exitosa (200 OK):**
  ```json
  {
    "success": true,
    "data": [
      {
        "assignment_id": "uuid-assignment-1",
        "trip_id": "uuid-trip-1",
        "tower_id": "cll2f4j2m00003z4l9v7m0s4s",
        "status": "pending",
        "location": { "lat": 12.34, "long": 56.78 },
        "createdAt": "2023-01-01T12:00:00.000Z",
        "updatedAt": "2023-01-01T12:00:00.000Z"
      }
    ]
  }
  ```
- **Errores:**
  - `403 Forbidden`: `{"success": false, "error": "No autorizado. Se requiere una clave API válida."}`
  - `500 Internal Server Error`: `{"success": false, "error": "Error al obtener la lista de Assignments."}`

#### `GET /api/tower/assignments/[id]`
Obtiene los detalles de una Asignación específica por su `assignment_id`.
- **Requiere:** Clave API de administrador válida.
- **Cabeceras:** `x-api-key: <TU_CLAVE_API>`
- **Parámetros de Ruta:**
  - `id` (string, requerido): El `assignment_id` de la Asignación.
- **Respuesta Exitosa (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "assignment_id": "uuid-assignment-1",
      "trip_id": "uuid-trip-1",
      "tower_id": "cll2f4j2m00003z4l9v7m0s4s",
      "status": "pending",
      "location": { "lat": 12.34, "long": 56.78 },
      "createdAt": "2023-01-01T12:00:00.000Z",
      "updatedAt": "2023-01-01T12:00:00.000Z"
    }
  }
  ```
- **Errores:**
  - `403 Forbidden`: `{"success": false, "error": "No autorizado. Se requiere una clave API válida."}`
  - `404 Not Found`: `{"success": false, "error": "Assignment no encontrada."}`
  - `500 Internal Server Error`: `{"success": false, "error": "Error al obtener la Assignment."}`

#### `POST /api/tower/assignments`
Crea un nuevo registro de Asignación.
- **Requiere:** Clave API de administrador válida.
- **Cabeceras:** `x-api-key: <TU_CLAVE_API>`
- **Cuerpo de la Solicitud (application/json):**
  ```json
  {
    "trip_id": "uuid-trip-1",
    "tower_id": "cll2f4j2m00003z4l9v7m0s4s",
    "status": "pending",
    "location": { "lat": 12.34, "long": 56.78 }
  }
  ```
- **Respuesta Exitosa (201 Created):**
  ```json
  {
    "success": true,
    "data": {
      "assignment_id": "uuid-new-assignment",
      "trip_id": "uuid-trip-1",
      "tower_id": "cll2f4j2m00003z4l9v7m0s4s",
      "status": "pending",
      "location": { "lat": 12.34, "long": 56.78 },
      "createdAt": "2023-01-01T12:00:00.000Z",
      "updatedAt": "2023-01-01T12:00:00.000Z"
    }
  }
  ```
- **Errores:**
  - `403 Forbidden`: `{"success": false, "error": "No autorizado. Se requiere una clave API válida."}`
  - `400 Bad Request`: `{"success": false, "error": "Faltan campos obligatorios para la asignación: trip_id, tower_id, status, location."}`
  - `404 Not Found`: `{"success": false, "error": "La Tower especificada no existe."}`
  - `500 Internal Server Error`: `{"success": false, "error": "Error desconocido al crear asignación."}`

#### `PUT /api/tower/assignments/[id]`
Actualiza un registro de la tabla Assignment.
- **Requiere:** Clave API de administrador válida.
- **Cabeceras:** `x-api-key: <TU_CLAVE_API>`
- **Parámetros de Ruta:**
  - `id` (string, requerido): El `assignment_id` de la Asignación a actualizar.
- **Cuerpo de la Solicitud (application/json):** (Algunos campos son opcionales)
  ```json
  {
    "trip_id": "uuid-trip-1-updated",
    "status": "completed",
    "location": { "lat": 98.76, "long": 54.32 }
  }
  ```
- **Respuesta Exitosa (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "assignment_id": "uuid-assignment-1",
      "trip_id": "uuid-trip-1-updated",
      "tower_id": "cll2f4j2m00003z4l9v7m0s4s",
      "status": "completed",
      "location": { "lat": 98.76, "long": 54.32 },
      "createdAt": "2023-01-01T12:00:00.000Z",
      "updatedAt": "2023-01-01T12:00:00.000Z"
    }
  }
  ```
- **Errores:**
  - `403 Forbidden`: `{"success": false, "error": "No autorizado. Se requiere una clave API válida."}`
  - `404 Not Found`: `{"success": false, "error": "Assignment no encontrada."}` o `{"success": false, "error": "La Tower especificada no existe."}`
  - `500 Internal Server Error`: `{"success": false, "error": "Error al actualizar la asignación."}`

#### `DELETE /api/tower/assignments/[id]`
Elimina un registro de la tabla Assignment.
- **Requiere:** Clave API de administrador válida.
- **Cabeceras:** `x-api-key: <TU_CLAVE_API>`
- **Parámetros de Ruta:**
  - `id` (string, requerido): El `assignment_id` de la Asignación a eliminar.
- **Respuesta Exitosa (200 OK):**
  ```json
  {
    "success": true
  }
  ```
- **Errores:**
  - `403 Forbidden`: `{"success": false, "error": "No autorizado. Se requiere una clave API válida."}`
  - `404 Not Found`: `{"success": false, "error": "Assignment no encontrada."}`
  - `500 Internal Server Error`: `{"success": false, "error": "Error al eliminar la asignación."}`
