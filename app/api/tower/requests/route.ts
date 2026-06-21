import { NextResponse } from 'next/server';
import { z } from 'zod'; // Para validación de esquema
import { validateApiKey, unauthorizedResponse, AdminActionResponse } from '@/lib/apiAuth';
import { redis } from '@/lib/redis-client'; // Importamos el cliente Redis

// Esquema de validación para el cuerpo de la solicitud POST
const requestBodySchema = z.object({
  customer_id: z.string(),
  trip: z.object({
    id: z.string(), // trip_id
    origin: z.object({ lat: z.string(), long: z.string() }),
    destination: z.object({ lat: z.string(), long: z.string() }),
  }),
  vehicle_data: z.object({
    brand: z.string(),
    model: z.string(),
    year: z.number(),
  }),
  preferred_tow_type: z.string(),
});

/**
 * POST /api/tower/requests
 * Sube una solicitud de viaje a Redis con estado "pending".
 * La Customer App llama a este endpoint.
 */
export async function POST(req: Request): Promise<NextResponse<AdminActionResponse>> {
  if (!(await validateApiKey(req))) {
    return unauthorizedResponse();
  }

  try {
    const jsonBody = await req.json();
    const parsedBody = requestBodySchema.safeParse(jsonBody);

    if (!parsedBody.success) {
      return NextResponse.json(
        { success: false, error: 'Datos de solicitud inválidos.', details: parsedBody.error.flatten() },
        { status: 400 }
      );
    }

    const { customer_id, trip, preferred_tow_type, vehicle_data } = parsedBody.data;

    // 1. Verificar si hay towers disponibles en Redis para cumplir la condición de error.
    // Aunque no se asignará aquí, se necesita saber si hay *algún* tower en el sistema de geolocalización.
    const originLng = parseFloat(trip.origin.long);
    const originLat = parseFloat(trip.origin.lat);

    if (isNaN(originLng) || isNaN(originLat)) {
      return NextResponse.json(
        { success: false, error: 'Coordenadas de origen inválidas.' },
        { status: 400 }
      );
    }

    const rawGeosearchResults = await redis.geosearch(
      'towers:locations:available',
      { type: 'FROMLONLAT', coordinate: { lon: originLng, lat: originLat } },
      { type: "BYRADIUS", radius: 5, radiusType: "KM" },
      "ASC"
    );

    // Mapear los resultados para extraer solo el 'member' (clerk_id)
    const rawTowerClerkIds: string[] = rawGeosearchResults.map(item => {
      // El tipo 'unknown' en 'member' nos obliga a una aserción de tipo o una verificación más robusta
      // Asumimos que 'item' es un objeto con una propiedad 'member' de tipo string, basado en el error reportado.
      if (typeof item === 'string') { // Si geosearch devuelve un array de strings (sin WITHDIST/WITHCOORD)
        return item;
      }
      // Si geosearch devuelve un array de objetos (ej. con WITHDIST/WITHCOORD implícito/explícito)
      return (item as { member: string }).member;
    });

    if (!rawTowerClerkIds || rawTowerClerkIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No se pudieron encontrar towers disponibles en este momento.' },
        { status: 404 }
      );
    }

    // Implementar Estrategia de Limpieza Pasiva:
    // 1. Filtrar towers que no tienen un heartbeat activo
    const heartbeatChecks = await Promise.all(
      rawTowerClerkIds.map(towerId => redis.exists(`tower:heartbeat:${towerId}`))
    );

    const availableTowerClerkIds: string[] = [];
    const cleanupPipeline = redis.pipeline();

    rawTowerClerkIds.forEach((towerId, index) => {
      if (heartbeatChecks[index]) {
        availableTowerClerkIds.push(towerId);
      } else {
        // Si el heartbeat no existe:
        // 1. Limpiar del GeoSet
        cleanupPipeline.zrem('towers:locations:available', towerId);
        // 2. Marcar el perfil del tower como "unavailable"
        cleanupPipeline.hset(`tower:profile:${towerId}`, { status: 'unavailable' });
        console.log(`[Lazy Cleanup] Tower ${towerId} sin heartbeat, removiendo de GeoSet y marcando como UNAVAILABLE en el perfil.`);
      }
    });

    // Ejecutar las operaciones de limpieza en segundo plano
    await cleanupPipeline.exec().catch(error => {
      console.error("Error durante la ejecución del pipeline de limpieza de GeoSet:", error);
    });

    if (availableTowerClerkIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No se pudieron encontrar towers activos disponibles en este momento.' },
        { status: 404 }
      );
    }

    // CONTINUAR CON LA LÓGICA DE ASIGNACIÓN A UN TOWER DISPONIBLE.
    // NOTA: Actualmente solo verifica si existe *al menos uno*.
    // La lógica de asignación real (ej. al Tower más cercano) no está implementada aquí
    // pero el filtrado de towers inactivos ya se ha realizado.

    // 2. Subir la solicitud a Redis en formato HASH
    // Se asigna un TTL para que las solicitudes no procesadas expiren.
    const requestKey = `trip:request:${trip.id}`;
    const requestData = {
      customer_id: customer_id,
      trip_id: trip.id,
      trip_origin_lat: trip.origin.lat,
      trip_origin_long: trip.origin.long,
      trip_destination_lat: trip.destination.lat,
      trip_destination_long: trip.destination.long,
      vehicle_brand: vehicle_data.brand,
      vehicle_model: vehicle_data.model,
      vehicle_year: vehicle_data.year,
      preferred_tow_type: preferred_tow_type,
      status: 'pending', // Estado inicial
      // Los campos tower_clerk_id, tower_location_lat/long se añadirán cuando la solicitud sea aceptada por otra lógica
    };

    // Usar Pipeline para HSET y EXPIRE de forma atómica
    await redis.pipeline()
      .hset(requestKey, requestData)
      .expire(requestKey, 300) // Expira en 5 minutos (300 segundos)
      .exec();

    console.log(`Solicitud de viaje ${trip.id} creada en Redis con estado 'pending'.`);

    return NextResponse.json({ success: true, data: { trip_id: trip.id, status: 'pending' } }, { status: 200 });
  } catch (error: any) {
    console.error('Error al procesar solicitud de tower:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno del servidor al procesar la solicitud.' },
      { status: 500 }
    );
  }
}
