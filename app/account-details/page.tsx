import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import AppHeader from "@/components/layout/AppHeader";
import AppFooter from "@/components/layout/AppFooter";
import AccountDetailsForm from "@/components/account-details/AccountDetailsForm";

export default async function AccountDetailsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/home");
  }

  // AccountDetailsForm ahora carga sus propios datos internamente,
  // por lo que no es necesario pasar userProfile ni towerData como props aquí.

  return (
    <div className="min-h-screen bg-slate-900/50 text-slate-100 flex flex-col">
      <AppHeader />
      <main className="flex-1 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-2xl bg-slate-900/70 p-8 rounded-lg shadow-lg border border-slate-800">
          <AccountDetailsForm />
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
