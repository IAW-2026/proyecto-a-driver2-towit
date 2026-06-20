# Documentación de la API de Administración

Esta API proporciona endpoints para la gestión de usuarios (Administradores y Towers), vehículos y asignaciones, exclusivamente para usuarios con rol de `admin`.

---

## 1. Endpoints de Towers

### `GET /api/towers`
Obtiene una lista de todas las Towers registradas en el sistema.
- Requiere autenticación de administrador.
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
  - `403 Forbidden`: "No autorizado. Solo administradores pueden ver esta información."
  - `500 Internal Server Error`: "Error al obtener la lista de Towers."

### `GET /api/towers/[id]`
Obtiene los detalles de una Tower específica por su `tower_id`.
- Requiere autenticación de administrador.
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
  - `403 Forbidden`: "No autorizado. Solo administradores pueden ver esta información."
  - `404 Not Found`: "Tower no encontrada."
  - `500 Internal Server Error`: "Error al obtener la Tower."

### `POST /api/towers`
Crea una nueva Tower y su usuario asociado en Clerk.
- Requiere autenticación de administrador.
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
  - `400 Bad Request`: "Faltan campos obligatorios: firstName, lastName, emailAddress, password."
  - `403 Forbidden`: "No autorizado. Solo administradores pueden crear usuarios."
  - `500 Internal Server Error`: "Error desconocido al crear Tower." (Puede incluir mensajes de error de Clerk, ej., email ya existe)

### `PUT /api/towers/[id]`
Actualiza los detalles de una Tower existente por su `tower_id`.
- Requiere autenticación de administrador.
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
  - `403 Forbidden`: "No autorizado. Solo administradores pueden actualizar Towers."
  - `404 Not Found`: "Tower no encontrada en la base de datos."
  - `500 Internal Server Error`: "Error al actualizar la Tower."

### `DELETE /api/towers/[id]`
Elimina una Tower por su `tower_id` y su usuario asociado en Clerk.
- Requiere autenticación de administrador.
- **Parámetros de Ruta:**
  - `id` (string, requerido): El `tower_id` de la Tower a eliminar.
- **Respuesta Exitosa (200 OK):**
  ```json
  {
    "success": true
  }
  ```
- **Errores:**
  - `403 Forbidden`: "No autorizado. Solo administradores pueden eliminar Towers."
  - `404 Not Found`: "Tower no encontrada."
  - `500 Internal Server Error`: "Error al eliminar la Tower."

---

## 2. Endpoints de Administradores

### `GET /api/admins`
Obtiene una lista de todos los Administradores registrados en el sistema.
- Requiere autenticación de administrador.
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
  - `403 Forbidden`: "No autorizado. Solo administradores pueden ver esta información."
  - `500 Internal Server Error`: "Error al obtener la lista de Administradores."

### `GET /api/admins/[id]`
Obtiene los detalles de un Administrador específico por su `admin_id`.
- Requiere autenticación de administrador.
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
  - `403 Forbidden`: "No autorizado. Solo administradores pueden ver esta información."
  - `404 Not Found`: "Administrador no encontrado."
  - `500 Internal Server Error`: "Error al obtener el Administrador."

### `POST /api/admins`
Crea un nuevo Administrador y su usuario asociado en Clerk.
- Requiere autenticación de administrador.
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
  - `400 Bad Request`: "Faltan campos obligatorios: firstName, lastName, emailAddress, password."
  - `403 Forbidden`: "No autorizado. Solo administradores pueden crear usuarios."
  - `500 Internal Server Error`: "Error desconocido al crear Admin." (Puede incluir mensajes de error de Clerk, ej., email ya existe)

### `PUT /api/admins/[id]`
Actualiza los detalles de un Administrador existente por su `admin_id`.
- Requiere autenticación de administrador.
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
  - `403 Forbidden`: "No autorizado. Solo administradores pueden actualizar administradores."
  - `404 Not Found`: "Administrador no encontrado en la base de datos."
  - `500 Internal Server Error`: "Error al actualizar el administrador."

