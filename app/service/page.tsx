import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import ServicePageClient from "@/components/service/ServicePageClient"; // Importar el nuevo Client Component

export default async function ServicePage() {
  const { userId, sessionClaims } = await auth();

  if (!userId) {
    redirect("/home"); // Redirigir si el usuario no está autenticado
  }

  const userRole = sessionClaims?.role as string | undefined;

  // Redirigir si el usuario no tiene el rol de 'tower'
  if (userRole !== 'tower') {
    redirect("/dashboard"); // O a una página de acceso denegado si existe
  }

  return (
    // ServicePageClient ya incluye ServiceHeader y InteractiveMap
    <ServicePageClient />
  );
}
