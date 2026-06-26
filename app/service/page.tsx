import { auth } from "@clerk/nextjs/server"; // Importar auth
import ServicePageClient from "@/components/service/ServicePageClient";
import { getTowerAvailabilityStatus, getTowerInitialVehicle, VehicleProfileData } from "@/app/actions/redis-tower"; // Importar nuevas acciones e interfaz
import { getTowerVehicles } from "@/app/actions/vehicle"; // Importar acción para obtener vehículos de la DB

export default async function ServicePage() {
  const { userId } = await auth(); // Obtener el userId del usuario logueado

  // Obtener el estado inicial de disponibilidad de Redis
  const initialIsAvailable = await getTowerAvailabilityStatus();
  let initialVehicle: VehicleProfileData | null = null;

  if (userId) {
    // Intentar obtener el vehículo registrado en Redis
    const vehicleFromRedis = await getTowerInitialVehicle();

    if (vehicleFromRedis) {
      // Si anteriormente se estableció un vehículo para el tower, usar ese
      initialVehicle = vehicleFromRedis;
    } else {
      // Si no se obtuvo un vehículo de Redis
      // intentar obtener el primer vehículo del usuario de la base de datos.
      const dbVehiclesResponse = await getTowerVehicles();
      if (dbVehiclesResponse.success && dbVehiclesResponse.data && Array.isArray(dbVehiclesResponse.data) && dbVehiclesResponse.data.length > 0) {
        const firstDbVehicle = dbVehiclesResponse.data[0];
        initialVehicle = {
          brand: firstDbVehicle.brand,
          model: firstDbVehicle.model,
          year: firstDbVehicle.year,
          max_load: firstDbVehicle.max_load,
        };
      }
    }
  }

  return (
    <ServicePageClient
      initialIsAvailable={initialIsAvailable}
      initialVehicle={initialVehicle} // Pasar el vehículo inicial como prop
    />
  );
}
