# Documentación de Endpoints de la API

Todos los endpoints listados aquí requieren una autenticación a través de una `apiKey` válida, que debe ser enviada en el encabezado de la solicitud `x-api-key`. Ninguno de estos endpoints utiliza la autenticación de Clerk directamente para validar la solicitud. Clerk se usa internamente para la gestión de usuarios (creación, actualización, eliminación) después de que la autenticación por API Key ha sido exitosa.

## Endpoints de Asignaciones (`/api/tower/assignments`)

### `GET /api/assignments`

-   **Descripción**: Obtiene todos los registros de la tabla `Assignment`.
-   **Autenticación**: Se requiere una clave API de administrador válida (`x-api-key` en los headers).
-   **Parámetros de Ruta**: N/A
-   **Cuerpo de la Solicitud**: N/A
-   **Ejemplo de Respuesta Exitosa (200 OK)**:
    ```json
    {
      "success": true,
      "data": [
        { "assignment_id": "...", "trip_id": "...", "tower_id": "...", "status": "...", "location": { "lat": "...", "long": "..." }, "origin": "...", "destination": "...", "createdAt": "...", "updatedAt": "...", "deactivated": false },
        // ... más asignaciones
      ]
    }
    ```
-   **Ejemplo de Respuesta de Error (403 Forbidden)**:
    ```json
    {
      "success": false,
      "error": "No autorizado. Se requiere una clave API válida."
    }
    ```
-   **Ejemplo de Respuesta de Error (500 Internal Server Error)**:
    ```json
    {
      "success": false,
      "error": "Error al obtener la lista de Assignments."
    }
    ```

### `POST /api/assignments`

-   **Descripción**: Crea un nuevo registro en la tabla `Assignment`.
-   **Autenticación**: Se requiere una clave API de administrador válida (`x-api-key` en los headers).
-   **Parámetros de Ruta**: N/A
-   **Cuerpo de la Solicitud (JSON)**:
    ```json
    {
      "trip_id": "string",
      "tower_id": "string",
      "status": "string",
      "location": { "lat": "string", "long": "string" }, // Objeto JSON con latitud y longitud
      "origin": "string",
      "destination": "string"
    }
    ```
    *Campos requeridos: `trip_id`, `tower_id`, `status`, `location`, `origin`, `destination`.*
-   **Ejemplo de Respuesta Exitosa (201 Created)**:
    ```json
    {
      "success": true,
      "data": { "assignment_id": "...", "trip_id": "...", "tower_id": "...", "status": "...", "location": { "lat": "...", "long": "..." }, "origin": "...", "destination": "...", "createdAt": "...", "updatedAt": "...", "deactivated": false }
    }
    ```
-   **Ejemplo de Respuesta de Error (400 Bad Request)**:
    ```json
    {
      "success": false,
      "error": "Faltan campos obligatorios para la asignación: trip_id, tower_id, status, location, origin, destination."
    }
    ```
-   **Ejemplo de Respuesta de Error (403 Forbidden)**:
    ```json
    {
      "success": false,
      "error": "No autorizado. Se requiere una clave API válida."
    }
    ```
-   **Ejemplo de Respuesta de Error (404 Not Found)**:
    ```json
    {
      "success": false,
      "error": "La Tower especificada no existe."
    }
    ```
-   **Ejemplo de Respuesta de Error (500 Internal Server Error)**:
    ```json
    {
      "success": false,
      "error": "Error desconocido al crear asignación."
    }
    ```

### `GET /api/assignments/{id}`

-   **Descripción**: Obtiene un registro específico de la tabla `Assignment` por su ID.
-   **Autenticación**: Se requiere una clave API de administrador válida (`x-api-key` en los headers).
-   **Parámetros de Ruta**:
    -   `id` (string, requerido): El `assignment_id` de la asignación a obtener.
-   **Cuerpo de la Solicitud**: N/A
-   **Ejemplo de Respuesta Exitosa (200 OK)**:
    ```json
    {
      "success": true,
      "data": { "assignment_id": "...", "trip_id": "...", "tower_id": "...", "status": "...", "location": { "lat": "...", "long": "..." }, "origin": "...", "destination": "...", "createdAt": "...", "updatedAt": "...", "deactivated": false }
    }
    ```