### `DELETE /api/admins/[id]`
Elimina un Administrador por su `admin_id` y su usuario asociado en Clerk.
- Requiere autenticación de administrador.
- **Parámetros de Ruta:**
  - `id` (string, requerido): El `admin_id` del Administrador a eliminar.
- **Respuesta Exitosa (200 OK):**
  ```json
  {
    "success": true
  }
  ```
- **Errores:**
  - `403 Forbidden`: "No autorizado. Solo administradores pueden eliminar administradores."
  - `404 Not Found`: "Administrador no encontrado."
  - `500 Internal Server Error`: "Error al eliminar el administrador."

---

## 3. Endpoints de Vehículos

### `GET /api/vehicles`
Obtiene una lista de todos los Vehículos registrados en el sistema.
- Requiere autenticación de administrador.
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
  - `403 Forbidden`: "No autorizado. Solo administradores pueden ver esta información."
  - `500 Internal Server Error`: "Error al obtener la lista de Vehículos."

### `GET /api/vehicles/[id]`
Obtiene los detalles de un Vehículo específico por su `vehicle_id`.
- Requiere autenticación de administrador.
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
  - `403 Forbidden`: "No autorizado. Solo administradores pueden ver esta información."
  - `404 Not Found`: "Vehículo no encontrado."
  - `500 Internal Server Error`: "Error al obtener el vehículo."

### `POST /api/vehicles`
Crea un nuevo Vehículo.
- Requiere autenticación de administrador.
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
  - `400 Bad Request`: "Faltan campos obligatorios para el vehículo: brand, model, year, max_load, tower_id."
  - `403 Forbidden`: "No autorizado. Solo administradores pueden crear vehículos."
  - `404 Not Found`: "La Tower especificada no existe."
  - `500 Internal Server Error`: "Error desconocido al crear vehículo."

### `PUT /api/vehicles/[id]`
Actualiza los detalles de un Vehículo existente por su `vehicle_id`.
- Requiere autenticación de administrador.
- **Parámetros de Ruta:**
  - `id` (string, requerido): El `vehicle_id` del Vehículo a actualizar.
- **Cuerpo de la Solicitud (application/json):** (Algunos campos son opcionales)
  ```json
  {
    "brand": "GMC",
    "model": "Sierra",
    "max_load": 2200.0
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
  - `403 Forbidden`: "No autorizado. Solo administradores pueden actualizar vehículos."
  - `404 Not Found`: "Vehículo no encontrado." / "La Tower especificada no existe."
  - `500 Internal Server Error`: "Error al actualizar el vehículo."

### `DELETE /api/vehicles/[id]`
Elimina un Vehículo por su `vehicle_id`.
- Requiere autenticación de administrador.
- **Parámetros de Ruta:**
  - `id` (string, requerido): El `vehicle_id` del Vehículo a eliminar.
- **Respuesta Exitosa (200 OK):**
  ```json
  {
    "success": true
  }
  ```
- **Errores:**
  - `403 Forbidden`: "No autorizado. Solo administradores pueden eliminar vehículos."
  - `404 Not Found`: "Vehículo no encontrado."
  - `500 Internal Server Error`: "Error al eliminar el vehículo."

---

## 4. Endpoints de Asignaciones

### `GET /api/assignments`
Obtiene una lista de todas las Asignaciones registradas en el sistema.
- Requiere autenticación de administrador.
- **Respuesta Exitosa (200 OK):**
  ```json
  {
    "success": true,
    "data": [
      {
        "assignment_id": "uuid-assignment-1",
        "trip_id": "trip_abc",
        "tower_id": "cll2f4j2m00003z4l9v7m0s4s",
        "status": "pending",
        "location": { "lat": "40.7128", "long": "-74.0060" },
        "createdAt": "2023-01-01T12:00:00.000Z",
        "updatedAt": "2023-01-01T12:00:00.000Z"
      }
    ]
  }
  ```
- **Errores:**
  - `403 Forbidden`: "No autorizado. Solo administradores pueden ver esta información."
  - `500 Internal Server Error`: "Error al obtener la lista de Assignments."

### `GET /api/assignments/[id]`
Obtiene los detalles de una Asignación específica por su `assignment_id`.
- Requiere autenticación de administrador.
- **Parámetros de Ruta:**
  - `id` (string, requerido): El `assignment_id` de la Asignación.
- **Respuesta Exitosa (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "assignment_id": "uuid-assignment-1",
      "trip_id": "trip_abc",
      "tower_id": "cll2f4j2m00003z4l9v7m0s4s",
      "status": "pending",
      "location": { "lat": "40.7128", "long": "-74.0060" },
      "createdAt": "2023-01-01T12:00:00.000Z",
      "updatedAt": "2023-01-01T12:00:00.000Z"
    }
  }
  ```
