# Endpoints de otras apps que son fuentes de información

## Trips

Permite obtener el listado de viajes asociados al tower:
* Endpoint: GET CUSTOMER_APP_URL/api/customer/trips/[clerk_id]
* Response 200 - Array de viajes con el siguiente formato:
```
[
  {
    "trip_id": "string",
    "customer_id": "string",
    "tower_id": "string",
    "origin": { "lat": "string", "long": "string" },
    "destination": { "lat": "string", "long": "string" },
    "status": "string",
    "date": "string"
  }
]
```
---
Endpoint donde al aceptar o completar un viaje se actualiza la asignación de torre y el estado del viaje.
* Endpoint: PATCH CUSTOMER_APP_URL/api/customer/trips/:trip_id
* Request body:
```
{ "tower_id": "string", "status": "string" }
```
* Response 200
```{}```
---
Obtiene el nombre completo del cliente por su ID numérico.
* Endpoint: *GET CUSTOMER_APP_URL/api/customer/[clerk_id]/name
* Response 200:
```
{ "fullname": "string" }
```
