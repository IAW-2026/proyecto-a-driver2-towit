[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/zHeew8ip)
# driver

Aplicación **Driver** del [Proyecto IAW 2026](https://iaw-2026.github.io/proyecto/) — comisión `<!-- completar -->`.

Esta app corresponde al rol del conductor en el proyecto de tipo **A (Transporte)**.

---

Enunciado completo: <https://iaw-2026.github.io/proyecto/>

## Deploy
* https://proyecto-a-driver2-towit.vercel.app/home

## Usuarios de prueba
Vienen dos usuarios precargados de prueba:
* tower+clerk_test@iaw.com
* admin+clerk_test@iaw.com
Adicionalmente, vienen otros usuarios precargados, de los cuales se pueden destacar:
* tower+clerktest@iaw.com
* admin+clerktest@iaw.com
En realidad se trata de los mismos usuarios que los dos anteriores, con la salvedad de que los últimos dos son el pseudónimo en la base de datos de Neon, por haber sido creado antes y después renombrados.
Las contraseña de los usuarios es la misma y coincide con la especificada en los requerimientos.

## Descripción del proyecto
TowIt es una plataforma de servicios de remolque diseñada para conectar rápidamente a usuarios que necesitan asistencia (Customers) con conductores de grúa (Towers). Su objetivo principal es facilitar la provisión y solicitud de estos servicios, evitando intermediarios tradicionales.                         

La plataforma se compone de cuatro aplicaciones autónomas: Customer App, Payments App, Feedback App y Tower App. Cada una gestiona un dominio específico y se comunica con las demás mediante APIs REST para intercambiar información y coordinar los servicios.                                                      

La Tower App, foco de este proyecto, es responsable de toda la gestión de los conductores de grúa. Esto incluye la autenticación y administración de perfiles de los Towers, el registro de sus vehículos, la gestión de su disponibilidad y el procesamiento de las solicitudes de remolque.

Técnicamente, la Tower App está construida con Next.js (App Router), TypeScript y Tailwind CSS. Utiliza Neon (PostgreSQL) y Prisma ORM para datos persistentes, Upstash Redis para información en tiempo real (como la ubicación y el estado de los Towers), y Clerk para la autenticación de usuarios.

## Comentarios
Como decisiones de diseño/implementación relevantes:
* No se implementaron acciones que no son realistas, por ejemplo: abm de assignments (datos autogenerados en los viajes).
* No se mockearon las funcionalidades de notificar al usuario de la recepción del pago ni de calificar al customer, al finalizar un viaje. Se las consideró fuera de caso.
* No se implementó la subida de datos no persistentes a redis, dejándola para la siguiente etapa.
