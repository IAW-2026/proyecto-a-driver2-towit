import AppHeader from "@/components/layout/AppHeader";
import AppFooter from "@/components/layout/AppFooter";
import PaymentList from "@/components/payments/PaymentList";

export default async function PaymentsPage() {
  return (
    <div className="min-h-screen bg-slate-900/50 text-slate-100 flex flex-col">
      <AppHeader />
      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-8">Mis Liquidaciones</h1>
          <PaymentList />
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