-   **Ejemplo de Respuesta de Error (403 Forbidden)**:
    ```json
    {
      "success": false,
      "error": "No autorizado. Se requiere una clave API válida."
    }
    ```
-   **Ejemplo de Respuesta de Error (404 Not Found)**:
    ```json
    {
      "success": false,
      "error": "Assignment no encontrada."
    }
    ```
-   **Ejemplo de Respuesta de Error (500 Internal Server Error)**:
    ```json
    {
      "success": false,
      "error": "Error al obtener la Assignment."
    }
    ```

### `PATCH /api/assignments/{id}`

-   **Descripción**: Actualiza un registro específico de la tabla `Assignment` por su ID.
-   **Autenticación**: Se requiere una clave API de administrador válida (`x-api-key` en los headers).
-   **Parámetros de Ruta**:
    -   `id` (string, requerido): El `assignment_id` de la asignación a actualizar.
-   **Cuerpo de la Solicitud (JSON)**:
    ```json
    {
      "trip_id": "string (opcional)",
      "tower_id": "string (opcional)",
      "status": "string (opcional)",
      "location": { "lat": "string", "long": "string" } (opcional),
      "origin": "string (opcional)",
      "destination": "string (opcional)",
      "deactivated": "boolean (opcional)"
    }
    ```
    *Al menos uno de los campos opcionales debe estar presente.*
-   **Ejemplo de Respuesta Exitosa (200 OK)**:
    ```json
    {
      "success": true,
      "data": { "assignment_id": "...", "trip_id": "...", "tower_id": "...", "status": "...", "location": { "lat": "...", "long": "..." }, "origin": "...", "destination": "...", "createdAt": "...", "updatedAt": "...", "deactivated": true }
    }
    ```
-   **Ejemplo de Respuesta de Error (400 Bad Request)**:
    ```json
    {
      "success": false,
      "error": "No se proporcionaron datos para actualizar."
    }
    ```
-   **Ejemplo de Respuesta de Error (403 Forbidden)**:
    ```json
    {
      "success": false,
      "error": "No autorizado. Se requiere una clave API válida."
    }
    ```
-   **Ejemplo de Respuesta de Error (404 Not Found)**:
    ```json
    {
      "success": false,
      "error": "La Tower especificada no existe." // Si se intenta actualizar con un tower_id inexistente
    }
    ```
-   **Ejemplo de Respuesta de Error (500 Internal Server Error)**:
    ```json
    {
      "success": false,
      "error": "Error al actualizar la asignación."
    }
    ```

### `DELETE /api/assignments/{id}`

-   **Descripción**: Elimina un registro específico de la tabla `Assignment` por su ID.
-   **Autenticación**: Se requiere una clave API de administrador válida (`x-api-key` en los headers).
-   **Parámetros de Ruta**:
    -   `id` (string, requerido): El `assignment_id` de la asignación a eliminar.
-   **Cuerpo de la Solicitud**: N/A
-   **Ejemplo de Respuesta Exitosa (200 OK)**:
    ```json
    {
      "success": true
    }
    ```
-   **Ejemplo de Respuesta de Error (403 Forbidden)**:
    ```json
    {
      "success": false,
      "error": "No autorizado. Se requiere una clave API válida."
    }
    ```
-   **Ejemplo de Respuesta de Error (404 Not Found)**:
    ```json
    {
      "success": false,
      "error": "Assignment no encontrada."
    }
    ```
-   **Ejemplo de Respuesta de Error (500 Internal Server Error)**:
    ```json
    {
      "success": false,
      "error": "Error al eliminar la asignación."
    }
    ```

## Endpoints de Towers (`/api/tower/towers`)

### `GET /api/towers`

