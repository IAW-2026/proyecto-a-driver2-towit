import AppHeader from "@/components/layout/AppHeader";
import AppFooter from "@/components/layout/AppFooter";
import UserProfileSummary from "@/components/dashboard/UserProfileSummary";
import MonthlyTripsSummary from "@/components/dashboard/MonthlyTripsSummary";
import RecentTripsList from "@/components/dashboard/RecentTripsList";
import { auth } from "@clerk/nextjs/server";
import { getMonthlyAssignmentCounts } from "@/app/actions/assignments";
import { getAverageRatingForCustomer } from "@/app/actions/feedback"; // Importar la acción para obtener calificación
import { getTowerIdByClerkId } from "@/app/actions/tower"; // Importar para obtener towerId

export default async function DashboardPage() {
  const { userId } = await auth();

  let currentMonthAssignments = 0;
  let previousMonthAssignments = 0;
  let towerAvgRating: number | null = null; // Inicializar la calificación promedio de la torre

  if (userId) {
    const countsResponse = await getMonthlyAssignmentCounts();
    if (countsResponse.success) {
      currentMonthAssignments = countsResponse.currentMonthCount || 0;
      previousMonthAssignments = countsResponse.previousMonthCount || 0;
    } else {
      console.error("Error al cargar conteos de asignaciones:", countsResponse.error);
    }

    // Obtener la calificación de la torre
    const towerData = await getTowerIdByClerkId(userId);
    if (towerData?.towerId) {
      // Usar getAverageRatingForCustomer con el towerId, según la indicación
      const ratingResponse = await getAverageRatingForCustomer(towerData.towerId);
      if (ratingResponse.success) {
        towerAvgRating = ratingResponse.rating || null;
      } else {
        console.error("Error al cargar la calificación de la torre:", ratingResponse.error);
      }
    }
  }

  return (
    <div className="min-h-screen bg-slate-900/50 text-slate-100 flex flex-col">
      <AppHeader />
      <main className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-8">Dashboard</h1>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 grid-flow-row-dense">
            {/* Sección 1: Resumen de detalles de usuario (3 columnas de ancho, 1 fila de alto) */}
            <div className="md:col-span-3 md:row-span-1 h-full">
              <UserProfileSummary
                avgRating={towerAvgRating} // Pasar la calificación promedio de la torre como prop
              />
            </div>

            {/* Sección 2: Cantidad de viajes realizados en el mes (1 columna de ancho, 1 fila de alto) */}
            <div className="md:col-span-1 md:row-span-1 h-full">
              <MonthlyTripsSummary
                currentMonthCount={currentMonthAssignments}
                previousMonthCount={previousMonthAssignments}
              />
            </div>

            {/* Sección 3: Listado de viajes (2 columnas de ancho, 2 filas de alto) */}
            <div className="md:col-span-4 md:row-span-2">
              <RecentTripsList />
            </div>
          </div>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
