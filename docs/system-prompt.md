# Contexto Global del Proyecto

## Visión General
Se está desarrollando una plataforma de oferta y demanda de servicios al estilo de Uber. El nombre de la plataforma es TowIt y se basa en la idea de que los usuarios puedan solicitar servicios de remolque sin necesidad de llamar a una aseguradora, pudiendo estos servicios de grúa ser provistos por otras personas normales.
La plataforma debe poder permitir conectar en tiempo real personas que necesiten servicios de remolque con personas que provean servicios de remolque.
La aplicación que se desarrolla en este proyecto es la Tower App, una de las cuatro aplicaciones que implementan la plataforma en su totalidad, junto con la Customer App, Payments App y Feedback App.
Cada aplicación maneja los servicios pertinentes a su dominio y realiza consultas a través de una API REST al resto de las apps cuando necesita datos del dominio de otra aplicación.
La Tower App, desarrollada en este proyecto, gestiona toda la información y servicios relevantes a los usuarios conductores que proveen sus servicios de grúa a los usuarios clientes (customers) de la plataforma. 

## Stack tecnológico estricto
- **Frontend & Framework:** Next.js (App Router, estructura de carpetas en la raíz, sin directorio `src/`).
- **Lenguaje:** TypeScript (Tipado estricto).
- **Estilos:** Tailwind CSS.
- **Base de Datos Persistente:** Neon (PostgreSQL Serverless).
- **Base de Datos en Memoria Rápida:** Upstash Redis.
- **ORM:** Prisma ORM.
- **Despliegue:** Vercel.

## Glosario y Ubicuidad
- Se denomina plataforma al sistema general de Towit, conformado por los 4 subsistemas Tower App, Customer App, Payments App y Feedback App, denominados aplicaciones.
- La platforma es llamada TowIt por la palabra Tow en inglés.
- Los conductores o usuarios que proveen sus servicios de remolque son denominados Towers.
- Los usuarios de la Customer App, que son quienes solicitan los servicios de remolque, son denominados Customers.

## Reglas de Negocio Fundamentales de la aplicación
- Los vehículos no pueden existir sin estar asociados a un tower.
- Los usuarios administradores y towers son diferentes entre sí, no se tratan de roles aplicados sobre los mismos usuarios.
- Los estados posibles para un tower loggeado son AVAILABLE y UNAVAILABLE.
- La información que cambia dinámicamente, como los estados de los towers y la ubicación en tiempo real de los mismos no se almacena en persistente, sino en una base de datos de memoria rápida y no persistente.

## Información sobre la documentación
- La arquitectura de la aplicación en mayor detalle se encuentra en /docs/agent-docs/architecture.md.
- La información pertinente al stack utilizado, interacción entre aplicaciones que conforman el stack de desarrollo y estilos de desarrollo se encuentra en /docs/agent-docs/stack.md.
- Los requerimientos funcionales escritos como historias de usuario y algunos criterios de validación sobre los mismos se encuentran en /docs/agent-docs/requirements.md.
- Las páginas en las que va a constar la aplicación se encuentran en /docs/agent-docs/views.md.
- La documentación generada durante la planificación del sistema, hecha por humanos, se encuentra en /docs, bajo ninguna subcarpeta. En particular, cada archivo:
    - 01-descripcion.md: contiene información sobre el problema a resolver, los actores de la plataforma y el flujo principal de uso.
    - 02-responsabilidades.md: contiene información sobre la asignación aplicación-dev y los nombres de los repositorios en github. También lista las entidades como tablas de la bases de datos de cada app. Por último, incluye una sección de comunicación entre aplicaciones, donde se detalla una tabla donde cada fila es una cuadrupla (apliación de origen, acción o dato necesario, aplicación con la que interactúa, API)
    - 03-apis.md: detalla los endpoints que provee cada aplicación, incluyendo url (parcial), parámetros y cuerpo de la respuesta.
    - 04-modelo-de-datos.md: detalla para cada aplicación las tablas que contienen y los campos de cada tablas, fundamentalmente describiendo la información que contiene la base de datos de cada aplicación.
    - 05-usuarios.md: define la plataforma en la que se delega el servicio de autenticación de usuarios, aplicaciones donde se puede autenticar el usuario de cada aplicación, claims jwt relevantes y estrategia de roles de usuario.