-   **Descripción**: Obtiene todos los registros de la tabla `Tower`.
-   **Autenticación**: Se requiere una clave API de administrador válida (`x-api-key` en los headers).
-   **Parámetros de Ruta**: N/A
-   **Cuerpo de la Solicitud**: N/A
-   **Ejemplo de Respuesta Exitosa (200 OK)**:
    ```json
    {
      "success": true,
      "data": [
        { "tower_id": "...", "clerk_id": "...", "email": "...", "full_name": "...", "payments_alias": null, "deactivated": false, "createdAt": "...", "updatedAt": "..." },
        // ... más towers
      ]
    }
    ```
-   **Ejemplo de Respuesta de Error (403 Forbidden)**:
    ```json
    {
      "success": false,
      "error": "No autorizado. Se requiere una clave API válida."
    }
    ```
-   **Ejemplo de Respuesta de Error (500 Internal Server Error)**:
    ```json
    {
      "success": false,
      "error": "Error al obtener la lista de Towers."
    }
    ```

### `POST /api/towers`

-   **Descripción**: Crea un nuevo usuario `Tower` en Clerk y un registro asociado en la base de datos de Prisma.
-   **Autenticación**: Se requiere una clave API de administrador válida (`x-api-key` en los headers).
-   **Parámetros de Ruta**: N/A
-   **Cuerpo de la Solicitud (JSON)**:
    ```json
    {
      "firstName": "string",
      "lastName": "string",
      "emailAddress": "string",
      "password": "string"
    }
    ```
    *Campos requeridos: `firstName`, `lastName`, `emailAddress`, `password`.*
-   **Ejemplo de Respuesta Exitosa (201 Created)**:
    ```json
    {
      "success": true,
      "data": { "tower_id": "...", "clerk_id": "...", "email": "...", "full_name": "...", "payments_alias": null, "deactivated": false, "createdAt": "...", "updatedAt": "..." }
    }
    ```
-   **Ejemplo de Respuesta de Error (400 Bad Request)**:
    ```json
    {
      "success": false,
      "error": "Faltan campos obligatorios: firstName, lastName, emailAddress, password."
    }
    ```
-   **Ejemplo de Respuesta de Error (403 Forbidden)**:
    ```json
    {
      "success": false,
      "error": "No autorizado. Se requiere una clave API válida."
    }
    ```
-   **Ejemplo de Respuesta de Error (500 Internal Server Error)**:
    ```json
    {
      "success": false,
      "error": "Error desconocido al crear Tower." // Puede incluir mensajes de error de Clerk como "email already exists"
    }
    ```

### `GET /api/towers/{id}`

-   **Descripción**: Obtiene un registro específico de la tabla `Tower` por su ID.
-   **Autenticación**: Se requiere una clave API de administrador válida (`x-api-key` en los headers).
-   **Parámetros de Ruta**:
    -   `id` (string, requerido): El `tower_id` de la torre a obtener.
-   **Cuerpo de la Solicitud**: N/A
-   **Ejemplo de Respuesta Exitosa (200 OK)**:
    ```json
    {
      "success": true,
      "data": { "tower_id": "...", "clerk_id": "...", "email": "...", "full_name": "...", "payments_alias": null, "deactivated": false, "createdAt": "...", "updatedAt": "..." }
    }
    ```
-   **Ejemplo de Respuesta de Error (403 Forbidden)**:
    ```json
    {
      "success": false,
      "error": "No autorizado. Se requiere una clave API válida."
    }
    ```
-   **Ejemplo de Respuesta de Error (404 Not Found)**:
    ```json
    {
      "success": false,
      "error": "Tower no encontrada."
    }
    ```
-   **Ejemplo de Respuesta de Error (500 Internal Server Error)**:
    ```json
    {
      "success": false,
      "error": "Error al obtener la Tower."
    }
    ```

### `PATCH /api/towers/{id}`

-   **Descripción**: Actualiza un registro específico de la tabla `Tower` por su ID. También actualiza el usuario asociado en Clerk si se modifican `full_name` o `email`.
-   **Autenticación**: Se requiere una clave API de administrador válida (`x-api-key` en los headers).
-   **Parámetros de Ruta**:
    -   `id` (string, requerido): El `tower_id` de la torre a actualizar.
