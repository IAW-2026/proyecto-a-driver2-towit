import ServicePageClient from "@/components/service/ServicePageClient"; // Importar el nuevo Client Component
// Redirección manejada por el middleware (proxy.ts)

export default async function ServicePage() {
  // Redirección manejada por el middleware (proxy.ts)

  return (
    // ServicePageClient ya incluye ServiceHeader y InteractiveMap
    <ServicePageClient />
  );
}
