import AppHeader from "@/components/layout/AppHeader";
import AppFooter from "@/components/layout/AppFooter";
import TripList from "@/components/trips/TripList";
import { auth } from "@clerk/nextjs/server";
import { getTripsForUser, Trip } from "@/app/actions/trips"; // CAMBIO: Importar la Server Action y la interfaz Trip
import Link from "next/link"; // ADDED: Para los enlaces de paginación

interface TripsPageProps {
  searchParams?: { [key: string]: string | string[] | undefined };
}

// CAMBIO: TripsPage ahora es un componente de servidor asíncrono para obtener los datos
export default async function TripsPage({ searchParams }: TripsPageProps) {
  const { userId } = await auth(); // Obtener el userId del usuario autenticado

  const currentPage = Number((await searchParams)?.page) || 1;
  const limit = Number((await searchParams)?.limit) || 10;

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

  let tripsData: Trip[] = [];
  let isLoading = true;
  let error: string | null = null;
  let totalPages = 0;
  let currentFetchedPage = 1;

  try {
    // CAMBIO: Llamar directamente a la Server Action con parámetros de paginación
    const result = await getTripsForUser(userId, currentPage, limit);

    if (result.error) {
      throw new Error(result.error);
    }
    
    tripsData = result.trips || []; // La Server Action ya maneja el caso de no encontrar viajes
    totalPages = result.totalPages || 0;
    currentFetchedPage = result.currentPage || currentPage;

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

          {/* ADDED: Controles de paginación */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {currentFetchedPage > 1 && (
                <Link
                  href={`/trips?page=${currentFetchedPage - 1}&limit=${limit}`}
                  className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-slate-950 rounded-md font-bold transition-colors"
                >
                  Anterior
                </Link>
              )}
              <span className="px-4 py-2 text-slate-100">
                Página {currentFetchedPage} de {totalPages}
              </span>
              {currentFetchedPage < totalPages && (
                <Link
                  href={`/trips?page=${currentFetchedPage + 1}&limit=${limit}`}
                  className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-slate-950 rounded-md font-bold transition-colors"
                >
                  Siguiente
                </Link>
              )}
            </div>
          )}
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
