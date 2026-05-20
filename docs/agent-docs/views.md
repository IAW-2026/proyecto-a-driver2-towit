# Listado de vistas

# Pantallas principales
- /home: la ubicación principal del sitio, a donde se redirecciona al acceder a /.
- /login: login para usuarios.
- /signup: signup para usuarios.
- /admin/dashboard: página principal de administradores de la aplicación, redirecciona a /admin/login cuando no se está autenticado como administrador.
- /trips: contiene el listado de viajes realizados por el tower loggeado. Requiere autenticación como tower.
- /service: consiste de un mapa que ocupa toda la pantalla, donde el tower puede ver su ubicación actual y el recorrido a realizar en el viaje.

# Pantallas secundarias
- /account-details: donde se dispone la información del usuario. Requiere autenticación como tower.
- /trips/{id}: contiene los detalles sobre un viaje.
- /payments/{id}: contiene los detalles de una entrada en el historial de pagos recibidos.

