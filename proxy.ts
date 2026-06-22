import { clerkClient, clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Definir las rutas públicas, de administrador y de tower.
// El matcher para /home también cubrirá las variantes con hash como /home#/sso-signin.
const isPublicPath = createRouteMatcher(['/', '/home(.*)', "/sign-in(.*)", "/sign-up(.*)"]);
const isAdminPath = createRouteMatcher(['/admin/dashboard']);
const isTowerPath = createRouteMatcher([
  '/dashboard',
  '/service',
  '/trips',
  '/trips/(.*)', // Coincide con /trips y /trips/{id}
  '/vehicles',
  '/payments',
  '/payments/(.*)', // Coincide con /payments y /payments/{id}
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth();
  const { pathname } = req.nextUrl;

  //si el usuario no está logeado
  if (!userId) {
    //lo redirecciono a /home en caso de que la ruta sea /
    if (pathname == "/" || !isPublicPath(req))
      return NextResponse.redirect(new URL("/home", req.url));
  } else {
    //si está logeado, obtengo el rol
    const userRole = sessionClaims?.role as 'admin' | 'tower' | 'deactivated_admin' | 'deactivated_tower' | undefined;
    const currentPath = req.nextUrl.pathname;

    // --- LÓGICA PARA USUARIOS DESACTIVADOS (PRIORIDAD ALTA) ---
    if (userRole === 'deactivated_admin' || userRole === 'deactivated_tower') {
      // Si el usuario está desactivado y no está en la página de aviso
      if (currentPath !== '/deactivated_user') {
        return NextResponse.redirect(new URL('/deactivated_user', req.url));
      }
      // Si el usuario está desactivado y YA está en la página de aviso, permitir el acceso.
      return NextResponse.next();
    }

    // --- LÓGICA PARA EVITAR QUE USUARIOS ACTIVOS ACCEDAN A /deactivated_user ---
    if (currentPath === '/deactivated_user') {
      // Redirigir a usuarios activos que intentan acceder a la página de desactivados
      if (userRole === 'admin') {
        return NextResponse.redirect(new URL('/admin/dashboard', req.url));
      } else { // Incluye 'tower' o cualquier otro rol no admin
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
    }

    // --- LÓGICA ORIGINAL PARA REDIRECCIONES DE ROLES ACTIVOS ---
    //y si está en una ruta pública, lo redirecciono a donde corresponde
    if (isPublicPath(req)) {
      if (userRole === 'tower') {
        return NextResponse.redirect(new URL('/dashboard', req.url)); // Tower logeado -> /dashboard
      }
      if (userRole === 'admin') {
        return NextResponse.redirect(new URL('/admin/dashboard', req.url)); // Admin logeado -> /admin/dashboard
      }
      
    //si no está en una ruta pública, lo redirecciono solamente si está en una parte de la app que no le corresponde
    } else if (!isTowerPath(req) && userRole === "tower") {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    } else if (!isAdminPath(req) && userRole === "admin") {
      return NextResponse.redirect(new URL("/admin/dashboard", req.url))
    }
  }
});

export const config = {
  matcher: [
    // 1. Coincidir con todas las rutas de la aplicación (UI y otras APIs) que deben ser procesadas por Clerk,
    //    excluyendo las rutas internas de Next.js, archivos estáticos, el webhook de Clerk,
    //    y específicamente las APIs bajo /api/tower/.
    //    Esto asegura que el middleware de Clerk NO se ejecute para /api/webhooks/clerk/(.*) ni /api/tower/(.*)
    //    pero SÍ lo haga para todas las rutas de la UI y cualquier otra API que no esté bajo esas exclusiones.
    '/((?!_next|api/tower/|api/webhooks/clerk|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // 2. Coincidir con rutas /trpc si las hubiera y debieran ser protegidas por Clerk.
    '/trpc(.*)',
  ],
};


