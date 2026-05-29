'use client'

import { SignInButton, SignUpButton } from "@clerk/nextjs";
// Link is not explicitly needed here as it was for authenticated routes that are now in TowerDashboard

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Header for unauthenticated users */}
      <header className="border-b border-slate-800 bg-slate-950/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black tracking-wider text-yellow-500">Tow<span className="text-white">It</span></span>
            <span className="bg-yellow-500/10 text-yellow-500 text-xs font-semibold px-2 py-0.5 rounded border border-yellow-500/20">Towers</span>
          </div>

          <nav className="flex items-center gap-4">
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
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-20 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-yellow-500/10 text-yellow-500 text-sm font-medium px-3 py-1 rounded-full border border-yellow-500/20 mb-6">
          ⚡ Únete a la red de auxilio mecánico independiente
        </div>
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white mb-6">
          Genera ingresos remolcando con <span className="text-yellow-500">TowIt</span>
        </h1>
        <p className="text-lg sm:text-xl text-slate-400 mb-10 max-w-2xl">
          La plataforma que conecta a conductores de grúas con clientes que necesitan asistencia en tiempo real. Trabaja por tu cuenta, maneja tus horarios y recibe pagos al instante.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center w-full max-w-md">
          <SignUpButton mode="modal">
            <button className="bg-yellow-500 hover:bg-yellow-400 text-slate-950 text-lg font-bold px-8 py-4 rounded-xl transition-all shadow-xl shadow-yellow-500/20 w-full">
              Comenzar como Tower
            </button>
          </SignUpButton>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20 w-full text-left">
          <div className="bg-slate-950/40 border border-slate-800 p-6 rounded-2xl">
            <div className="text-yellow-500 text-3xl mb-4">💰</div>
            <h3 className="text-lg font-bold text-white mb-2">Pagos Inmediatos</h3>
            <p className="text-slate-400 text-sm">
              Recibe la liquidación de tus servicios directamente en tu alias de pago tan pronto como confirmes la finalización del viaje.
            </p>
          </div>
          <div className="bg-slate-950/40 border border-slate-800 p-6 rounded-2xl">
            <div className="text-yellow-500 text-3xl mb-4">📅</div>
            <h3 className="text-lg font-bold text-white mb-2">Flexibilidad Total</h3>
            <p className="text-slate-400 text-sm">
              Ponte disponible o no disponible con un solo toque. Tú decides cuándo y cuánto trabajar.
            </p>
          </div>
          <div className="bg-slate-950/40 border border-slate-800 p-6 rounded-2xl">
            <div className="text-yellow-500 text-3xl mb-4">📍</div>
            <h3 className="text-lg font-bold text-white mb-2">Navegación Inteligente</h3>
            <p className="text-slate-400 text-sm">
              Visualiza la ubicación del cliente y el recorrido óptimo en tiempo real con nuestro mapa integrado de alta precisión.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950/30 py-8 text-center text-slate-500 text-sm">
        <p>© {new Date().getFullYear()} TowIt - Tower App. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
