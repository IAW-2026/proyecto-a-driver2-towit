import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import AppHeader from "@/components/layout/AppHeader";
import AppFooter from "@/components/layout/AppFooter";
import VehicleList from "@/components/vehicles/VehicleList"; // Importar el componente de lista de vehículos

export default async function VehiclesPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/home"); // Redirigir si el usuario no está autenticado
  }

  return (
    <div className="min-h-screen bg-slate-900/50 text-slate-100 flex flex-col">
      <AppHeader />
      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-8">Mis Vehículos</h1>
          <VehicleList />
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
