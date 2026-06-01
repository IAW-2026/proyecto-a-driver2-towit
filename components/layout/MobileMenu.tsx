"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation"; // Importar usePathname
import { useClerk, SignInButton, SignUpButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog"; // Utiliza componentes de Dialog
import { cn } from "@/lib/utils"; // Importa la utilidad cn
import { VisuallyHidden } from "radix-ui";

interface MobileMenuProps {
  isSignedIn: boolean;
  onClose: () => void; // Función para cerrar el diálogo
}

export default function MobileMenu({ isSignedIn, onClose }: MobileMenuProps) {
  const router = useRouter();
  const pathname = usePathname(); // Obtener la ruta actual
  const { signOut } = useClerk();

  const handleSignOut = async () => {
    await signOut({ redirectUrl: '/home' });
    onClose(); // Cierra el menú después de cerrar sesión
  };

  const navigateAndClose = (path: string) => {
    router.push(path);
    onClose();
  };

  const showDashboardButton = isSignedIn && pathname !== "/dashboard";
  const showTripsLink = isSignedIn && pathname !== "/trips";
  const showVehiclesLink = isSignedIn && pathname !== "/vehicles";
  const showPaymentsLink = isSignedIn && pathname !== "/payments";
  const showAccountDetailsLink = isSignedIn && pathname !== "/account-details";

  return (
    <DialogContent
      className={cn(
        "p-6 max-w-3/4 max-h-[90vh]", // Restaura el centrado y altura automática de DialogContent, ajusta ancho y altura máxima
        "bg-slate-900/95 backdrop-blur-md border border-slate-800 text-white flex flex-col", // Estilos específicos para el menú móvil
        // Las animaciones y el posicionamiento central son manejados por el DialogContent base
      )}
      showCloseButton={true} // Usa el botón de cierre integrado de DialogContent
    >
      <DialogHeader className="pb-4 border-b border-slate-800">
        <DialogTitle asChild>
          <Link href="/home" className="flex items-center gap-2" onClick={onClose}>
            <span className="text-2xl font-black tracking-wider text-yellow-500">Tow<span className="text-white">It</span></span>
            <span className="bg-yellow-500/10 text-yellow-500 text-xs font-semibold px-2 py-0.5 rounded border border-yellow-500/20">Towers</span>
          </Link>
        </DialogTitle>
        <VisuallyHidden.Root>
          <DialogDescription className="text-slate-400">Menú de navegación</DialogDescription>
        </VisuallyHidden.Root>
      </DialogHeader>
      <nav className="flex flex-col gap-4 flex-1">
        {isSignedIn ? (
          <>
            {showDashboardButton && (
              <DialogClose asChild>
                <Button variant="ghost" className="justify-start text-base text-yellow-500 hover:underline underline-offset-4" onClick={() => navigateAndClose("/dashboard")}>
                  Dashboard
                </Button>
              </DialogClose>
            )}
            {showTripsLink && (
              <DialogClose asChild>
                <Button variant="ghost" className="justify-start text-base text-slate-300 hover:text-white" onClick={() => navigateAndClose("/trips")}>
                  Mis Viajes
                </Button>
              </DialogClose>
            )}
            {showVehiclesLink && (
              <DialogClose asChild>
                <Button variant="ghost" className="justify-start text-base text-slate-300 hover:text-white" onClick={() => navigateAndClose("/vehicles")}>
                  Mis Vehículos
                </Button>
              </DialogClose>
            )}
            {showPaymentsLink && (
              <DialogClose asChild>
                <Button variant="ghost" className="justify-start text-base text-slate-300 hover:text-white" onClick={() => navigateAndClose("/payments")}>
                  Mis Liquidaciones
                </Button>
              </DialogClose>
            )}
            {showAccountDetailsLink && (
              <DialogClose asChild>
                <Button variant="ghost" className="justify-start text-base text-slate-300 hover:text-white" onClick={() => navigateAndClose("/account-details")}>
                  Mi Cuenta
                </Button>
              </DialogClose>
            )}
            <DialogClose asChild>
              <Button variant="ghost" className="justify-start text-base text-red-400 hover:text-red-300 mt-auto" onClick={handleSignOut}>
                Cerrar Sesión
              </Button>
            </DialogClose>
          </>
        ) : (
          <>
            <DialogClose asChild>
              <SignInButton mode="modal">
                <Button variant="ghost" className="justify-start text-base text-slate-300 hover:text-white" onClick={onClose}>
                  Iniciar Sesión
                </Button>
              </SignInButton>
            </DialogClose>
            <DialogClose asChild>
              <SignUpButton mode="modal">
                <Button variant="ghost" className="justify-start text-base bg-yellow-600 hover:bg-yellow-500 text-slate-950 font-bold" onClick={onClose}>
                  Registrarse
                </Button>
              </SignUpButton>
            </DialogClose>
          </>
        )}
      </nav>
    </DialogContent>
  );
}
