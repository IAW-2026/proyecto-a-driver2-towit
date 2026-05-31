# 1.4 — Modelo de Datos por Aplicación

> **Tipo A — Plataforma de Transporte**

Para cada webapp, describir las entidades principales de su base de datos: tablas, campos relevantes y relaciones. No es necesario un DER formal, pero sí que quede claro qué persiste cada app.

También identificar posibles duplicados entre apps (ej: usuarios) y definir cómo se resuelven las inconsistencias.

---

## Tower App

### Entidades principales

<!-- Describir tablas y campos -->

#### **Tower**
- `tower_id: string`
- `clerk_id: string`
- `email: string`
- `full_name: string`
- `payments_alias: string`

#### **Vehicles**
- `vehicle_id: string`
- `brand: string`
- `model: string`
- `year: number`
- `max_load: number`

#### **Assignments**
- `assignment_id: string`
- `trip_id: string`
- `tower_id: string`
- `status: string`
- `location: {lat: string, long: string}`<br>
Posibles valores de status: `pending`, `accepted`, `completed`, `cancelled`

#### **Admin**
- `Admin_id: string`
- `clerk_id: string`
- `full_name: string`

---

## Rider App

### Entidades principales

<!-- Describir tablas y campos -->


#### **Customer**
- `customer_id: string`
- `clerk_id: string`
- `full_name: string`

#### **Trip**
- `trip_id: string`
- `customer_id: string`
- `tower_id: string`
- `vehicle_id: string`
- `origin: {lat: string, long: string}`
- `destination: {lat: string, long: string}`
- `date: string`
- `time: string`
- `status: string`

#### **Vehicle**
- `vehicle_id: string`
- `customer_id: string`
- `weight: number`
- `brand: string`
- `model: string`
- `year: number`

### Relaciones
- Un **Customer** puede tener múltiples **Trips**
- Un **Trip** pertenece a un único **Customer**
- Un **Trip** puede tener asignado un **Driver (Tower)**
- Un **Customer** puede tener uno o varios **Vehicles**

#### **Admin**
- `Admin_id: string`
- `clerk_id: string`
- `full_name: string`

<br>

---

## Payments App

### Entidades principales

#### **Payments**
- `transaction_id: string`
- `trip_id: string`
- `user_id: string`  <!-- Usuario que realiza el pago -->
- `amount: number`
- `external_id: string`
- `status: string`
- `created_at: string`
- `updated_at: string`
- `expiration_date: string`

#### **Disbursements** 
- `transaction_id: string`
- `trip_id: string`
- `amount: number`
- `user_id: string`  <!-- Usuario al que le liquidan el pago -->
- `payment_alias: string`
- `platform_fee: number`
- `external_id: string`
- `status: string`
- `created_at: string`

#### **Refunds** 
- `transaction_id: string`
- `trip_id: string`
- `amount: number`
- `user_id: string`  <!-- Usuario al que le devuelven el pago -->
- `refund_type: string`
- `external_id: string`
- `reason: string`
- `status: string`
- `created_at: string`

#### **Users**
- `clerk_id: string`
- `user_id: string`


#### **Admin**
- `Admin_id: string`
- `clerk_id: string`
- `full_name: string`

<!-- Describir tablas y campos -->

---

## Feedback App

### Entidades principales

<!-- Describir tablas y campos -->

#### **Calificacion**
- `id: string`
- `service_id: string`
- `rater_clerk_id: string`
- `rated_clerk_id: string`
- `rating: number`
- `tags: string`
- `comment: string`
- `type: string`
- `created_at: string`


#### **Reporte**
- `id_report: string`
- `reporter_clerk_id: string`
- `reported_clerk_id: string`
- `service_id: string`
- `reason: string`
- `description: string`
- `status: string`
- `created_at: string`


#### **UserRating**
- `clerk_id: string`
- `avg_rating: number`
- `total_ratings: number`
- `updated_at: string`

#### **Admin**
- `Admin_id: string`
- `clerk_id: string`
- `full_name: string`

---


## Datos duplicados y estrategia de consistencia

| Dato duplicado | Apps que lo tienen | Fuente de verdad | Estrategia |
|----------------|--------------------|-----------------|------------|
| Usuario (clerk_user_id) | Todas | Clerk | Cada app sincroniza al primer login vía webhook o lazy load |
| Referencia a usuario (tower_id) | Customer, Feedback y Payments apps | Tower app | Id de referencia para obtener datos necesarios a través de consultas |
| Referencia a viaje (customer_id) | Tower y Payments apps | Customer app | Id de referencia para obtener datos necesarios a través de consultas |
