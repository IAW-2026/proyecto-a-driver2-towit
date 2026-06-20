'use client';

import { UserButton } from "@clerk/nextjs"; // Importa UserButton
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
// Se elimina la importación de useAccountDetailsModal ya que no se usará

export default function AppHeaderClientTower() {
  const router = useRouter();
  const pathname = usePathname();
  // Se elimina la desestructuración de openModal ya que no se usará

  const showDashboardButton = pathname !== "/dashboard";
  const showTripsLink = pathname !== "/trips";
  const showVehiclesLink = pathname !== "/vehicles";
  const showPaymentsLink = pathname !== "/payments";
  // showAccountDetailsLink ya no es necesario, UserButton siempre se mostrará para un usuario logueado.

  return (
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
      {/* Reemplazamos el botón y el avatar con el UserButton de Clerk */}
      <UserButton />
    </>
  );
}
