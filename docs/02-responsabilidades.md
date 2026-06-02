# 1.2 — Asignación de Responsabilidades

> **Tipo A — Plataforma de Transporte**

## Distribución de webapps

| App | Responsable | Repositorio |
|-----|-------------|-------------|
| Tower App (driver) | Iván Maciel | `proyecto-a-driver2-towit` |
| Customer App (rider) | Agustina Guastavino | `proyecto-a-rider-towit` |
| Payments App | Germán Schnaider | `proyecto-a-payments-towit` |
| Feedback App | Pablo Bonanno | `proyecto-a-feedback2-towit` |


---

## Datos propios de cada app

### Tower App
<!-- Entidades que viven en la base de datos de esta app -->
- Towers (drivers)
- Vehicles
- Assignments
- Admins

### Customer App
<!-- Entidades que viven en la base de datos de esta app -->
- Customers (riders)
- Trips
- Vehicles
- Admins

### Payments App
<!-- Entidades que viven en la base de datos de esta app -->
- Payments
- Disbursements
- Refunds
- Admins

### Feedback App
<!-- Entidades que viven en la base de datos de esta app -->
- Reports
- Ratings
- Admins

---

## Datos o acciones que requieren comunicación entre apps

| App origen | Acción / dato necesario | App destino | API involucrada |
|------------|------------------------|-------------|-----------------|
| Tower App | Actualizar estado de viaje | Customer App | /api/customer/trips/{trip_id} |
| Tower App | Ver historial de viajes | Customer App | /api/customer/trips |
| Tower App | Obtener calificación promedio (customer) | Feedback App | /api/feedback/rating/{user_id} |
| Tower App | Ver perfil de tower (calificación promedio) | Feedback App | /api/feedback/avg_rating/{user_id} |
| Customer App | Solicitar tower (crear request de viaje)            | Tower App     | /api/tower/requests |
| Customer App | Consultar estado del tower (ubicación / aceptación) | Tower App     | /api/tower/requests/{request_id} |
| Customer App | Generar pago del viaje                              | Payments App  | /api/payments/ |
| Customer App | Reembolsar el dinero de un viaje cancelado          | Payments App  | /api/payments/cancellations |
| Tower App    | Liquidar dinero de un viaje al conductor            | Payments App  | /api/payments/disbursements |
| Payments App | Notificar del resultado del pago de un viaje        | Customer App  | /api/customer/trips/{trip_id}/payment-confirmation |
| Customer App | Obtener calificación de un tower                    | Feedback App  | /api/feedback/rating/{user_id} |
| Customer App | Crear calificación del servicio                     | Feedback App  | /api/feedback |
| Feedback App | Obtener nombre de un tower | Tower App | /api/tower/{tower_id}/name |
| Feedback App | Obtener nombre de un customer | Customer App | /api/customer/{customer_id}/name |