import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import AdminDashboard from "@/components/admin/AdminDashboard";

export default async function AdminPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/home"); // Redirigir si el usuario no está autenticado
  }

  const client = await clerkClient()
  const user = await client.users.getUser(userId);

  if (user.publicMetadata?.role !== 'admin') {
    redirect("/home"); // Redirigir si el usuario no es administrador
  }

  return (
    <>
      <h1 className="text-3xl font-bold text-white mb-8">Panel de Administración</h1>
      <AdminDashboard />
    </>
  );
}
