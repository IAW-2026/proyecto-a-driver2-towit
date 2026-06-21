import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis-client';

export async function POST(req: Request) {
  try {
    const { trip_id, tower_id, final_lat, final_long } = await req.json();

    const requestKey = `trip:request:${trip_id}`;
    const trip = await redis.hgetall(requestKey);

    if (!trip || trip.status !== 'accepted') {
      return NextResponse.json({ success: false, error: 'El viaje no está en estado aceptado o no existe.' }, { status: 400 });
    }

    const updatePipeline = redis.pipeline();

    // 1. Pasar el viaje a 'completed'
    updatePipeline.hset(requestKey, { status: 'completed' });

    // 2. Volver a meter al chofer en la lista de disponibles (GeoSet) con su ubicación final
    updatePipeline.geoadd('towers:locations:available', {
        longitude: parseFloat(final_long),
        latitude: parseFloat(final_lat),
        member: tower_id,
    });
    
    // 3. Cambiar su estado en el perfil a 'available'
    updatePipeline.hset(`tower:profile:${tower_id}`, { status: 'available' });

    // 4. Actualizar el heartbeat para que la limpieza pasiva no lo borre al instante
    updatePipeline.set(`tower:heartbeat:${tower_id}`, 'active', { ex: 60 }); // 1 minuto de gracia

    await updatePipeline.exec();

    console.log(`[Fin de Viaje] Viaje ${trip_id} completado. Tower ${tower_id} vuelve a estar disponible.`);
    return NextResponse.json({ success: true, status: 'completed' });

  } catch (error: any) {
    console.error('Error en api/tower/complete:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}