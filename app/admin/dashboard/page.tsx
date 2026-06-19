import AdminDashboard from "@/components/admin/AdminDashboard";
// Redirección manejada por el middleware (proxy.ts)

export default async function AdminPage() {
  // Redirección manejada por el middleware (proxy.ts)

  return (
    <>
      <h1 className="text-3xl font-bold text-white mb-8">Panel de Administración</h1>
      <AdminDashboard />
    </>
  );
}
