import { NextResponse } from 'next/server';
import { z } from 'zod'; // Para validación de esquema
import { validateApiKey, unauthorizedResponse, AdminActionResponse } from '@/lib/apiAuth';
import { redis } from '@/app/actions/redis-tower'; // Importamos el cliente Redis

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

    const availableTowerClerkIds = await redis.geosearch(
      'towers:locations:available',
      { type: 'FROMLONLAT', coordinate: { lon: originLng, lat: originLat } },
      { type: "BYRADIUS", radius: 5, radiusType: "KM" },
      "ASC"
    );

    if (!availableTowerClerkIds || availableTowerClerkIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No se pudieron encontrar towers disponibles en este momento.' },
        { status: 404 }
      );
    }

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