-   **Cuerpo de la Solicitud (JSON)**:
    ```json
    {
      "full_name": "string (opcional)",
      "email": "string (opcional)",
      "payments_alias": "string | null (opcional)",
      "deactivated": "boolean (opcional)"
    }
    ```
    *Al menos uno de los campos opcionales debe estar presente.*
-   **Ejemplo de Respuesta Exitosa (200 OK)**:
    ```json
    {
      "success": true,
      "data": { "tower_id": "...", "clerk_id": "...", "email": "...", "full_name": "...", "payments_alias": "...", "deactivated": false, "createdAt": "...", "updatedAt": "..." }
    }
    ```
-   **Ejemplo de Respuesta de Error (400 Bad Request)**:
    ```json
    {
      "success": false,
      "error": "No se proporcionaron datos para actualizar."
    }
    ```
-   **Ejemplo de Respuesta de Error (403 Forbidden)**:
    ```json
    {
      "success": false,
      "error": "No autorizado. Se requiere una clave API válida."
    }
    ```
-   **Ejemplo de Respuesta de Error (404 Not Found)**:
    ```json
    {
      "success": false,
      "error": "Tower no encontrada en la base de datos."
    }
    ```
-   **Ejemplo de Respuesta de Error (500 Internal Server Error)**:
    ```json
    {
      "success": false,
      "error": "Error al actualizar la Tower."
    }
    ```

### `DELETE /api/towers/{id}`

-   **Descripción**: Elimina un registro específico de la tabla `Tower` por su ID. También elimina el usuario asociado en Clerk.
-   **Autenticación**: Se requiere una clave API de administrador válida (`x-api-key` en los headers).
-   **Parámetros de Ruta**:
    -   `id` (string, requerido): El `tower_id` de la torre a eliminar.
-   **Cuerpo de la Solicitud**: N/A
-   **Ejemplo de Respuesta Exitosa (200 OK)**:
    ```json
    {
      "success": true
    }
    ```
-   **Ejemplo de Respuesta de Error (403 Forbidden)**:
    ```json
    {
      "success": false,
      "error": "No autorizado. Se requiere una clave API válida."
    }
    ```
-   **Ejemplo de Respuesta de Error (404 Not Found)**:
    ```json
    {
      "success": false,
      "error": "Tower no encontrada."
    }
    ```
-   **Ejemplo de Respuesta de Error (500 Internal Server Error)**:
    ```json
    {
      "success": false,
      "error": "Error al eliminar la Tower."
    }
    ```

## Endpoints de Administradores (`/api/tower/admins`)

### `GET /api/admins`

-   **Descripción**: Obtiene todos los registros de la tabla `Admin`.
-   **Autenticación**: Se requiere una clave API de administrador válida (`x-api-key` en los headers).
-   **Parámetros de Ruta**: N/A
-   **Cuerpo de la Solicitud**: N/A
-   **Ejemplo de Respuesta Exitosa (200 OK)**:
    ```json
    {
      "success": true,
      "data": [
        { "admin_id": "...", "clerk_id": "...", "email": "...", "full_name": "...", "deactivated": false, "createdAt": "...", "updatedAt": "..." },
        // ... más administradores
      ]
    }
    ```
-   **Ejemplo de Respuesta de Error (403 Forbidden)**:
    ```json
    {
      "success": false,
      "error": "No autorizado. Se requiere una clave API válida."
    }
    ```
-   **Ejemplo de Respuesta de Error (500 Internal Server Error)**:
    ```json
    {
      "success": false,
      "error": "Error al obtener la lista de Administradores."
    }
    ```

### `POST /api/admins`

-   **Descripción**: Crea un nuevo usuario `Admin` en Clerk y un registro asociado en la base de datos de Prisma.
-   **Autenticación**: Se requiere una clave API de administrador válida (`x-api-key` en los headers).
-   **Parámetros de Ruta**: N/A
-   **Cuerpo de la Solicitud (JSON)**:
    ```json
    {
      "firstName": "string",
      "lastName": "string",
      "emailAddress": "string",
      "password": "string"
    }
    ```
    *Campos requeridos: `firstName`, `lastName`, `emailAddress`, `password`.*
