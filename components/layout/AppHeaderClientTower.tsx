'use client';

import { UserAvatar } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAccountDetailsModal } from "@/components/providers/AccountDetailsModalProvider";

export default function AppHeaderClientTower() {
  const router = useRouter();
  const pathname = usePathname();
  const { openModal: openAccountDetailsModal } = useAccountDetailsModal();

  const showDashboardButton = pathname !== "/dashboard";
  const showTripsLink = pathname !== "/trips";
  const showVehiclesLink = pathname !== "/vehicles";
  const showPaymentsLink = pathname !== "/payments";
  // showAccountDetailsLink siempre será true si el usuario está logeado,
  // pero se mantiene por consistencia con la lógica original si se quisiera cambiar.
  const showAccountDetailsLink = pathname !== "/account-details"; 

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
      {showAccountDetailsLink && (
        <button
          onClick={openAccountDetailsModal}
          className="text-sm font-medium text-slate-300 hover:text-white transition-colors flex items-center justify-between space-x-2 cursor-pointer"
        >
          <span>Mi Cuenta</span>
          <UserAvatar />
        </button>
      )}
    </>
  );
}