- **Errores:**
  - `403 Forbidden`: "No autorizado. Solo administradores pueden ver esta información."
  - `404 Not Found`: "Assignment no encontrada."
  - `500 Internal Server Error`: "Error al obtener la Assignment."

### `POST /api/assignments`
Crea una nueva Asignación.
- Requiere autenticación de administrador.
- **Cuerpo de la Solicitud (application/json):**
  ```json
  {
    "trip_id": "trip_xyz",
    "tower_id": "cll2f4j2m00003z4l9v7m0s4s",
    "status": "accepted",
    "location": {
      "lat": "34.0522",
      "long": "-118.2437"
    }
  }
  ```
- **Respuesta Exitosa (201 Created):**
  ```json
  {
    "success": true,
    "data": {
      "assignment_id": "uuid-new-assignment",
      "trip_id": "trip_xyz",
      "tower_id": "cll2f4j2m00003z4l9v7m0s4s",
      "status": "accepted",
      "location": { "lat": "34.0522", "long": "-118.2437" },
      "createdAt": "2023-01-01T12:00:00.000Z",
      "updatedAt": "2023-01-01T12:00:00.000Z"
    }
  }
  ```
- **Errores:**
  - `400 Bad Request`: "Faltan campos obligatorios para la asignación: trip_id, tower_id, status, location."
  - `403 Forbidden`: "No autorizado. Solo administradores pueden crear asignaciones."
  - `404 Not Found`: "La Tower especificada no existe."
  - `500 Internal Server Error`: "Error desconocido al crear asignación."

### `PUT /api/assignments/[id]`
Actualiza los detalles de una Asignación existente por su `assignment_id`.
- Requiere autenticación de administrador.
- **Parámetros de Ruta:**
  - `id` (string, requerido): El `assignment_id` de la Asignación a actualizar.
- **Cuerpo de la Solicitud (application/json):** (Algunos campos son opcionales)
  ```json
  {
    "status": "completed",
    "location": {
      "lat": "34.0522",
      "long": "-118.2437"
    }
  }
  ```
- **Respuesta Exitosa (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "assignment_id": "uuid-assignment-1",
      "trip_id": "trip_abc",
      "tower_id": "cll2f4j2m00003z4l9v7m0s4s",
      "status": "completed",
      "location": { "lat": "34.0522", "long": "-118.2437" },
      "createdAt": "2023-01-01T12:00:00.000Z",
      "updatedAt": "2023-01-01T12:00:00.000Z"
    }
  }
  ```
- **Errores:**
  - `403 Forbidden`: "No autorizado. Solo administradores pueden actualizar asignaciones."
  - `404 Not Found`: "Assignment no encontrada." / "La Tower especificada no existe."
  - `500 Internal Server Error`: "Error al actualizar la asignación."

### `DELETE /api/assignments/[id]`
Elimina una Asignación por su `assignment_id`.
- Requiere autenticación de administrador.
- **Parámetros de Ruta:**
  - `id` (string, requerido): El `assignment_id` de la Asignación a eliminar.
- **Respuesta Exitosa (200 OK):**
  ```json
  {
    "success": true
  }
  ```
- **Errores:**
  - `403 Forbidden`: "No autorizado. Solo administradores pueden eliminar asignaciones."
  - `404 Not Found`: "Assignment no encontrada."
  - `500 Internal Server Error`: "Error al eliminar la asignación."
