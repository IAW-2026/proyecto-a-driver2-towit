import ServicePageClient from "@/components/service/ServicePageClient"; // Importar el nuevo Client Component
import { getTowerAvailabilityStatus } from "@/app/actions/redis-tower"; // Importar la acción de Redis

export default async function ServicePage() {
  // Obtener el estado inicial de disponibilidad de Redis en el Server Component
  const initialIsAvailable = await getTowerAvailabilityStatus();

  return (
    // ServicePageClient ya incluye ServiceHeader y InteractiveMap
    <ServicePageClient initialIsAvailable={initialIsAvailable} />
  );
}
