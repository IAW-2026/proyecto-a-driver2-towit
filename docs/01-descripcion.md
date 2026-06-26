# 1.1 — Descripción del Sistema

> **Tipo A — Plataforma de Transporte**

## ¿Qué problema resuelve?

<!-- Describir el problema que resuelve el sistema y el dominio de aplicación específico elegido por la comisión. Ejemplo: una plataforma de transporte para zonas rurales con poca cobertura, orientada a conectar conductores particulares con pasajeros frecuentes. -->

La aplicación busca resolver la dificultad de acceder de manera rápida y confiable a servicios de remolque para vehículos averiados. Facilita la conexión entre quienes necesitan asistencia y quienes tienen la capacidad de remolcar vehículos.

## Actores del sistema

| Actor | Descripción | Apps donde interactúa |
|-------|-------------|----------------------|
| Conductor de grúa  | Se trata de un usuario que ofrece sus servicios de remolque. <br> Debe poder registrarse en la aplicación con sus datos personales y registrar el o los vehículos que va a utilizar para remolcar. Puede acceder al sistema para indicar su disponibilidad, recibir solicitudes y aceptar o rechazarlas. <br> Luego de finalizar el traslado, está obligado a calificar al cliente al que prestó sus servicios.<br> Puede acceder al historial de sus viajes y a sus clasificaciones obtenidas.<br> Puede acceder a su historial de pagos.| Driver App <br> Payments App <br> FeedBack App
 | Usuario cliente | Es un usuario que solicita servicios de remolque. A través de la aplicación puede pedir un viaje ingresando la ubicación de origen, el destino y los datos del vehículo averiado. Una vez completada esta información, el sistema muestra un costo estimado según el tipo de grúa requerida (grande, mediana o estándar) y el cliente podrá elegir la opción que desee. <br> Durante el servicio, puede visualizar la ubicación del remolque asignado y el tiempo estimado de llegada. Además, tiene acceso al historial de sus viajes, a las calificaciones recibidas y al registro de sus pagos.| Rider App <br> Payments App <br> FeedBack App
| Administradores | Son los responsables de supervisar el correcto funcionamiento del sistema. Son usuarios independientes para cada aplicación. Pueden moderar reseñas y calificaciones, gestionar reportes de usuarios y tomar acciones ante comportamientos inapropiados.<br> También pueden acceder a la información interna del sistema como usuarios activos, historial global de viajes, transacciones y calificaciones.|  Driver App<br>Rider App<br>Payments App<br>FeedBack App 
|



## Flujo principal de uso

<!-- Describir el flujo de punta a punta del caso de uso central del sistema. Ejemplo:

1. El pasajero solicita un viaje desde la **Rider App**.
2. La **Driver App** notifica a los conductores disponibles y uno acepta.
3. Al finalizar el viaje, la **Payments App** procesa el cobro al pasajero y la liquidación al conductor.
4. La **Feedback App** habilita la calificación mutua entre pasajero y conductor.
-->

1. El cliente solicita un servicio de remolque desde la **Rider App**, ingresando la ubicación de origen, el destino, los datos del vehículo averiado y el tipo de remolque deseado.
2. Al confirmarse la solicitud, la **Payments App** procesa el cobro al cliente y registra la operación a favor de TowIt.
3. La **Driver App** notifica la solicitud a los conductores de grúa disponibles.
4. Un conductor acepta la solicitud.
5. Durante el viaje, el cliente puede seguir la ubicación del remolque y consultar la información del conductor asignado desde la **Rider App**.
6. Al finalizar el servicio, el conductor marca el viaje como completado en la **Driver App**.
7. Luego, la **Payments App** liquida el pago correspondiente desde TowIt al conductor.
8. Por último, la **Feedback App** habilita la calificación mutua entre cliente y conductor.

4*. En el caso de que ningun conductor acepte la solicitud en un cierto tiempo se cancela automaticamente el viaje y se devuelve el dinero al Customer.