-   **Ejemplo de Respuesta Exitosa (201 Created)**:
    ```json
    {
      "success": true,
      "data": { "admin_id": "...", "clerk_id": "...", "email": "...", "full_name": "...", "deactivated": false, "createdAt": "...", "updatedAt": "..." }
    }
    ```
-   **Ejemplo de Respuesta de Error (400 Bad Request)**:
    ```json
    {
      "success": false,
      "error": "Faltan campos obligatorios: firstName, lastName, emailAddress, password."
    }
    ```
-   **Ejemplo de Respuesta de Error (403 Forbidden)**:
    ```json
    {
      "success": false,
      "error": "No autorizado. Se requiere una clave API válida."
    }
    ```
-   **Ejemplo de Respuesta de Error (500 Internal Server Error)**:
    ```json
    {
      "success": false,
      "error": "Error desconocido al crear Admin." // Puede incluir mensajes de error de Clerk como "email already exists"
    }
    ```

### `GET /api/admins/{id}`

-   **Descripción**: Obtiene un registro específico de la tabla `Admin` por su ID.
-   **Autenticación**: Se requiere una clave API de administrador válida (`x-api-key` en los headers).
-   **Parámetros de Ruta**:
    -   `id` (string, requerido): El `admin_id` del administrador a obtener.
-   **Cuerpo de la Solicitud**: N/A
-   **Ejemplo de Respuesta Exitosa (200 OK)**:
    ```json
    {
      "success": true,
      "data": { "admin_id": "...", "clerk_id": "...", "email": "...", "full_name": "...", "deactivated": false, "createdAt": "...", "updatedAt": "..." }
    }
    ```
-   **Ejemplo de Respuesta de Error (403 Forbidden)**:
    ```json
    {
      "success": false,
      "error": "No autorizado. Se requiere una clave API válida."
    }
    ```
-   **Ejemplo de Respuesta de Error (404 Not Found)**:
    ```json
    {
      "success": false,
      "error": "Administrador no encontrado."
    }
    ```
-   **Ejemplo de Respuesta de Error (500 Internal Server Error)**:
    ```json
    {
      "success": false,
      "error": "Error al obtener el Administrador."
    }
    ```

### `PATCH /api/admins/{id}`

-   **Descripción**: Actualiza un registro específico de la tabla `Admin` por su ID. También actualiza el usuario asociado en Clerk si se modifican `full_name` o `email`.
-   **Autenticación**: Se requiere una clave API de administrador válida (`x-api-key` en los headers).
-   **Parámetros de Ruta**:
    -   `id` (string, requerido): El `admin_id` del administrador a actualizar.
-   **Cuerpo de la Solicitud (JSON)**:
    ```json
    {
      "full_name": "string (opcional)",
      "email": "string (opcional)",
      "deactivated": "boolean (opcional)"
    }
    ```
    *Al menos uno de los campos opcionales debe estar presente.*
-   **Ejemplo de Respuesta Exitosa (200 OK)**:
    ```json
    {
      "success": true,
      "data": { "admin_id": "...", "clerk_id": "...", "email": "...", "full_name": "...", "deactivated": false, "createdAt": "...", "updatedAt": "..." }
    }
    ```
-   **Ejemplo de Respuesta de Error (400 Bad Request)**:
    ```json
    {
      "success": false,
      "error": "No se proporcionaron datos para actualizar."
    }
    ```
-   **Ejemplo de Respuesta de Error (403 Forbidden)**:
    ```json
    {
      "success": false,
      "error": "No autorizado. Se requiere una clave API válida."
    }
    ```
-   **Ejemplo de Respuesta de Error (404 Not Found)**:
    ```json
    {
      "success": false,
      "error": "Administrador no encontrado en la base de datos."
    }
    ```
-   **Ejemplo de Respuesta de Error (500 Internal Server Error)**:
    ```json
    {
      "success": false,
      "error": "Error al actualizar el administrador."
    }
    ```

### `DELETE /api/admins/{id}`

