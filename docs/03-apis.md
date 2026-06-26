# 1.3 — Diseño de APIs Inter-Servicios

> **Tipo A — Plataforma de Transporte**

Documentar cada endpoint que una app expone para ser consumido por otra app del sistema. Este contrato debe estar acordado por todos los integrantes antes de comenzar la Etapa 2.

---

## Tower App — Endpoints expuestos

<!-- Documentar los endpoints que expone esta app -->

### *Obtener nombre de Tower:* 

**Endpoint:**  
- GET /api/tower/{tower_id}/name

**Request params:**  
- tower_id: string

**Request body:**
```json
{}
```

**Response:**  
```json
{
  "fullname": "string" 
}
```

**Quién llama a quién:**  
- Feedback App → Tower App

### *Obtener datos de vehículo de Tower:* 

**Endpoint:**  
- GET /api/tower/vehicles/{vehicle_id}

**Request params:**  
- vehicle_id: string

**Request body:**
```json
{}
```

**Response:**  
```json
{
  "tower_id": "string",
  "brand": "string",
  "model": "string",
  "year": "number",
  "max_load": "number"
}
```

**Quién llama a quién:**  
- Customer App → Tower App

### *Solicitar tower para viaje:* 

**Endpoint:**  
- POST /api/tower/requests

**Request params:**
- Ninguno

**Request body:**
```json
{
  "customer_id": "string",
  "trip": {
    "id": "string",
    "origin": {"lat": "string","long": "string"},
    "destination": {"lat": "string","long": "string"},
  },
  "vehicle_data": {"brand": "string", "model": "string", "year": "number"},
  "preferred_tow_type": "string"
} 

```

**Response:**  
```json
{
  "success": boolean,
  "data": {
    "trip_id": "string",
    "status": "string"
  },
  "error": "string"
}
```

**Quién llama a quién:**  
- Customer App → Tower App

<br>

### *Consultar estado de tower asignado:* 

**Endpoint:**  
- GET /api/tower/requests/{trip_id}

**Request params:**  
- trip_id: string

**Request body:**
```json
{}
```

**Response:**  
```json
{
  "status": "string", // Valores posibles: "pending", "accepted", "cancelled", "completed"
  "location": { // Solo presente si status es "accepted"
    "lat": "string",
    "long": "string"
  }
}
```

**Quién llama a quién:**  
- Customer App → Tower App

<br>

### *Cancelar pedido de tower:* 

La intención del endpoint es poder recibir la cancelación de un pedido de viaje que todavía no encontró tower para ser asignado (`pending` en Redis). Ante el timeout en la Customer App, esta debería llamar a este endpoint para avisar la cancelación del pedido. También funciona para el caso normal de cancelación de un viaje ya asignado.

**Endpoint:**  
- PATCH /api/tower/requests/{trip_id}

**Request params:**  
- trip_id: string

**Request body:**
```json
{}
```

**Response:**  
```json
{
  "success": boolean,
  "data": {
    "assignment_id": "string",
    "trip_id": "string",
    "tower_id": "string",
    "status": "string", // "cancelled"
    "location": { "lat": "string", "long": "string" },
    "createdAt": "string",
    "updatedAt": "string"
  },
  "error": "string"
}
```
```

**Quién llama a quién:**  
- Customer App → Tower App

---


## Customer App — Endpoints expuestos

<!-- Documentar los endpoints que expone esta app -->

### *Obtener nombre de customer:* 

**Endpoint:**  
- GET /api/customer/{customer_id}/name

**Request params:**  
- customer_id: string

**Request body:**
```json
{}
```

**Response:**  
```json
{
  "fullname": "string" 
}
```

**Quién llama a quién:**  
- Feedback App → Customer App

<br>

### *Obtener viaje segun id de usuario:* 

**Endpoint:**  
- GET /api/customer/trips/{clerk_id} 

**Request params:**  
- clerk_id: string

**Request body:**
```json
{}
```

**Response:**  
```json
{
  "trip_id": "string",
  "customer_id": "string",
  "tower_id":"string",
  "origin": {"lat": "string", "long": "string"},
  "destination": {"lat": "string", "long": "string"},
  "status": "string",
  "date": "string"
}
```

**Quién llama a quién:**  
- Customer App → Customer App
- Payments App → Customer App
- Tower App → Customer App 

<br>

### *Confirmación de pago*

**Endpoint:**  
- POST /api/customer/trips/{trip_id}/payment-confirmation

**Request params:**  
- Ninguno

**Request body:**  
```json
{
  "transaction_id": "string",
  "status": "approved"
}
```

**Response:**  
```json
{}
```

**Quién llama a quién:**  
- Payments App → Customer App

<br>

### *Obtener estado de pago del viaje*

**Endpoint:**  
- GET /api/customer/trips/{trip_id}/payment-status/

**Request params:**  
- trip_id: string

**Request body:**  
```json
{}
```

**Response:**  
```json
{
  "trip_id": "string",
  "payment_status": "string",
}
```

**Quién llama a quién:**  
- Payments App → Customer App

<br>

### *Actualizar estado de viaje:* 

**Endpoint:**  
- PATCH /api/customer/trips/{trip_id}

**Request params:**
- Ninguno

**Request body:**
```json
{
  "tower_id": "string",
  "status": "string"
} 

```

**Response:**  
```json
{}
```

**Quién llama a quién:**  
- Tower App → Customer App

---

## Payments App — Endpoints expuestos

<!-- Documentar los endpoints que expone esta app -->

### *Generar el pago a realizarse asociado a un viaje:* 

**Endpoint:**  
- POST /api/payments/

**Request params:**  
- Ninguno

**Request body:**
```json
{
    "trip_id" : "number",
    "clerk_id": "string",
    "amount" : "number"
}
```

**Response:**  
```json
{ "transaction_id": "string"}
```

**Quién llama a quién:**  
- Customer App -> Payments App

<br>

### *Reembolsar dinero de un viaje cancelado:* 

**Endpoint:**  
- POST /api/payments/cancellations/

**Request params:**  
- Ninguno

**Request body:**
```json
{
    "trip_id": "string",
    "clerk_id": "string",
    "reason": "string",
    "refund_type": "string"
}
```

**Response:**  
```json
{ "transaction_id": "string"}
```

**Quién llama a quién:**  
- Customer App -> Payments App

<br>


### *Liquidar dinero de un viaje al conductor (Tower):* 

**Endpoint:**  
- POST /api/payments/disbursements/

**Request params:**  
- Ninguno

**Request body:**
```json
{
    "trip_id": "string",
    "clerk_id": "string",
    "payment_alias": "string",
    "platform_fee": "number"
}
```

**Response:**  
```json
{ "transaction_id": "string"}
```

**Quién llama a quién:**  
- Tower App -> Payments App


<br>


---

## Feedback App — Endpoints expuestos

<!-- Documentar los endpoints que expone esta app -->

### *Obtener calificación dada en un servicio:* 

**Endpoint:**  
- GET /api/feedback/rating/{trip_id}/{user_id} 

**Request params:**  
- trip_id: string
- user_id: string

**Request body:**
```json
{}
```

**Response:**  
```json
{
  "rating": "number" 
}
```

**Quién llama a quién:**  
- Tower App, Customer App → Feedback App

<br>

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

### *Obtener calificación promedio:* 

**Endpoint:**  
- GET /api/feedback/avg_rating/{user_id} 

**Request params:**  
- user_id: string

**Request body:**
```json
{}
```

**Response:**  
```json
{
  "avg_rating": "number" 
}
```

**Quién llama a quién:**  
- Tower App, Customer App → Feedback App

<br>
