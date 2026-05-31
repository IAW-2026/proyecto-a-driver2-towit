import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import AppHeader from "@/components/layout/AppHeader";
import AppFooter from "@/components/layout/AppFooter";
import prisma from "@/lib/prisma";
import AccountDetailsForm from "@/components/account-details/AccountDetailsForm";

export default async function AccountDetailsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/home");
  }

  const clerkUser = await currentUser();

  if (!clerkUser) {
    // Esto no debería ocurrir si userId está presente, pero es una buena práctica
    redirect("/home"); 
  }

  // Obtener los datos del Tower de la base de datos
  const tower = await prisma.tower.findUnique({
    where: { clerk_id: userId },
  });

  if (!tower) {
    // Si el usuario no existe en nuestra base de datos (por ejemplo, después de un registro pero antes del webhook),
    // podríamos redirigirlo o mostrar un mensaje de error.
    // Por ahora, redirigimos a home.
    redirect("/home");
  }

  // Datos para el perfil (imagen y nombre completo de Clerk)
  const userProfile = {
    imageUrl: clerkUser.imageUrl,
    fullName: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim(),
    // Mockeamos la calificación promedio
    avgRating: 4.8, 
  };

  // Datos del formulario (de nuestra base de datos Tower)
  const formData = {
    clerk_id: tower.clerk_id,
    email: tower.email,
    full_name: tower.full_name,
    payments_alias: tower.payments_alias,
  };

  return (
    <div className="min-h-screen bg-slate-900/50 text-slate-100 flex flex-col">
      <AppHeader />
      <main className="flex-1 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-2xl bg-slate-900 p-8 rounded-lg shadow-lg border border-slate-800">
          <AccountDetailsForm userProfile={userProfile} towerData={formData} />
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
