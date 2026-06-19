import { clerkClient, clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { RedirectToSignIn } from '@clerk/nextjs';

// 1. Definir rutas que son consideradas "públicas" (accesibles sin autenticación)
// Excluye la raíz '/' de aquí, ya que tiene un comportamiento especial de redireccionamiento cuando no está logeado.
const publicRoutes = createRouteMatcher([
  '/home',
  '/sign-in(.*)',
  '/sign-up(.*)',
]);

// Rutas que SIEMPRE deben redirigir a /home si no está autenticado, o a dashboard si está autenticado
const alwaysRedirectRootIfUnauthenticated = createRouteMatcher(['/']);

// 2. Definir rutas específicas para Towers
const towerRoutes = createRouteMatcher([
  '/dashboard(.*)',
  '/service(.*)',
  '/payments(.*)',
  '/trips(.*)',
  '/vehicles(.*)',
]);

// 3. Definir rutas específicas para Admins
const adminRoutes = createRouteMatcher([
  '/admin(.*)', // Esto cubre /admin y /admin/dashboard
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();
  const url = req.nextUrl;
  const pathname = url.pathname;

  // 7. Al acceder a /admin se redirecciona a /admin/dashboard.
  if (pathname === '/admin') {
    return NextResponse.redirect(new URL('/admin/dashboard', url));
  }

  // Lógica si el usuario NO está autenticado (userId no existe)
  // 5. Si se intenta acceder a alguna ruta privada (tower o admin) sin logearse, se redirecciona a /home.
  // 6. Al acceder a '/', se redirecciona a: /home si no se logueó
  if (!userId) {
    // Si la ruta no es una ruta pública explícitamente definida, o es la raíz '/',
    // y no es un archivo interno de Next.js, redirigir para iniciar sesión.
    if (
      alwaysRedirectRootIfUnauthenticated(req) ||
      (!publicRoutes(req) && !pathname.startsWith('/_next'))
    ) {
      // Redirigir explícitamente a /home sin el parámetro redirect_url
      return NextResponse.redirect(new URL('/home', url));
    }
    // Si es una ruta pública definida (ej. /home, /sign-in, /sign-up) y no está logeado, permitir acceso.
    return NextResponse.next();
  }

  // Lógica si el usuario SÍ está autenticado (userId existe)
  const client = await clerkClient();
  const user = await client.users.getUser(userId)
  const userRole = user?.publicMetadata?.role;

  // 4. Si el usuario está logeado y trata de acceder a alguna ruta pública (o la raíz '/'),
  // se lo redirecciona a /dashboard (user role = tower) o a /admin/dashboard (user role = admin).
  // 6. Al acceder a '/', se redirecciona a: /dashboard o /admin/dashboard si se logueó.
  if (publicRoutes(req) || alwaysRedirectRootIfUnauthenticated(req)) {
    if (userRole === 'admin') {
      return NextResponse.redirect(new URL('/admin/dashboard', url));
    } else if (userRole === 'tower') {
      return NextResponse.redirect(new URL('/dashboard', url));
    }
    // Caso de usuario logeado sin rol definido, redirigir a un dashboard por defecto.
    // Asumimos /dashboard es el dashboard predeterminado si no hay un rol claro.
    return NextResponse.redirect(new URL('/dashboard', url));
  }

  // Lógica de autorización para rutas protegidas por rol (Admin/Tower)
  if (adminRoutes(req)) {
    if (userRole !== 'admin') {
      // Intenta acceder a una ruta de admin sin ser admin, redirigir a su dashboard de Tower
      return NextResponse.redirect(new URL('/dashboard', url));
    }
  } else if (towerRoutes(req)) {
    if (userRole !== 'tower') {
      // Intenta acceder a una ruta de tower sin ser tower, redirigir a su dashboard de Admin
      return NextResponse.redirect(new URL('/admin/dashboard', url));
    }
  }

  // Si llegó hasta aquí, el usuario está logeado y tiene permiso para la ruta actual.
  return NextResponse.next();
});

export const config = {
  matcher: [
    // Ignorar internos de Next.js y archivos estáticos, a menos que se encuentren en parámetros de búsqueda
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Siempre ejecutar para rutas API
    '/(api|trpc)(.*)',
  ],
};
