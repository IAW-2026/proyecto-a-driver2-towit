import { clerkClient, clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Definir las rutas públicas, de administrador y de tower.
// El matcher para /home también cubrirá las variantes con hash como /home#/sso-signin.
const isPublicPath = createRouteMatcher(['/', '/home(.*)']);
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
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const userRole = sessionClaims?.role as 'admin' | 'tower' | undefined;
    
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
    // Ignorar internos de Next.js y archivos estáticos, a menos que se encuentren en parámetros de búsqueda
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Siempre ejecutar para rutas API
    '/(api|trpc)(.*)',
  ],
};
