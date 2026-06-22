import { SignOutButton } from '@clerk/nextjs';

export default function DeactivatedUserPage() {
  return (
    <div className="min-h-screen bg-slate-900/50 text-slate-100 flex flex-col items-center justify-center p-4">
      <div className="bg-slate-900/70 p-8 rounded-lg shadow-lg border border-slate-800 text-center max-w-md w-full">
        <h1 className="text-3xl text-left font-bold text-yellow-500 mb-4">Cuenta desactivada :(</h1>
        <p className="text-left text-slate-300 mb-6 text-wrap">
          Tu cuenta ha sido desactivada por un administrador.
          Si crees que esto es un error, por favor contacta al soporte.
        </p>
        <div className="mt-6 flex justify-end">
          <SignOutButton>
            <button className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
              Cerrar Sesión
            </button>
          </SignOutButton>
        </div>
      </div>
    </div>
  );
}
