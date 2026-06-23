import AppHeader from "@/components/layout/AppHeader";
import AppFooter from "@/components/layout/AppFooter";
import TripList from "@/components/trips/TripList";
import { auth } from "@clerk/nextjs/server";
import { getTripsForUser, Trip } from "@/app/actions/trips"; // CAMBIO: Importar la Server Action y la interfaz Trip


// CAMBIO: TripsPage ahora es un componente de servidor asíncrono para obtener los datos
export default async function TripsPage() {
  const { userId } = await auth(); // Obtener el userId del usuario autenticado

  if (!userId) {
    // CAMBIO: Si no hay userId, se considera un error o se redirige.
    // Para este contexto, se devolverá un error para que TripList lo muestre.
    return (
      <div className="min-h-screen bg-slate-900/50 text-slate-100 flex flex-col">
        <AppHeader />
        <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-white mb-8">Mis Viajes</h1>
            <TripList trips={[]} isLoading={false} error="No hay usuario autenticado para cargar viajes." />
          </div>
        </main>
        <AppFooter />
      </div>
    );
  }

  // REMOVIDO: customerAppUrl ya no se necesita aquí.

  let tripsData: Trip[] = [];
  let isLoading = true;
  let error: string | null = null;

  try {
    // CAMBIO: Llamar directamente a la Server Action
    const result = await getTripsForUser(userId);

    if (result.error) {
      throw new Error(result.error);
    }
    
    tripsData = result.trips || []; // La Server Action ya maneja el caso de no encontrar viajes

  } catch (err: any) {
    console.error("Error fetching trips:", err);
    error = "Error al cargar los viajes: " + err.message;
  } finally {
    isLoading = false;
  }

  return (
    <div className="min-h-screen bg-slate-900/50 text-slate-100 flex flex-col">
      <AppHeader />
      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-8">Mis Viajes</h1>
          {/* CAMBIO: Se pasan los datos obtenidos y el estado a TripList */}
          <TripList trips={tripsData} isLoading={isLoading} error={error} />
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
