'use client'

import { useUser } from "@clerk/nextjs";
import LandingPage from "@/components/LandingPage";
import TowerDashboard from "@/components/TowerDashboard";

export default function HomePage() {
  const { isLoaded, isSignedIn } = useUser();

  if (!isLoaded) {
    // Opcionalmente, puedes renderizar un spinner o un esqueleto de carga
    return <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center">Cargando...</div>;
  }

  return isSignedIn ? <TowerDashboard /> : <LandingPage />;
}