-   **Descripción**: Elimina un registro específico de la tabla `Admin` por su ID. También elimina el usuario asociado en Clerk.
-   **Autenticación**: Se requiere una clave API de administrador válida (`x-api-key` en los headers).
-   **Parámetros de Ruta**:
    -   `id` (string, requerido): El `admin_id` del administrador a eliminar.
-   **Cuerpo de la Solicitud**: N/A
-   **Ejemplo de Respuesta Exitosa (200 OK)**:
    ```json
    {
      "success": true
    }
    ```
-   **Ejemplo de Respuesta de Error (403 Forbidden)**:
    ```json
    {
      "success": false,
      "error": "No autorizado. Se requiere una clave API válida."
    }
    ```
-   **Ejemplo de Respuesta de Error (404 Not Found)**:
    ```json
    {
      "success": false,
      "error": "Administrador no encontrado."
    }
    ```
-   **Ejemplo de Respuesta de Error (500 Internal Server Error)**:
    ```json
    {
      "success": false,
      "error": "Error al eliminar el administrador."
    }
    ```

## Endpoints de Vehículos (`/api/tower/vehicles`)

### `GET /api/vehicles`

-   **Descripción**: Obtiene todos los registros de la tabla `Vehicle`.
-   **Autenticación**: Se requiere una clave API de administrador válida (`x-api-key` en los headers).
-   **Parámetros de Ruta**: N/A
-   **Cuerpo de la Solicitud**: N/A
-   **Ejemplo de Respuesta Exitosa (200 OK)**:
    ```json
    {
      "success": true,
      "data": [
        { "vehicle_id": "...", "brand": "...", "model": "...", "year": 2020, "max_load": 1500.5, "tower_id": "...", "deactivated": false, "createdAt": "...", "updatedAt": "..." },
        // ... más vehículos
      ]
    }
    ```
-   **Ejemplo de Respuesta de Error (403 Forbidden)**:
    ```json
    {
      "success": false,
      "error": "No autorizado. Se requiere una clave API válida."
    }
    ```
-   **Ejemplo de Respuesta de Error (500 Internal Server Error)**:
    ```json
    {
      "success": false,
      "error": "Error al obtener la lista de Vehículos."
    }
    ```

### `POST /api/vehicles`

-   **Descripción**: Crea un nuevo registro en la tabla `Vehicle`.
-   **Autenticación**: Se requiere una clave API de administrador válida (`x-api-key` en los headers).
-   **Parámetros de Ruta**: N/A
-   **Cuerpo de la Solicitud (JSON)**:
    ```json
    {
      "brand": "string",
      "model": "string",
      "year": "number (entero)",
      "max_load": "number (flotante)",
      "tower_id": "string"
    }
    ```
    *Campos requeridos: `brand`, `model`, `year`, `max_load`, `tower_id`.*
-   **Ejemplo de Respuesta Exitosa (201 Created)**:
    ```json
    {
      "success": true,
      "data": { "vehicle_id": "...", "brand": "...", "model": "...", "year": 2020, "max_load": 1500.5, "tower_id": "...", "deactivated": false, "createdAt": "...", "updatedAt": "..." }
    }
    ```
-   **Ejemplo de Respuesta de Error (400 Bad Request)**:
    ```json
    {
      "success": false,
      "error": "Faltan campos obligatorios para el vehículo: brand, model, year, max_load, tower_id."
    }
    ```
-   **Ejemplo de Respuesta de Error (403 Forbidden)**:
    ```json
    {
      "success": false,
      "error": "No autorizado. Se requiere una clave API válida."
    }
    ```
-   **Ejemplo de Respuesta de Error (404 Not Found)**:
    ```json
    {
      "success": false,
      "error": "La Tower especificada no existe."
    }
    ```
-   **Ejemplo de Respuesta de Error (500 Internal Server Error)**:
    ```json
    {
      "success": false,
      "error": "Error desconocido al crear vehículo."
    }
    ```

### `GET /api/vehicles/{id}`

-   **Descripción**: Obtiene un registro específico de la tabla `Vehicle` por su ID.
-   **Autenticación**: Se requiere una clave API de administrador válida (`x-api-key` en los headers).
-   **Parámetros de Ruta**:
    -   `id` (string, requerido): El `vehicle_id` del vehículo a obtener.
