'use client';

import { SignInButton, SignUpButton, UserAvatar, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { useAccountDetailsModal } from "@/components/providers/AccountDetailsModalProvider"; // Importar el hook

export default function AppHeader() {
  const { isSignedIn } = useUser();
  const { openModal } = useAccountDetailsModal(); // Usar el hook para obtener openModal

  return (
    <header className="border-b border-slate-800 bg-slate-950/50 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-black tracking-wider text-yellow-500">Tow<span className="text-white">It</span></span>
          <span className="bg-yellow-500/10 text-yellow-500 text-xs font-semibold px-2 py-0.5 rounded border border-yellow-500/20">Towers</span>
        </div>

        <nav className="flex items-center gap-4">
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
              <Link href="/trips" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
                Mis Viajes
              </Link>
              <Link href="/vehicles" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
                Mis Vehículos
              </Link>
              <button
                onClick={openModal} // Llamar a openModal del contexto
                className="text-sm font-medium text-slate-300 hover:text-white transition-colors flex items-center justify-between space-x-2 cursor-pointer"
              >
                <span>Mi Cuenta</span>
                <UserAvatar />
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
