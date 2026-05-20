# Requerimientos funcionales

## Roles de usuario
Los usuarios principales de la aplicación son denominados towers, según las reglas de negocio.
La aplicación debería tener dos secciones bien definidas: /admin y /home, correspondientes a los dos tipos de usuarios que maneja la aplicación, administradores y towers.
La página principal y las secciones de signin y signup deben permitir acceso sin autenticación, pero para acceder al resto de páginas el resto de usuarios debe estar autenticado.

## Historias de usuario
- Como tower quiero poder registrarme para realizar mis actividades en la app.
- Como tower quiero poder registrarme para realizar mis actividades en la app.
- Como tower quiero poder ver mi información de usuario.
- Como tower quiero poder agregar un vehículo a la lista de vehículos que tengo registrados en la aplicación para brindar mis servicios.
- Como tower quiero poder modificar la información de mis vehículos registrados.
- Como tower quiero poder eliminar un vehículo de mi lista de vehículos registrados.
- Como tower, al inicio de una sesión de trabajo en la aplicación, quiero poder seleccionar el vehículo que quiero utilizar en la sesión actual.
- Como tower quiero poder actualizar mi estado, poniéndome como disponible o no disponible para proveer mis servicios.
- Como tower, quiero que se me notifique ante pedidos de remolque para los que califique.
- Como tower, quiero poder aceptar o rechazar pedidos de rmeolque que me ofrezca la app. En caso de rechazar un pedido, la app no debe volver a considerarme para el mismo pedido.
- Como tower quiero poder ver los parámetros del viaje, una vez que acepté un viaje que me fue ofrecido.
    - Los parámetros del viaje incluyen ubicación origen del vehículo a ser remolcado y tiempo estimado de llegada a su ubicación.
- Como tower quiero poder ver los detalles del cliente que encargó el viaje que acepté, incluyendo su nombre completo, detalles del vehículo y clasificación.
- Como tower quiero poder cancelar un viaje que acepté.
- Como tower quiero poder ver mi ubicación actual en el mapa.
- Como tower quiero poder ver en tiempo real el recorrido a realizar para llegar al cliente cuyo viaje me fue asignado, desde mi ubicación actual.
- Como tower quiero poder confirmar el inicio de viaje una vez que haya llegado a la ubicación y esté trasladando al cliente.
- Como tower quiero que ante desvíos de la ruta planificada, la ruta para llegar a destino se recalcule desde mi posición actual.
- Como tower quiero poder indicar la finalización del viaje, una vez haya llegado al destino que fue indicado por el cliente.
- Como tower quiero poder calificar a mi cliente, una vez finalizado el viaje, puntuando en estrellas y dejando un comentario sobre el mismo.
- Los pagos por los viajes se acreditan a los towers una vez este confirma la finalización del viaje. Como tower quiero que se me notifique la recepción del pago correspondiente por el viaje que acabo de finalizar.
- Como tower quiero poder ver mi historial de viajes.
- Como tower quiero poder revisar el detalle de un viaje en mi historial de viajes.
- Como tower quiero poder reportar a un customer desde mi historial de viajes.
- Como tower quiero poder acceder a mi historial de liquidaciones.
- Como tower quiero poder revisar el detalle de una liquidación en mi historial de liquidaciones.


## Criterios de validación
- Cuando un tower cancela un viaje que aceptó, se le notifica al cliente y el pedido de viaje vuelve al servidor para que se lo ofrezca a otros towers.
- Cuando el tower llega a la ubicación indicada por el cliente (aproximada) para el inicio del viaje, el frontend debería ofrecerle al tower la opción de confirmar el inicio de viaje, no iniciar el viaje automáticamente.
- En el historial de viajes, el tower debe poder ver la fecha del remolque, el nombre completo del customer remolcado, los datos del vehículo y la ubicación destino del remolque.
- En el detalle de una entrada del historial de viajes, el tower debe poder ver la misma información que ve desde la vista general del historial de viajes, más las ubicaciones de inicio y destino, la calificación del customer remolcado, y el monto que le fue pagado,  y tener un botón que le permita ver el recibo de la transacción y otro que le permita crear un reporte sobre el customer.