-   **Cuerpo de la Solicitud**: N/A
-   **Ejemplo de Respuesta Exitosa (200 OK)**:
    ```json
    {
      "success": true,
      "data": { "vehicle_id": "...", "brand": "...", "model": "...", "year": 2020, "max_load": 1500.5, "tower_id": "...", "deactivated": false, "createdAt": "...", "updatedAt": "..." }
    }
    ```
-   **Ejemplo de Respuesta de Error (403 Forbidden)**:
    ```json
    {
      "success": false,
      "error": "No autorizado. Se requiere una clave API válida."
    }
    ```
-   **Ejemplo de Respuesta de Error (404 Not Found)**:
    ```json
    {
      "success": false,
      "error": "Vehículo no encontrado."
    }
    ```
-   **Ejemplo de Respuesta de Error (500 Internal Server Error)**:
    ```json
    {
      "success": false,
      "error": "Error al obtener el vehículo."
    }
    ```

### `PATCH /api/vehicles/{id}`

-   **Descripción**: Actualiza un registro específico de la tabla `Vehicle` por su ID.
-   **Autenticación**: Se requiere una clave API de administrador válida (`x-api-key` en los headers).
-   **Parámetros de Ruta**:
    -   `id` (string, requerido): El `vehicle_id` del vehículo a actualizar.
-   **Cuerpo de la Solicitud (JSON)**:
    ```json
    {
      "brand": "string (opcional)",
      "model": "string (opcional)",
      "year": "number (entero, opcional)",
      "max_load": "number (flotante, opcional)",
      "tower_id": "string (opcional)",
      "deactivated": "boolean (opcional)"
    }
    ```
    *Al menos uno de los campos opcionales debe estar presente.*
-   **Ejemplo de Respuesta Exitosa (200 OK)**:
    ```json
    {
      "success": true,
      "data": { "vehicle_id": "...", "brand": "...", "model": "...", "year": 2022, "max_load": 1800.0, "tower_id": "...", "deactivated": false, "createdAt": "...", "updatedAt": "..." }
    }
    ```
-   **Ejemplo de Respuesta de Error (400 Bad Request)**:
    ```json
    {
      "success": false,
      "error": "No se proporcionaron datos para actualizar."
    }
    ```
-   **Ejemplo de Respuesta de Error (403 Forbidden)**:
    ```json
    {
      "success": false,
      "error": "No autorizado. Se requiere una clave API válida."
    }
    ```
-   **Ejemplo de Respuesta de Error (404 Not Found)**:
    ```json
    {
      "success": false,
      "error": "La Tower especificada no existe." // Si se intenta actualizar con un tower_id inexistente
    }
    ```
-   **Ejemplo de Respuesta de Error (500 Internal Server Error)**:
    ```json
    {
      "success": false,
      "error": "Error al actualizar el vehículo."
    }
    ```

### `DELETE /api/vehicles/{id}`

-   **Descripción**: Elimina un registro específico de la tabla `Vehicle` por su ID.
-   **Autenticación**: Se requiere una clave API de administrador válida (`x-api-key` en los headers).
-   **Parámetros de Ruta**:
    -   `id` (string, requerido): El `vehicle_id` del vehículo a eliminar.
-   **Cuerpo de la Solicitud**: N/A
-   **Ejemplo de Respuesta Exitosa (200 OK)**:
    ```json
    {
      "success": true
    }
    ```
-   **Ejemplo de Respuesta de Error (403 Forbidden)**:
    ```json
    {
      "success": false,
      "error": "No autorizado. Se requiere una clave API válida."
    }
    ```
-   **Ejemplo de Respuesta de Error (404 Not Found)**:
    ```json
    {
      "success": false,
      "error": "Vehículo no encontrado."
    }
    ```
-   **Ejemplo de Respuesta de Error (500 Internal Server Error)**:
    ```json
    {
      "success": false,
      "error": "Error al eliminar el vehículo."
    }
    ```
