import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/home',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks/clerk',
]);

const isTowerRoute = createRouteMatcher([
  '/dashboard',
  '/service',
  '/trips(.*)', // Incluye /trips y /trips/[id]
  '/account-details',
  '/vehicles(.*)', // Incluye /vehicles y sub-rutas de gestión de vehículos
  '/payments',
]);

const isAdminRoute = createRouteMatcher([
  '/admin(.*)', // Cubre /admin, /admin/dashboard, etc.
]);

export default clerkMiddleware(async (auth, request) => {
  const { userId, sessionClaims } = await auth();
  const homeUrl = new URL('/home', request.url);
  const dashboardUrl = new URL('/dashboard', request.url);
  const adminDashboardUrl = new URL('/admin/dashboard', request.url); // Asumiendo que existe o existirá

  // 1. Permitir acceso a rutas públicas
  if (isPublicRoute(request)) {
    return;
  }

  // 2. Redirigir a /home si no es una ruta pública y el usuario no está autenticado
  if (!userId) {
    return NextResponse.redirect(homeUrl);
  }

  // 3. Usuario autenticado, verificar roles
  const userRole = sessionClaims?.role as string | undefined;
  

  // Lógica para usuarios con rol 'admin'
  if (userRole === 'admin') {
    // Si un admin intenta acceder a una ruta de tower, redirigirlo al dashboard de admin
    if (isTowerRoute(request)) {
      return NextResponse.redirect(adminDashboardUrl);
    }
    // Si no es una ruta de tower, permitirle el acceso (asumiendo que es una ruta de admin o permitida para admins)
    return;
  }

  // Lógica para usuarios con rol 'tower'
  if (userRole === 'tower') {
    // Si un tower intenta acceder a una ruta de admin, o a cualquier ruta que no sea de tower (y no pública), redirigirlo a su dashboard
    if (isAdminRoute(request) || !isTowerRoute(request)) {
      return NextResponse.redirect(dashboardUrl);
    }
    // Si es una ruta de tower, permitir el acceso
    return;
  }

  // 4. Fallback: Usuario autenticado pero con rol no reconocido (o sin rol)
  // Si intenta acceder a cualquier ruta no pública, redirigir a /home
  return NextResponse.redirect(homeUrl);
});

export const config = {
  matcher: [
    // Ignorar internos de Next.js y archivos estáticos, a menos que se encuentren en parámetros de búsqueda
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Siempre ejecutar para rutas API
    '/(api|trpc)(.*)',
  ],
};
