'use server';

import { auth } from "@clerk/nextjs/server";
import { redis } from "@/lib/redis-client"; // Importa la instancia de Redis desde el nuevo archivo

export interface VehicleProfileData {
  brand: string;
  model: string;
  year: number;
  max_load: number;
}

export async function getTowerAvailabilityStatus(): Promise<boolean> {
  const { userId } = await auth();

  if (!userId) {
    console.warn("No user ID found, cannot fetch tower availability status.");
    return false; // Default to unavailable if no user is logged in
  }

  try {
    const towerProfile = await redis.hgetall(`tower:profile:${userId}`);
    if (towerProfile && towerProfile.status === 'available') {
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error fetching tower availability status from Redis:", error);
    return false;
  }
}

/**
 * NUEVO: Acción de servidor para obtener los detalles del vehículo inicial de un tower desde Redis.
 */
export async function getTowerInitialVehicle(): Promise<VehicleProfileData | null> {
  const { userId } = await auth();

  if (!userId) {
    console.warn("No user ID found, cannot fetch tower initial vehicle.");
    return null;
  }

  try {
    const towerProfile = await redis.hgetall(`tower:profile:${userId}`);
    if (towerProfile && towerProfile.vehicle) {
      return towerProfile.vehicle as unknown as VehicleProfileData;
    }
    return null;
  } catch (error) {
    console.error("Error fetching tower initial vehicle from Redis:", error);
    return null;
  }
}

/**
 * NUEVO: Acción de servidor para actualizar la ubicación del Tower en un viaje activo en Redis.
 */
export async function updateTowerLocationInActiveTrip(
  tripId: string,
  location: { lat: number, long: number }
): Promise<void> {
  const { userId } = await auth();

  if (!userId) {
    console.warn("No user ID found, cannot update tower location in active trip.");
    return;
  }
  if (!tripId || !location || !location.lat || !location.long) {
    console.warn(`Invalid data provided for updating active trip location for user ${userId}.`);
    return;
  }

  const long = parseFloat(location.long.toString());
  const lat = parseFloat(location.lat.toString());

  if (isNaN(long) || isNaN(lat)) {
    console.warn(`Invalid location coordinates for updating active trip location for user ${userId}:`, location);
    return;
  }

  try {
    const requestKey = `trip:request:${tripId}`;
    await redis.hset(requestKey, {
      tower_location_lat: String(lat),
      tower_location_long: String(long),
    });
    // console.log(`Ubicación del Tower ${userId} actualizada para el viaje ${tripId}.`); // Descomentar para depuración
  } catch (error) {
    console.error(`Error actualizando la ubicación del Tower para el viaje ${tripId} en Redis:`, error);
  }
}

/**
 * Acción de servidor para cambiar el estado de disponibilidad de un tower,
 * actualizar su perfil en Redis, el GeoSet y el heartbeat.
 */
export async function toggleTowerAvailability(
  isAvailable: boolean,
  location: { lat: number, long: number } | null,
  vehicleDetails?: VehicleProfileData | null // Añadir detalles del vehículo
): Promise<boolean> {
  const { userId } = await auth();

  if (!userId) {
    console.error("No user ID found, cannot toggle tower availability.");
    return false;
  }

  const pipeline = redis.pipeline();
  const towerProfileData: { status: string; vehicle?: string } = { status: isAvailable ? 'available' : 'unavailable' };

  if (isAvailable) {
    // Si se pone disponible:
    if (vehicleDetails) {
      towerProfileData.vehicle = JSON.stringify(vehicleDetails);
    }
    pipeline.hset(`tower:profile:${userId}`, towerProfileData);

    // Si hay ubicación, se añade al GeoSet y se establece el heartbeat.
    // Esto coincide con la "Pipeline de Actualización Rutinaria" inicial de docs/redis-data-architecture.md
    if (location && location.lat && location.long) {
      const long = parseFloat(location.long.toString());
      const lat = parseFloat(location.lat.toString());
      if (!isNaN(long) && !isNaN(lat)) {
        pipeline.geoadd('towers:locations:available', { longitude: long, latitude: lat, member: userId });
        pipeline.set(`tower:heartbeat:${userId}`, '1', { ex: 30 });
      } else {
        console.warn(`Invalid location coordinates for GEOADD for user ${userId}:`, location);
      }
    } else {
      console.warn(`Location not provided for initial availability toggle for user ${userId}. Skipping GEOADD and heartbeat.`);
    }

    console.log(`Tower ${userId} puesto como AVAILABLE en Redis.`);
  } else {
    // Si se pone no disponible:
    pipeline.hset(`tower:profile:${userId}`, towerProfileData); // Actualizar solo el estado
    pipeline.zrem('towers:locations:available', userId); // Remover del GeoSet
    pipeline.del(`tower:heartbeat:${userId}`); // Eliminar heartbeat

    console.log(`Tower ${userId} puesto como UNAVAILABLE en Redis.`);
  }

  try {
    await pipeline.exec();
    return true;
  } catch (error) {
    console.error(`Error toggling tower availability for ${userId} in Redis:`, error);
    return false;
  }
}

/**
 * Acción de servidor para refrescar la ubicación del tower en el GeoSet
 * y renovar su heartbeat en Redis.
 * Se llama periódicamente cuando el tower está disponible.
 */
export async function refreshTowerHeartbeatAndLocation(
  location: { lat: number, long: number }
): Promise<void> {
  const { userId } = await auth();

  if (!userId) {
    console.warn("No user ID found, cannot refresh tower location and heartbeat.");
    return;
  }
  if (!location || !location.lat || !location.long) {
    console.warn(`No valid location provided for refresh for user ${userId}.`);
    return;
  }

  const long = parseFloat(location.long.toString());
  const lat = parseFloat(location.lat.toString());

  if (isNaN(long) || isNaN(lat)) {
    console.warn(`Invalid location coordinates for refresh for user ${userId}:`, location);
    return;
  }

  try {
    // Usar pipeline para eficiencia, actualizando GeoSet y Heartbeat
    await redis.pipeline()
      .geoadd('towers:locations:available', { longitude: long, latitude: lat, member: userId })
      .set(`tower:heartbeat:${userId}`, '1', { ex: 30 }) // Renovar TTL a 30 segundos
      .hset(`tower:profile:${userId}`, { status: 'available' }) // Asegurar el estado 'available'
      .exec();
    // console.log(`Tower ${userId} location and heartbeat refreshed.`); // Descomentar para depuración intensiva
  } catch (error) {
    console.error(`Error refreshing tower location and heartbeat for ${userId} in Redis:`, error);
  }
}

