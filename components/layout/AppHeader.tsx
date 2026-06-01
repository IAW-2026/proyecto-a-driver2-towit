'use client';

import { SignInButton, SignUpButton, UserAvatar, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation"; // Importar useRouter y usePathname
import { useState } from "react"; // Importar useState
import { Button } from "@/components/ui/button"; // Importar Button
import { MenuIcon } from "lucide-react"; // Importar MenuIcon
import { Dialog, DialogTrigger } from "@/components/ui/dialog"; // Importar Dialog y DialogTrigger (desde components/ui/sheet.tsx)
import MobileMenu from "./MobileMenu"; // Importar el nuevo componente MobileMenu

export default function AppHeader() {
  const { isSignedIn = false } = useUser();
  const router = useRouter(); // Inicializar useRouter
  const pathname = usePathname(); // Obtener la ruta actual
  const [isMenuOpen, setIsMenuOpen] = useState(false); // Estado para controlar la apertura del menú móvil

  const handleOpenMenu = () => setIsMenuOpen(true);
  const handleCloseMenu = () => setIsMenuOpen(false);

  const showDashboardButton = isSignedIn && pathname !== "/dashboard";
  const showTripsLink = isSignedIn && pathname !== "/trips";
  const showVehiclesLink = isSignedIn && pathname !== "/vehicles";
  const showPaymentsLink = isSignedIn && pathname !== "/payments";
  const showAccountDetailsLink = isSignedIn && pathname !== "/account-details";

  return (
    <header className="border-b border-slate-800 bg-slate-950/50 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/home" className="flex items-center gap-2"> {/* Enlace al inicio */}
            <span className="text-2xl font-black tracking-wider text-yellow-500">Tow<span className="text-white">It</span></span>
            <span className="bg-yellow-500/10 text-yellow-500 text-xs font-semibold px-2 py-0.5 rounded border border-yellow-500/20">Towers</span>
          </Link>
        </div>

        {/* Navegación para escritorio */}
        <nav className="hidden md:flex items-center gap-4">
          {!isSignedIn ? (
            <>
              <SignInButton mode="modal">
                <button className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
                  Iniciar Sesión
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="bg-yellow-500 hover:bg-yellow-400 text-slate-950 text-sm font-bold px-4 py-2 rounded-lg transition-all shadow-lg shadow-yellow-500/10">
                  Registrarse
                </button>
              </SignUpButton>
            </>
          ) : (
            <>
              {showTripsLink && (
                <Link href="/trips" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
                  Mis Viajes
                </Link>
              )}
              {showVehiclesLink && (
                <Link href="/vehicles" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
                  Mis Vehículos
                </Link>
              )}
              {showPaymentsLink && (
                <Link href="/payments" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
                  Mis Liquidaciones
                </Link>
              )}
              {showDashboardButton && (
                <Button
                  variant="ghost"
                  onClick={() => router.push('/dashboard')}
                  className="text-sm font-medium text-yellow-500 hover:text-yellow-500 underline-offset-4 transition-colors"
                >
                  Dashboard
                </Button>
              )}
              {showAccountDetailsLink && (
                <button
                  onClick={() => router.push('/account-details')}
                  className="text-sm font-medium text-slate-300 hover:text-white transition-colors flex items-center justify-between space-x-2 cursor-pointer"
                >
                  <span>Mi Cuenta</span>
                  <UserAvatar />
                </button>
              )}
            </>
          )}
        </nav>

        {/* Menú móvil */}
        <div className="md:hidden flex items-center">
          <Dialog open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" onClick={handleOpenMenu}>
                <MenuIcon className="size-6 text-white" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </DialogTrigger>
            <MobileMenu isSignedIn={isSignedIn} onClose={handleCloseMenu} />
          </Dialog>
        </div>
      </div>
    </header>
  );
}
