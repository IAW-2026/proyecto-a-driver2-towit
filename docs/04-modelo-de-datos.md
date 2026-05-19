# 1.4 — Modelo de Datos por Aplicación

> **Tipo A — Plataforma de Transporte**

Para cada webapp, describir las entidades principales de su base de datos: tablas, campos relevantes y relaciones. No es necesario un DER formal, pero sí que quede claro qué persiste cada app.

También identificar posibles duplicados entre apps (ej: usuarios) y definir cómo se resuelven las inconsistencias.

---

## Driver App

### Entidades principales

<!-- Describir tablas y campos -->

#### **Tower**
- `tower_id: string`
- `clerk_id: string`
- `full_name: string`
- `payments_alias`

#### **Vehicles**
- `vehicle_id: string`
- `brand: string`
- `model: string`
- `year: int`
- `max_load: int`

#### **Assignments**
- `assignment_id: string`
- `trip_id: string`
- `tower_id: string`
- `status: string`

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
- `origin: string`
- `destination: string`
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
- `id_user: string`  <!-- Usuario que realiza el pago -->
- `amount: float`
- `external_id: string`
- `status: string`
- `created_at: string`
- `updated_at: string`
- `expiration_date: string`

#### **Disbursements** 
- `transaction_id: string`
- `trip_id: string`
- `amount: float`
- `id_user: string`  <!-- Usuario al que le liquidan el pago -->
- `payment_alias: string`
- `platform_fee: float`
- `external_id: string`
- `status: string`
- `created_at: string`

#### **Refunds** 
- `transaction_id: string`
- `trip_id: string`
- `amount: float`
- `id_user: string`  <!-- Usuario al que le devuelven el pago -->
- `refund_type: string`
- `external_id: string`
- `reason: string`
- `status: string`
- `created_at: string`

#### **Users**
- `clerk_id: string`
- `id_user: string`


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

## Promotions App *(si aplica)*

### Entidades principales

<!-- Describir tablas y campos -->

---

## Datos duplicados y estrategia de consistencia

| Dato duplicado | Apps que lo tienen | Fuente de verdad | Estrategia |
|----------------|--------------------|-----------------|------------|
| Usuario (clerk_user_id) | Todas | Clerk | Cada app sincroniza al primer login vía webhook o lazy load |
| *(agregar otros)* | | | |
