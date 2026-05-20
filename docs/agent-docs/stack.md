# Stack Tecnológico y Reglas del Código

## 1. Core Stack
- **Framework:** Next.js (App Router, estructura en la raíz, sin directorio `src/`).
- **Lenguaje:** TypeScript (Tipado estricto).
- **Estilos:** Tailwind CSS.
- **Base de Datos Persistente:** Neon (PostgreSQL Serverless) + Prisma ORM.
- **Base de Datos en Memoria Rápida:** Upstash Redis (SDK oficial `@upstash/redis`).
- **Hosting de Despliegue:** Vercel.
- **Sistema de autenticación:** Clerk.

## 2. Directrices de Base de Datos Relacional (Prisma + Neon)
- Se gestiona a través de una instancia única en `lib/prisma.ts`.
- Las tablas en `schema.prisma` contienen los datos estructurales del Chofer y la Grúa.
- **IMPORTANTE:** El campo de estado actual o ubicación cambiante de los choferes NO debe declararse como columna en el modelo de Prisma para evitar escrituras masivas en PostgreSQL.

## 3. Directrices de Base de Datos en Memoria (Upstash Redis)
- Se gestiona a través de una instancia única en `lib/redis.ts` usando `@upstash/redis`.
- Se debe respetar una estructura estricta de nombres de llaves (*keys*) utilizando prefijos para mantener el orden:
  - **Estado del Chofer:** `driver:{driverId}:status` -> Guarda un string (`AVAILABLE`, `OCCUPIED`).
  - **Ubicación del Chofer:** `driver:{driverId}:location` -> Guarda un objeto JSON con `{ lat: number, lng: number, updatedAt: number }`.
- Todas las llaves efímeras de ubicación deben tener un tiempo de expiración (TTL) razonable para no acumular basura si un chofer se desconecta.

## 4. Estilo de Desarrollo y Convenciones de Código
- **Componentes:** Servidor por defecto, `"use client"` solo si hay interactividad.
- **Llamadas HTTP:** Uso estricto de `fetch` nativo para comunicarse con Customer, Payments o Feedback. Prohibido instalar `axios`.
- **Server Actions:** Alojar en `app/actions/`. Deben manejar bloques `try/catch` y retornar el formato estándar: `{ success: boolean, data?: any, error?: string }`.