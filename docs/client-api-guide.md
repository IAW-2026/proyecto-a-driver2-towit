# Guía de Uso de la API de Tower App para Customer App 

Este documento proporciona una guía detallada para el equipo de desarrollo que consumirá los endpoints de la `Tower App`. Describe los endpoints disponibles, sus parámetros, la estructura de la solicitud y respuesta, y ejemplos de uso.

## Autenticación

Todos los endpoints requieren una clave API secreta (`x-api-key`) en el encabezado de la solicitud para autenticación. Asegúrate de obtener esta clave del equipo de administración de la `Tower App`.

**Header Requerido:**
`x-api-key: [TU_API_KEY]`

---

## Endpoints Implementados

### 1. Solicitar Tower para Viaje

Este endpoint permite a la `Customer App` enviar una solicitud de viaje. La solicitud se almacena inicialmente en Redis con un estado `pending` y tiene un tiempo de vida (TTL) de 5 minutos, a la espera de que un Tower la acepte.

*   **Endpoint:** `/api/tower/requests`
*   **Método:** `POST`
*   **Headers:**
    *   `Content-Type: application/json`
    *   `x-api-key: [TU_API_KEY]`

*   **Cuerpo de la Solicitud (JSON):**
    ```json
    {
      "customer_id": "string",
      "trip": {
        "id": "string",
        "origin": {"lat": "string", "long": "string", "address": "string"},
        "destination": {"lat": "string", "long": "string", "address": "string"}
      },
      "vehicle_data": {"brand": "string", "model": "string", "year": "number"},
      "preferred_tow_type": "string",
      "service_value": "number"
    }
    ```
    *   `customer_id`: ID único del cliente.
    *   `trip.id`: ID único del viaje.
    *   `trip.origin`: Coordenadas de latitud, longitud y dirección de origen del viaje.
    *   `trip.destination`: Coordenadas de latitud, longitud y dirección de destino del viaje.
    *   `vehicle_data`: Detalles del vehículo que necesita el servicio.
    *   `preferred_tow_type`: Tipo de remolque preferido (ej. "standard", "platform").
    *   `service_value`: Valor monetario estimado del servicio.

*   **Respuestas Posibles:**

    *   **200 OK - Solicitud Creada Exitosamente**
        ```json
        {
          "success": true,
          "data": {
            "trip_id": "trip_ABCDEF",
            "status": "pending"
          }
        }
        ```

    *   **400 Bad Request - Datos de Solicitud Inválidos**
        ```json
        {
          "success": false,
          "error": "Datos de solicitud inválidos.",
          "details": {
            "fieldErrors": {
              "customer_id": ["Required"],
              "trip.id": ["Required"]
            }
          }
        }
        ```
        (Los `details` pueden variar según el error de validación de `zod`).

    *   **403 Forbidden - No Autorizado**
        ```json
        {
          "success": false,
          "error": "No autorizado. Se requiere una clave API válida."
        }
        ```

    *   **404 Not Found - No se Encontraron Towers Activos Disponibles**
        ```json
        {
          "success": false,
          "error": "No se pudieron encontrar towers activos disponibles en este momento."
        }
        ```

    *   **500 Internal Server Error - Error Interno del Servidor**
        ```json
        {
          "success": false,
          "error": "Error interno del servidor al procesar la solicitud."
        }
        ```

*   **Ejemplo `curl`:**
    ```bash
    curl -X POST \
      http://localhost:3000/api/tower/requests \
      -H "x-api-key: TU_API_KEY_AQUI" \
      -H "Content-Type: application/json" \
      -d '{
            "customer_id": "cust_EXAMPLE_ID",
            "trip": {
              "id": "trip_REQ_XYZ123",
              "origin": {"lat": "-38.7196", "long": "-62.2651", "address": "Calle Falsa 123, Bahía Blanca"},
              "destination": {"lat": "-38.7000", "long": "-62.2500", "address": "Avenida Siempre Viva 742, Bahía Blanca"}
            },
            "vehicle_data": {
              "brand": "Toyota",
              "model": "Hilux",
              "year": 2020
            },
            "preferred_tow_type": "standard",
            "service_value": 5000.75
          }'
    ```

---

### 2. Consultar Estado de Solicitud de Tower

