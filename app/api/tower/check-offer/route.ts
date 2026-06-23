import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis-client';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tower_id = searchParams.get('tower_id');

    if (!tower_id) {
      return NextResponse.json({ success: false, error: 'Falta el tower_id' }, { status: 400 });
    }

    // 1. Mirar si este tower tiene una oferta activa asignada
    const offerPointerKey = `tower:active-offer:${tower_id}`;
    const activeOffer = await redis.hgetall(offerPointerKey);

    // Si no hay oferta, respondemos rápido con un 200 vacío
    if (!activeOffer || !activeOffer.trip_id) {
      return NextResponse.json({ has_offer: false });
    }

    const tripId = activeOffer.trip_id;

    // 2. Obtener los datos del viaje para mostráselos en la pantalla al chofer
    const tripData = await redis.hgetall(`trip:request:${tripId}`);
    
    // Si el viaje se canceló o cambió de estado justo en el medio, limpiamos y salimos
    if (!tripData || tripData.status !== 'pending') {
      await redis.del(offerPointerKey);
      return NextResponse.json({ has_offer: false });
    }

    // 3. CALCULAR EL TIEMPO RESTANTE REAL
    // QStash tiene un timeout de 15 segundos (15000 ms)
    const offeredAt = parseInt(activeOffer.offered_at as string, 10);
    const now = Date.now();
    const elapsedTime = now - offeredAt;
    const totalTimeout = 15000; // 15 segundos en milisegundos

    const msRemaining = totalTimeout - elapsedTime;
    const secondsRemaining = Math.max(0, Math.ceil(msRemaining / 1000));

    // Si el tiempo ya expiró pero QStash todavía no ejecutó el endpoint de timeout,
    // no le mostramos la oferta al chofer para evitar frustración
    if (secondsRemaining <= 0) {
      return NextResponse.json({ has_offer: false });
    }

    // 4. Devolver la oferta con los datos y el tiempo sincronizado
    return NextResponse.json({
      has_offer: true,
      time_remaining: secondsRemaining, // Ej: 12 (el frontend sabe que cuenta desde 12)
      trip: {
        id: tripData.trip_id,
        customer_id: tripData.customer_id,
        origin: { lat: tripData.trip_origin_lat, long: tripData.trip_origin_long },
        destination: { lat: tripData.trip_destination_lat, long: tripData.trip_destination_long },
        vehicle: {
          brand: tripData.vehicle_brand,
          model: tripData.vehicle_model,
          year: parseInt(tripData.vehicle_year as string, 10)
        },
        preferred_tow_type: tripData.preferred_tow_type
      }
    });

  } catch (error: any) {
    console.error('Error en check-offer:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}