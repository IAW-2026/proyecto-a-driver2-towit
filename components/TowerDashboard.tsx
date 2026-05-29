'use client'

import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { useState } from "react";

export default function TowerDashboard() {
  const [isAvailable, setIsAvailable] = useState(false);

  const toggleAvailability = () => {
    setIsAvailable(!isAvailable);
    // TODO: Implementar la llamada a la API para actualizar el estado del tower en Redis
    console.log(`Estado del Tower: ${isAvailable ? 'AVAILABLE' : 'UNAVAILABLE'}`);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Encabezado para usuarios autenticados */}
      <header className="border-b border-slate-800 bg-slate-950/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black tracking-wider text-yellow-500">Tow<span className="text-white">It</span></span>
            <span className="bg-yellow-500/10 text-yellow-500 text-xs font-semibold px-2 py-0.5 rounded border border-yellow-500/20">Towers</span>
          </div>

          <nav className="flex items-center gap-4">
            <Link href="/trips" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
              Mis Viajes
            </Link>
            <Link href="/account-details" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
              Mi Cuenta
            </Link>
            <UserButton />
          </nav>
        </div>
      </header>

      <main className="flex-1 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-10 text-center max-w-4xl mx-auto">
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-10">
          Panel de Control de Tower
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
          <button
            onClick={toggleAvailability}
            className={`px-6 py-4 rounded-xl text-lg font-bold transition-all shadow-lg w-full ${
              isAvailable
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                : 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/20'
            }`}
          >
            Estado: {isAvailable ? 'Disponible' : 'No Disponible'}
          </button>

          <Link href="/service" className="bg-yellow-500 hover:bg-yellow-400 text-slate-950 text-lg font-bold px-6 py-4 rounded-xl transition-all shadow-lg shadow-yellow-500/20 w-full flex items-center justify-center">
            Ir al Panel de Servicio
          </Link>

          <Link href="/trips" className="bg-slate-700 hover:bg-slate-600 text-white text-lg font-bold px-6 py-4 rounded-xl transition-all shadow-lg shadow-slate-700/20 w-full flex items-center justify-center">
            Ver Mis Viajes
          </Link>

          <Link href="/account-details" className="bg-slate-700 hover:bg-slate-600 text-white text-lg font-bold px-6 py-4 rounded-xl transition-all shadow-lg shadow-slate-700/20 w-full flex items-center justify-center">
            Mi Cuenta
          </Link>

          <Link href="/vehicles" className="bg-slate-700 hover:bg-slate-600 text-white text-lg font-bold px-6 py-4 rounded-xl transition-all shadow-lg shadow-slate-700/20 w-full flex items-center justify-center">
            Gestionar Vehículos
          </Link>

          <Link href="/payments" className="bg-slate-700 hover:bg-slate-600 text-white text-lg font-bold px-6 py-4 rounded-xl transition-all shadow-lg shadow-slate-700/20 w-full flex items-center justify-center">
            Historial de Pagos
          </Link>
        </div>
      </main>

      <footer className="border-t border-slate-800 bg-slate-950/30 py-8 text-center text-slate-500 text-sm mt-auto">
        <p>© {new Date().getFullYear()} TowIt - Tower App. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
