import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import AppHeader from "@/components/layout/AppHeader";
import AppFooter from "@/components/layout/AppFooter";
import UserProfileSummary from "@/components/dashboard/UserProfileSummary";
import MonthlyTripsSummary from "@/components/dashboard/MonthlyTripsSummary";
import RecentTripsList from "@/components/dashboard/RecentTripsList";
import WeeklyEarningsChart from "@/components/dashboard/WeeklyEarningsChart";
import RecentPaymentsList from "@/components/dashboard/RecentPaymentsList";

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/home"); // Redirigir si el usuario no está autenticado
  }

  // No necesitamos obtener datos de Clerk o Prisma aquí directamente
  // Los componentes del dashboard pueden manejar su propia carga de datos o usar useUser()

  return (
    <div className="min-h-screen bg-slate-900/50 text-slate-100 flex flex-col">
      <AppHeader />
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-8">Dashboard</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Sección 1: Resumen de detalles de usuario */}
            <div className="md:col-span-1">
              <UserProfileSummary />
            </div>

            {/* Sección 2: Cantidad de viajes realizados en el mes */}
            <div className="md:col-span-1">
              <MonthlyTripsSummary />
            </div>

            {/* Sección 4: Resumen de ganancias de la última semana (ocupa dos columnas en md+) */}
            <div className="md:col-span-2 lg:col-span-1"> {/* Adjusted to fit 3 columns on large screens */}
              <WeeklyEarningsChart />
            </div>

            {/* Sección 3: Listado de viajes */}
            <div className="md:col-span-1">
              <RecentTripsList />
            </div>

            {/* Sección 5: Listado de pagos desembolsados */}
            <div className="md:col-span-1">
              <RecentPaymentsList />
            </div>
          </div>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
