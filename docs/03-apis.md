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
{}
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
  "status": "string",
  "location": {
    "lat": "string",
    "long": "string"
  }
}
```

**Quién llama a quién:**  
- Customer App → Tower App

<br>

### *Cancelar pedido de tower:* 

La intención del endpoint es poder recibir la cancelación de un pedido de viaje que todavía no encontró tower para ser asignado. Ante el timeout en la Customer App, esta debería llamar a este endpoint para avisar la cancelación del pedido. También funciona para el caso normal de cancelación.

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
{}
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
