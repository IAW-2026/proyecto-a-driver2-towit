# Listado de vistas

# Pantallas principales
- /home: la ubicación principal del sitio, a donde se redirecciona al acceder a /.
- /dashboard: página principal de towers logeados, a donde se los redirecciona desde /home si ya iniciaron sesión.
- /admin: página principal de administradores de la aplicación. Solo accesible por usuarios con rol de `admin`, redirecciona a `/home` si el usuario no está autenticado o no tiene el rol de administrador.
- /trips: contiene el listado de viajes realizados por el tower loggeado. Requiere autenticación como tower.
- /service: consiste de un mapa que ocupa toda la pantalla, donde el tower puede ver su ubicación actual y el recorrido a realizar en el viaje.

# Pantallas secundarias
- /account-details: donde se dispone la información del usuario. Requiere autenticación como tower.
- /vehicles: listado de vehículos del tower, con opciones para añadir, editar y eliminar. Requiere autenticación como tower.
- /trips/{id}: contiene los detalles sobre un viaje.
- /payments: contiene el listado de liquidaciones recibidas. Requiere autenticación como tower.
- /payments/{id}: contiene los detalles de una entrada en el historial de pagos recibidos.

