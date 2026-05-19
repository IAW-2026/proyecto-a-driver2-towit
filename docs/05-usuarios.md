# 1.5 — Usuarios Compartidos

> **Tipo A — Plataforma de Transporte**

El sistema utiliza **Clerk** como servicio centralizado de autenticación. Los usuarios se autentican a través de Clerk independientemente de qué app estén usando, y la identidad se propaga entre servicios mediante el token JWT emitido por Clerk.

---

## ¿Qué apps comparten usuarios?

| Usuario | Apps donde puede autenticarse |
|---------|------------------------------|
| Tower | Tower app, Payments app, Feedback App |
| Customer | Customer app, Payments app, Feedback app |
| Tower admin | Tower app |
| Customer admin | Customer app |
| Payments admin | Payments app | 
| Feedback admin | Feedback app |

<!-- Definir claramente qué roles de usuario existen y en qué apps pueden autenticarse. Un mismo usuario de Clerk puede tener acceso a más de una app. -->

---

## Claims del JWT relevantes por app

| App | Claims utilizados | Para qué |
|-----|------------------|----------|
| Driver App | `sub` (user ID), `role` | Identificar conductor, verificar que es rol `tower` |
| Rider App | `sub` (user ID), `role` | Identificar pasajero, verificar que es rol `customer` |
| Payments App | `sub` (user ID), `role` | Verificar identidad, asociar transacciones al usuario y saber en qué endpoint pedir el historial de viajes |
| Feedback App | `sub` (user ID), `role` | Verificar identidad del calificador y controla si el que está calificando es un Custormer o Tower |



---

## Estrategia de roles

Para definir cómo un usuario es perteneciente a determinado rol se usa la metadata de role de Clerk, esto determina en las diferentes apps el rol del usuario.

<!-- Describir cómo se define si un usuario es conductor, pasajero o administrador.
Opciones comunes:
- Metadata en Clerk: `publicMetadata.role = "driver" | "rider" | "admin"`
- Organización separada por tipo de usuario en Clerk
- Roles gestionados localmente en cada app
-->