Permite a la `Customer App` consultar el estado actual de una solicitud de viaje en Redis. Si la solicitud ha sido `accepted` por un tower, también se incluirá la ubicación actual de ese tower.

*   **Endpoint:** `/api/tower/requests/{trip_id}`
*   **Método:** `GET`
*   **Headers:**
    *   `x-api-key: [TU_API_KEY]`

*   **Parámetros de Ruta:**
    *   `trip_id` (string): El ID del viaje para el que se consulta el estado de la solicitud.

*   **Cuerpo de la Solicitud (JSON):** Vacío `{}`

*   **Respuestas Posibles:**

    *   **200 OK - Estado de Solicitud (Pending/Accepted/Cancelled/Completed)**
        ```json
        {
          "success": true,
          "data": {
            "status": "pending",
            "location": { "lat": "", "long": "" }
          }
        }
        ```
        Si el estado es `accepted`:
        ```json
        {
          "success": true,
          "data": {
            "status": "accepted",
            "location": { "lat": "-38.7100", "long": "-62.2600" }
          }
        }
        ```
        **Estados válidos:** `"pending"`, `"accepted"`, `"cancelled"`, `"completed"`.
        La `location` solo se rellena si `status` es `"accepted"`.

    *   **403 Forbidden - No Autorizado**
        ```json
        {
          "success": false,
          "error": "No autorizado. Se requiere una clave API válida."
        }
        ```

    *   **404 Not Found - Solicitud de Viaje No Encontrada**
        ```json
        {
          "success": false,
          "error": "Solicitud de viaje no encontrada en Redis."
        }
        ```

    *   **500 Internal Server Error - Error Interno del Servidor**
        ```json
        {
          "success": false,
          "error": "Error interno del servidor."
        }
        ```

*   **Ejemplo `curl`:**
    ```bash
    curl -X GET \
      http://localhost:3000/api/tower/requests/trip_REQ_XYZ123 \
      -H "x-api-key: TU_API_KEY_AQUI"
    ```

---

### 3. Cancelar Pedido de Tower

Permite a la `Customer App` cancelar una solicitud de viaje. Este endpoint funciona tanto para solicitudes que aún están buscando un tower (`pending` en Redis) como para aquellas que ya han sido asignadas (actualiza la base de datos de Neon y libera al Tower en Redis).

*   **Endpoint:** `/api/tower/requests/{trip_id}`
*   **Método:** `PATCH`
*   **Headers:**
    *   `Content-Type: application/json`
    *   `x-api-key: [TU_API_KEY]`

*   **Parámetros de Ruta:**
    *   `trip_id` (string): El ID del viaje que se desea cancelar.

*   **Cuerpo de la Solicitud (JSON):** Vacío `{}`

*   **Respuestas Posibles:**

    *   **200 OK - Viaje Cancelado Exitosamente**
        ```json
        {
          "success": true,
          "data": {
            "assignment_id": "uuid_de_asignacion",
            "trip_id": "trip_XYZ123",
            "tower_id": "uuid_de_torre",
            "status": "cancelled",
            "location": { "lat": "-38.7196", "long": "-62.2651" },
            "createdAt": "2023-01-01T00:00:00.000Z",
            "updatedAt": "2023-01-01T00:00:00.000Z"
          }
        }
        ```
        (El `data` contendrá la información de la asignación actualizada en Neon.)

    *   **400 Bad Request - Viaje Ya Cancelado/Completado**
        ```json
        {
          "success": false,
          "error": "El viaje ya está en estado cancelled."
        }
        ```

    *   **403 Forbidden - No Autorizado**
        ```json
        {
          "success": false,
          "error": "No autorizado. Se requiere una clave API válida."
        }
        ```

    *   **404 Not Found - Viaje No Encontrado o No Asignado**
        ```json
        {
          "success": false,
          "error": "Viaje no encontrado o no asignado."
        }
        ```

    *   **500 Internal Server Error - Error Interno del Servidor**
        ```json
        {
          "success": false,
          "error": "Error interno del servidor al cancelar la solicitud."
        }
        ```

*   **Ejemplo `curl`:**
    ```bash
    curl -X PATCH \
      http://localhost:3000/api/tower/requests/trip_XYZ123 \
      -H "x-api-key: TU_API_KEY_AQUI" \
      -H "Content-Type: application/json" \
      -d '{}'
    ```
